# Final ERP Performance Report

**Date:** 2026-08-18 (updated after screenshot diagnosis pass)  
**Scope:** End-to-end navigation, hydration, forms/mutations, client cache, Redis, Mongo, auth  
**Method:** Profile first → root cause → fix → re-measure. No speculative optimizations.

---

## Customer Due + My Tasks Fix (2026-08-18 PM — Pass 4)

| Issue | Root cause | Fix |
|-------|------------|-----|
| Customer Due empty table | `listCustomerReceivables()` iterates customers but route hydration trimmed customers away | Restore `customers` + `invoices` (limit 100) on `/accounting/receivables`; merge customer rows in `buildReceivableAppState` |
| Customer Due slow (4 GETs) | payments + cashbox fetched on every mount | `cacheOnly` + `skipInitialFetch`; load payments/cashbox only when Receive Payment opens |
| My Tasks slow every revisit | `/pm-tasks/my` uncached; inherits `/projects` hydration (employees + pmProjects) | Dedicated `/projects/my-tasks: []` route; 60s client cache for `fetchMyPmTasks()`; SWR on revisit |
| Skeleton "timer" | User perception | **No artificial delay** — skeleton duration = real network time (~500ms/request) |

**Route hydration verification:** 37/37 passed.

---

User reported Balance Sheet (and full site) re-fetches on every navigation despite Redis. Root cause: **client-side** architecture gaps, not Redis failure.

| Issue | Fix |
|-------|-----|
| Hydrator `limit=25` vs page `limit=500` (Balance Sheet, Trial, P&L, Salary) | Unified `route-table-config.ts` — single source of truth for all 60+ routes |
| `/balance-sheet/summary` refetch on every mount | Client summary cache (60s TTL + in-flight dedup) in `accounting-api-service.ts` |
| Duplicate GET when cache stale (hydrator + hook) | In-flight GET coalescing in `fetchResourcePage` |
| 15s TTL too aggressive for ERP navigation | Tiered TTLs: reports 2min, standard 60s, realtime 15s, master 5min |
| Stale cache still blocks UI | Stale-while-revalidate in `usePaginatedApiResource` |
| Extended backend routes uncached (450ms+ Mongo every GET) | `cacheGetResponse` on all `extendedRoutes.ts` list GETs (30s/60s) |
| Over-eager lookup hydration on list pages | Trimmed lookups; receivables/payables primary-only; inventory lookups on form open |
| Empty list cache ignored | Fixed `cached?.length` → `cached !== null` |

**Expected Balance Sheet after fix:**
- First visit: 1× `balance-sheet?limit=500` + 1× `summary` (not 25+500+summary)
- Revisit within 60s: **0 network requests** (client cache)
- Server miss: Redis HIT ~10–50ms instead of 450ms+ Mongo

**Route hydration verification:** 35/35 static cases passed (`verify-route-hydration.mjs`).

---

## Post-Screenshot Fix Pass (2026-08-18 PM)

Root causes from Network tab screenshot:

| Issue | Fix |
|-------|-----|
| Duplicate `finished-goods` GET (hydrator + page hook) | `apiDataReady` gate + skip reload when cache fresh |
| Duplicate `categories/units/warehouses` GET | `useInventoryLookups` uses `cacheOnly` stores |
| Finished Goods navigated with 5 modules | Hydration trimmed to `finishedGoods` only |
| `audit-logs` POST on every mutation (~400ms) | 2s debounced queue; no immediate `saveAppState` |
| Slow lookup APIs on production | Backend Redis cache TTL 5min for employees/categories/units/warehouses |
| Product save-and-add blocked on SKU | `fetchNextProductSku` non-blocking |

**Redis in Network tab:** Never visible — Redis is server-side only. Verify via `/health` and response time on repeat GETs.

---

## A. Root Causes

### CONFIRMED

