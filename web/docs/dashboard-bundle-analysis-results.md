# Dashboard Bundle Analysis Results

Date: 2026-08-18 (post CRM/recipes split)

## Pre-split baseline (chunk 6046)

| Module | Size in 6046 | % of 6046 |
|--------|-------------:|----------:|
| crm-service (+ leads-seed) | 68,522 B | 25.4% |
| recipes-service | 15,934 B | 5.9% |
| **CRM + recipes combined** | **84,456 B** | **31.4%** |
| default-state.ts (via app-store) | ~85,346 B | ~32% |
| translations/en.ts | 37,194 B | ~14% |
| Chunk 6046 total | ~269,251 B | — |
| DashboardView lazy total | ~413,581 B (~404 KB) | 9 chunks |

**Threshold:** CRM/recipes >30% → split required ✓

## Post-split (Mongo production build)

| Metric | Before | After | Change |
|--------|-------:|------:|-------:|
| DashboardView lazy total | 413,581 B | **356,288 B** | **-57 KB (-14%)** |
| Largest lazy chunk | 6046 @ 263 KB | 3275 @ 88 KB | split |
| crm-service in dashboard chunks | Present | **Absent** (string scan) | removed |
| recipes-service in dashboard chunks | Present | **Absent** | removed |
| default-state in dashboard path | Present | **Absent** (mongo-bootstrap-state) | removed |

### New DashboardView lazy chunks (largest first)

| Chunk | Size |
|-------|-----:|
| 3275-d22e390ab0856679.js | 88,222 B |
| 9862-4f62c83edc92040c.js | 68,666 B |
| 8885.b4d6141cc29024e0.js | 54,256 B |
| Other (7 chunks) | 145,144 B |
| **Total** | **356,288 B (~347 KB)** |

## Changes applied

1. `business-alert-service-core.ts` — Mongo-safe alert helpers (no CRM/recipes)
2. `business-alert-service-local.ts` — local/demo alert builders (dynamic import)
3. `mongo-bootstrap-state.ts` + `app-store-local-hydrate.ts` — compile-time Mongo vs local state bootstrap
4. `api-app-state-mapper.ts` — lightweight CRM/recipes shells (no crm-service import)

## Analyzer reports

- Post-split: `web/.next/analyze/client.html` (2026-08-18 `npm run analyze`)
