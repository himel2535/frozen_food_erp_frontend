# Dashboard Activity Feed A/B/C LCP Results

Date: 2026-08-18  
Build: production (`npm run analyze` output)  
Server: `npm start` on localhost:3000  
Harness: `node scripts/run-dashboard-abc-perf.mjs` (Playwright headless, 5 runs/mode)

## Modes tested

| Mode | Behavior |
|------|----------|
| **A** | Immediate Activity Feed paint (no idle defer) |
| **B** | Idle defer paint after KPI ready (**production default**) |
| **C** | Skeleton + deferred audit-log fetch on idle + idle paint |

Enable via `?activityMode=a|b|c&perfCollect=1` or `sessionStorage`.

## Summary (median LCP per mode)

| Mode | Runs | LCP median | FCP median | TTFB median | Chunk eval median | View mounted median |
|------|-----:|-----------:|-----------:|------------:|------------------:|--------------------:|
| **A** | 5 | 12,939 ms | 12,939 ms | 611 ms | 13,265 ms | 13,845 ms |
| **B** | 5 | 12,984 ms | 12,984 ms | 492 ms | 13,413 ms | 14,003 ms |
| **C** | 5 | 12,595 ms | 12,595 ms | 482 ms | 12,901 ms | 13,324 ms |

## LCP element (all runs)

`SPAN Real-time manufacturing, sales, stock & factory management` (dashboard subtitle in shell)

Activity Feed audit text was **not** the LCP element in this headless run set — defer strategies appear to keep large activity text out of LCP for these runs.

## Per-run LCP (ms)

| Run | A | B | C |
|----:|--:|--:|--:|
| 1 | 4,092 | 1,143 | 12,637 |
| 2 | 18,134 | 12,984 | 12,595 |
| 3 | 12,482 | 14,038 | 11,839 |
| 4 | 14,282 | 15,369 | 1,017 |
| 5 | 12,939 | 12,876 | 13,332 |

## Interpretation

1. **High cold/warm variance:** Run 1 (and run 4 for C) show ~1–4s LCP when chunk cache is warm; runs 2–5 cluster ~12–18s when chunk parse dominates.
2. **No clear A/B/C winner on median LCP** — differences are within run-to-run noise (~12.6–13.0s medians).
3. **Option B (current default) is not worse than A or C** on these measurements; keep Option B for UX (KPI-first paint) without LCP regression vs alternatives.
4. **Primary remaining bottleneck** is still DashboardView chunk download/parse (~13s chunk eval on cold runs), not Activity Feed timing alone.

## Raw data

See `docs/dashboard-abc-perf-raw.json` for full PerformanceObserver samples.

## Reproduce

```bash
cd toys_factory_erp/web
npm run build   # or npm run analyze
npm start
node scripts/run-dashboard-abc-perf.mjs
```
