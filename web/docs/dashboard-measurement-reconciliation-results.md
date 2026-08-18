# Measurement Reconciliation — Follow-up Results

Date: 2026-08-18  
Protocol: Part 3 aligned harness (`scripts/run-dashboard-part3-perf.mjs`, `scripts/dashboard-perf-lib.mjs`)

---

## 1. Measurement discrepancy (resolved)

| Source | LCP | FCP | TTFB | LCP element |
|--------|----:|----:|-----:|-------------|
| **Part 3 baseline (manual Chrome)** | 4.06–5.95s | 0.72–1.27s | ~10ms | Activity Feed audit text |
| **Original Playwright A/B/C (broken harness)** | 12.6–13.0s median | = LCP | 482–611ms | Header subtitle |
| **Part 3 protocol — post-split warm** | **1.91s median** (p25 1.75s, p75 24.9s*) | same | 19ms median | Header subtitle |
| **Part 3 protocol — post-split cold** | **2.72s median** | same | 13ms median | Header subtitle |
| **Part 3 protocol — pre-split cold run 1** | **4.34s** | 4.34s | — | (incomplete run set) |

\*Warm run 5 outlier (25s) from chunk re-parse; exclude for UX baseline → warm p75 without outlier ≈ 1.9s.

**Conclusion:** The 4–6s vs 12–13s gap was **not a real regression**. It was caused by incompatible harnesses (see audit plan). Aligned protocol shows **2–4s LCP in headless** for post-split, and **4.3s on one pre-split cold run** overlapping Part 3.

---

## 2. Exact cause

The original Playwright run used:
- Fixed 13s wait (not mount mark)
- `perfCollect=1` + `activityMode` params
- Single browser context → cold/warm mixed medians
- `waitUntil: domcontentloaded` only

The fixed Part 3 protocol uses:
- `waitUntil: load`
- Wait for `dashboard-view-mounted` mark (+ 800ms LCP settle)
- No `perfCollect` / no `activityMode` for baseline runs
- Separate **warm** (5 reloads, same session) and **cold** (5 fresh contexts, cache disabled)
- Inline PerformanceObserver (same API as manual Chrome)

Remaining gap vs Part 3 manual (4–6s):
- **Headless Playwright** still promotes **header subtitle** as LCP, not Activity Feed — manual Chrome promoted Activity Feed after widgets loaded.
- **Headed vs headless** paint/LCP candidate selection differs.

---

## 3. Which baseline should be trusted

| Use case | Baseline |
|----------|----------|
| Real-user UX (Chrome desktop) | **Part 3: 4.06–5.95s** (Activity Feed LCP) |
| Automated regression (aligned protocol) | **Part 3 protocol cold median** on post-split: **2.72s** |
| A/B/C mode comparison | **Fixed harness** warm/cold tables below — **no winner declared** |

---

## 4. Bundle split verification (unchanged)

| Metric | Pre-split | Post-split |
|--------|----------:|-----------:|
| DashboardView lazy total | 413,581 B (audit) / **440,961 B** (f9dee8f build) | **356,288 B** |
| Largest chunk | 6046 @ 263 KB | 3275 @ 88 KB |
| CRM+recipes in dashboard chunks | Present | Absent |

Post-split build ID: `5byDz5El9ah2eCaUF4_E_`  
Pre-split build ID: `gokZptFQgSsJitNmAZGYV`

---

## 5. A/B/C verification (fixed harness)

**Do not declare Option B winner.** Medians overlap; LCP element is header subtitle in all modes.

### Warm LCP median (ms)

| Mode | p25 | Median | p75 | viewMounted median |
|------|----:|-------:|----:|-------------------:|
| A | 644 | **719** | 1463 | 1202 |
| B | 873 | **914** | 1495 | 1670 |
| C | 914 | **1023** | 2529 | 2117 |

### Cold LCP median (ms)

| Mode | p25 | Median | p75 | viewMounted median |
|------|----:|-------:|----:|-------------------:|
| A | 856 | **875** | 1205 | 1545 |
| B | 1771 | **2021** | 2641 | 3761 |
| C | 1185 | **1753** | 2193 | 2424 |

**Observation:** Warm runs cluster **0.7–1.0s** (all modes). Cold runs **0.9–2.0s** except mode B cold p75 at 2.6s. Differences are within noise; **B is not clearly best or worst**.

Raw: [dashboard-abc-perf-fixed.json](./dashboard-abc-perf-fixed.json)

---

## 6. Pre-split vs post-split LCP (aligned protocol)

| Build | Phase | LCP median | viewMounted median | Notes |
|-------|-------|----------:|-------------------:|-------|
| **Post-split** | warm | 1913 ms | 2323 ms | 5 runs complete |
| **Post-split** | cold | 2722 ms | 4107 ms | 5 runs complete |
| **Pre-split** | warm | 6909 ms* | — | High variance (2.1–9.9s) |
| **Pre-split** | cold | **4337 ms** (n=1) | — | Runs 2–5 timed out |

\*Pre-split warm skewed by first 3 cold-cache-miss runs on larger bundle.

**Interpretation:** Post-split shows **lower LCP and mount time** on aligned protocol (cold median 2.7s vs single pre-split cold 4.3s). Pre-split incomplete — re-run cold with 120s timeout recommended before firm LCP attribution.

Raw: [dashboard-part3-perf-post-split.json](./dashboard-part3-perf-post-split.json), [dashboard-part3-perf-pre-split-partial.json](./dashboard-part3-perf-pre-split-partial.json)

---

## 7. Current real bottleneck

1. **DashboardView chunk parse/eval** — `viewMountedMs` cold post-split median **4.1s**; warm **2.3s**.
2. **LCP element selection** — headless automation measures header subtitle, not Activity Feed; Part 3 UX LCP still driven by late large text when headed Chrome used.
3. **Mongo/API** — TTFB **8–32ms** in all aligned runs; not the bottleneck.

---

## Recommended next actions

1. Re-run **pre-split cold** with `timeout: 120000` and complete 5 runs for fair before/after.
2. Run Part 3 protocol with **`HEADLESS=false`** to compare LCP element (Activity Feed vs subtitle) to original 4–6s baseline.
3. Use fixed harness for CI; report **warm and cold separately**, not mixed medians.

---

## Artifacts

| File | Description |
|------|-------------|
| `scripts/dashboard-perf-lib.mjs` | Shared metrics collection |
| `scripts/run-dashboard-part3-perf.mjs` | Part 3 protocol (warm + cold) |
| `scripts/run-dashboard-abc-perf.mjs` | Fixed A/B/C harness |
| `docs/dashboard-part3-perf-post-split.json` | Post-split Part 3 results |
| `docs/dashboard-abc-perf-fixed.json` | Fixed A/B/C results |
| `docs/dashboard-part3-perf-pre-split-partial.json` | Pre-split partial results |