| # | Bottleneck | Evidence | Fix Applied |
|---|-----------|----------|-------------|
| 1 | Product form `openCreate` blocked on `fetchNextProductSku()` GET | Code audit + user-reported slow open | Lazy SKU fetch — form opens immediately, SKU fills in background |
| 2 | Customer mutations awaited silent 200-row `reload()` | `use-customers-module.ts` awaited `reload` on create/update/delete | Optimistic cache patch + non-blocking background sync |
| 3 | `inventoryStockController` sync `clearInventoryCaches()` before response | Code audit vs deferred `crudFactory` pattern | All 4 handlers now use `setImmediate(clearInventoryCaches)` |
| 4 | Employee create did not patch employees list cache | `EmployeeFormPage` used raw `createResource` + `router.push` | `prependToListCache` on successful create |
| 5 | Global over-hydration on admin routes | Prior Playwright: Dashboard→Users 11 GETs → **1 GET**; `verify-route-hydration.mjs` 15/15 pass | Already fixed; verified |
| 6 | Redis not configured in dev | `/health` → `redis: not_configured` | In-memory cache fallback **working** (dashboard 778ms → 17ms on repeat) |
| 7 | `authUserCache` effective | API perf: auth 348ms → 1ms on second request within 3s TTL | No change needed — working as designed |
| 8 | Product POST faster than Customer POST at API layer | `run-api-perf.mjs`: product 21ms vs customer 537ms Mongo-bound | Customer perceived speed was **frontend** (modal UX), not backend |

### SUSPECTED

| # | Issue | Why suspected | Action |
|---|-------|---------------|--------|
| 1 | Atlas Mongo list latency 350–1000ms | Measured on `/employees`, `/warehouses`, `/categories` without Redis | Enable `REDIS_URL` in production for dashboard + repeated lists |
| 2 | Sales Order duplicate lookups | Hydrator loads customers/employees/products on `/sales/orders/new`; form hooks may re-fetch | Needs browser trace when Playwright available on target OS |
| 3 | Customer Mongo write variance | 508ms–1183ms across runs | Monitor; possible duplicate-key retry or Atlas cold start |

---

## B. Navigation

Prior Playwright session (2026-08-18) + API route simulation (same day):

| Route | Requests Before (legacy) | Requests After | Removed | Nav Before ms | Nav/API After |
|-------|-------------------------:|---------------:|--------:|--------------:|--------------:|
| Dashboard → Users | ~11 list modules | **1** (auth only) | **10** | — | 0 list GETs |
| Dashboard → Customers | ~11 | **1** (customers) | 10 | — | 383ms API |
| Dashboard → Products | ~11 | **4** (products + lookups) | 7 unrelated | — | 2323ms API cold |
| Dashboard → Employees | ~11 | **1** (employees) | 10 | — | 391ms API |
| Dashboard → Sales Orders | ~11 | **1** (sales-orders) | 10 | — | 358ms API |
| Dashboard → Purchases | ~11 | **2** (PO + suppliers) | 9 | — | 1187ms API |
| Dashboard → Production | ~11 | **0** | 11 | — | 0 |
| Dashboard → CRM Leads | ~11 | **2** (leads + employees) | 9 | — | 1449ms API |
| Settings/Users | 11 unrelated | **0** list | 11 | 12076 | 0 |

**Route hydration verification:** 15/15 static cases passed (`verify-route-hydration.mjs`).

**RSC prefetch:** Sidebar hover prefetch removed in prior pass; Playwright re-run blocked on macOS 12 (no browser support).

**Client cache reuse:** Compatible cache reads via `findCompatibleListCache`; lookup tier 5min TTL for categories/units/warehouses.

---

## C. Form Performance

