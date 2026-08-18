# Navigation Performance — Before/After

Measured after route-aware hydration implementation on 2026-08-18.

## Methodology

- Script: `web/scripts/run-navigation-perf.mjs`
- Environment: `http://localhost:3000` (frontend) + local backend on port 5000
- Counts GET requests to `/api/v1/*` during each client-side navigation (after `networkidle`)
- **Before** column: estimated from pre-change architecture (global `API_BOOT_MODULES` = 9 parallel list GETs on every non-dashboard route, plus page-specific requests)

## Results

| Navigation | Before (est.) | After (measured) | Removed (est.) | Main improvement |
|---|---:|---:|---:|---|
| Dashboard → Users | ~11 | **1** | ~10 | No boot modules; admin APIs only |
| Users → Roles | ~10 | 5 | ~5 | No global boot; roles + admin only |
| Roles → Customers | ~10 | 5 | ~5 | Route-specific; customers cached from session |
| Customers → Products | ~10 | 5 | ~5 | Products + lookups only (not 9 boot) |
| Products → Warehouses | ~10 | 11 | — | Route-aware: products + warehouses + lookups (different page sizes cause some duplicate GETs) |
| Warehouses → Sales Orders | ~10 | 7 | ~3 | sales-orders + shared lookups only |
| Sales Orders → Purchases | ~10 | 4 | ~6 | purchase-orders route (not 9 boot) |
| Purchases → Production | ~10 | 0 | ~10 | Extended module; cache warm |
| Production → CRM Leads | ~10 | 4 | ~6 | leads + employees lookup only |
| CRM Leads → Dashboard | ~10 | 1 | ~9 | Dashboard critical boot reuses cache |

**Average per transition:** ~10 (before est.) → **4.3** (after measured)

## Key findings

1. **Dashboard → Users** dropped from ~11 requests to **1** (auth token refresh only) — primary goal achieved.
2. Global boot modules (`customers`, `products`, `suppliers`, `employees`, `sales-orders`, `invoices`, `categories`, `units`, `warehouses`) no longer fire on admin/settings routes.
3. Remaining non-module requests are expected: `auth`, `notifications`, `dashboard` summary (header alerts dropdown maps to `/dashboard/*` path segment).
4. Some duplicate GETs remain when hydrator uses `limit=25` and page hooks use different page sizes (e.g. products page `limit=10`) — separate cache keys.

## Raw data

Full JSON: [`navigation-perf-results.json`](./navigation-perf-results.json)

## Verification

Route dependency assertions: `node scripts/verify-route-hydration.mjs` (15/15 passed)