| Form | Submit Before (perceived) | Submit After | API Count | Main Bottleneck |
|------|--------------------------:|-------------:|----------:|-----------------|
| Customer | Fast (baseline) | Faster — no blocking reload | 1 POST | Mongo write ~508ms; was blocking 200-row GET |
| Product | Slow vs Customer | Improved open + same fast POST | 1 POST | Was `fetchNextProductSku` on open (fixed) |
| Supplier | Moderate | Unchanged path (already patched) | 1 POST | Mongo ~363ms |
| Employee | Slow return to list | Cache patch on create | 1 POST | Was list refetch on navigation (fixed) |
| Sales Order | Heavy lookups | Not re-measured E2E | 1+ POST + lookups | Hydrator + form deps (suspected) |
| Purchase Order | Moderate | Unchanged | 1 POST | Mongo list queries |
| Invoice | Not measured E2E | — | — | — |
| Production | Not measured E2E | — | — | — |

### Customer vs Product Comparison (measured API)

| Stage | Customer | Product | Difference |
|-------|---------:|--------:|-----------:|
| Auth | 2ms | 0ms | −2ms |
| Mongo | 508ms | 2ms | −506ms |
| Redis | 0ms | 0ms | 0 |
| Cache invalidation | async (deferred) | async (deferred) | 0 |
| Total POST | 537ms | 21ms | **−516ms** |
| Frontend open (before fix) | minimal | +SKU GET blocking | Product form open fixed |

**Key insight:** Customer felt faster because the UI returned after POST while Product blocked on SKU fetch at form **open**. Product POST is actually faster at the API layer.

---

## D. Redis

| Item | Status |
|------|--------|
| Connection | **NOT_CONFIGURED** (`REDIS_URL` unset in dev) |
| Health `/health` | `redis: not_configured` |
| SET/GET/TTL/DEL test | Skipped — no connection; endpoint at `/health/redis-test` ready |
| In-memory fallback | **WORKING** — dashboard summary 778ms → 17ms on repeat GET |
| Real app cache HIT | In-memory HIT (not Redis) |
| Tenant keys | `tenant:{tenantId}:...` in `buildTenantCacheKey()` |
| Invalidation | Targeted prefixes per mutation; deferred via `setImmediate` |

### Mutation → Cache Dependency Map

| Mutation | Invalidates | Does NOT invalidate |
|----------|-------------|---------------------|
| Product CRUD | products list, dashboard summary/top-products/alerts, reports | customers, employees, suppliers |
| Customer CRUD | customers list (client patch) | full ERP state |
| Stock approve/complete | inventory prefixes + dashboard (deferred) | unrelated CRM |
| crudFactory generic | `listCachePrefix` + dashboard + reports | other modules |

**Recommendation:** Set `REDIS_URL` in production to extend in-memory wins across processes.

---

## E. Slow APIs (>500ms)

| Endpoint | Duration | Mongo | Redis | Auth | Root Cause |
|----------|----------|------:|------:|-----:|------------|
| GET /customers?page=1&limit=10 | 383–632ms | ~366ms | miss | 1–4ms | Atlas query + no Redis |
| GET /warehouses?lookup=1 | 981ms | ~961ms | miss | 486ms | Cold auth + Mongo |
| GET /employees?lookup=1 | 1033ms | ~1024ms | miss | 368ms | Lookup aggregation |
| GET /categories?lookup=1 | 580ms | ~571ms | miss | 8ms | Mongo list |
| POST /customers | 537–1222ms | 508–1183ms | — | 2–6ms | Mongo insert |
| GET /dashboard/summary (1st) | 778ms | yes | in-memory miss | — | Aggregation |

---

## F. Mongo

| Query | Change |
|-------|--------|
| No new indexes added | List queries 350–1000ms are Atlas latency; 145 compound indexes already ensured at boot |
| Customer insert variance | Monitored; no index change without query profiler evidence |

---

## G. Client Cache

| Behavior | Status |
|----------|--------|
| Cache reuse | `findCompatibleListCache` + lookup tier (limit 100) |
| Duplicate request dedup | GET inflight dedup in `api-client.ts` + backend inflight MISS coalescing |
| Mutation patching | `prependToListCache` / `patchListCacheRow` on Product, Supplier, **Customer (new)**, **Employee (new)** |
| Invalidation | Targeted; hydrator no longer re-fetches on mutation event |
| TTL | Table 15s; master data 5min (`cache-policy.ts`) |

---

## H. Remaining Bottlenecks (evidence-backed only)

1. **Mongo/Atlas list latency** without Redis on large collections (employees lookup 1033ms measured)
2. **Redis not configured** in current dev environment — production should set `REDIS_URL`
3. **Sales Order form** — heavy required lookups; E2E dedup not verified (Playwright unavailable)
4. **Browser E2E navigation timing** — not re-run on this machine (macOS 12 Playwright limitation)

---

## I. Final Architecture

```
PAGE
  ↓
ROUTE REQUIREMENTS (resolveHydrationModules)
  ↓
CLIENT CACHE (compatible read / lookup tier)
  ↓
API (single GET per required module)
  ↓
IN-MEMORY or REDIS HIT
  ↓
MONGO ON MISS
  ↓
MUTATION → minimal backend work → response
  ↓
DEFERRED cache invalidation (setImmediate)
  ↓
CLIENT CACHE PATCH (prepend/patch row)
  ↓
UI (instant, no full reload)
```

---

## J. Git & Build Status

| Item | Status |
|------|--------|
| Pushed to GitHub | **No** (per instruction) |
| Backend recent commits | `59a1ea5`, `8872d56`, `e1824d1` |
| Frontend recent commits | `419c8c0`, `6ac5f34`, `2cde882` |
| Uncommitted changes | This performance pass (PERF_TRACE, fixes, docs, scripts) |
| Backend TypeScript | **Pass** |
| Frontend TypeScript | **Pass** |
| Frontend lint | Not fully run (tsc clean) |
| Tests | Not run |

### Files Changed This Pass

**Backend:**
- `src/middleware/perfTrace.ts` — env-gated timing legs
- `src/middleware/perfTraceMiddleware.ts` — X-Perf-Trace header
- `src/middleware/requireAuth.ts` — auth timing
- `src/middleware/responseCache.ts` — redis timing leg
- `src/controllers/crudFactory.ts` — mongo timing
- `src/controllers/inventoryStockController.ts` — deferred cache clear
- `src/routes/health.routes.ts` — `/health/redis-test`
- `src/lib/redisClient.ts` — redisDel, redisTtl
- `src/app.ts` — perf trace middleware

**Frontend:**
- `lib/utils/perf-trace.ts` — client marks
- `lib/services/api-client.ts` — perf trace on mutations
- `lib/services/api-resource-service.ts` — duplicate import fix
- `hooks/use-customers-module.ts` — cache patch mutations
- `components/modules/inventory/ProductsPage.tsx` — lazy SKU
- `components/modules/hrm/employee-form/EmployeeFormPage.tsx` — cache patch
- `components/providers/ApiStateHydrator.tsx` — remove dead sessionLoadedModules
- `scripts/run-api-perf.mjs`, `run-redis-health.mjs`, `run-mutation-perf.mjs`
- `scripts/run-navigation-perf.mjs` — A→B→A cache test
- `docs/final-erp-performance-report.md` (this file)
- `docs/final-erp-performance-report.json`
- `docs/api-perf-results.json`, `redis-health-results.json`

---

## Measurement Scripts

```bash
# Route hydration static verify
node scripts/verify-route-hydration.mjs

# API-level perf (no browser)
node scripts/run-api-perf.mjs

# Redis health
node scripts/run-redis-health.mjs

# Browser E2E (requires Playwright-supported OS)
PERF_TRACE=1 node scripts/run-navigation-perf.mjs
node scripts/run-mutation-perf.mjs
```

Enable tracing: `PERF_TRACE=1` (backend), `NEXT_PUBLIC_PERF_TRACE=1` (frontend).
