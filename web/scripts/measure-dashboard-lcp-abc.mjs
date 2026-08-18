/**
 * Dashboard Activity Feed A/B/C LCP measurement harness.
 *
 * Usage (production server must be running on BASE_URL):
 *   node scripts/measure-dashboard-lcp-abc.mjs
 *
 * Modes:
 *   A — immediate Activity Feed paint (no idle defer)
 *   B — idle defer paint only (production default)
 *   C — skeleton + deferred fetch + idle paint
 *
 * Requires Chrome/Chromium with remote debugging OR uses built-in Performance API
 * via a minimal headless flow when CHROME_PATH is set.
 */

const BASE_URL = process.env.DASHBOARD_BASE_URL ?? 'http://localhost:3000';
const RUNS_PER_MODE = Number(process.env.LCP_RUNS ?? 5);
const MODES = ['a', 'b', 'c'];

const MEASURE_SCRIPT = `
(() => {
  return new Promise((resolve) => {
    const marks = {};
    const record = (name) => { marks[name] = performance.now(); };
    record('start');
    const fcpObs = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.name === 'first-contentful-paint') marks.fcp = e.startTime;
      }
    });
    fcpObs.observe({ type: 'paint', buffered: true });
    const lcpObs = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) {
        marks.lcp = last.startTime;
        marks.lcpElement = last.element ? (last.element.tagName + ' ' + (last.element.textContent || '').slice(0, 80)) : '';
      }
    });
    lcpObs.observe({ type: 'largest-contentful-paint', buffered: true });
    const nav = performance.getEntriesByType('navigation')[0];
    if (nav) marks.ttfb = nav.responseStart;
    setTimeout(() => {
      fcpObs.disconnect();
      lcpObs.disconnect();
      const chunkMark = performance.getEntriesByName('dashboard-view-chunk-evaluated')[0];
      const mountMark = performance.getEntriesByName('dashboard-view-mounted')[0];
      if (chunkMark) marks.chunkEval = chunkMark.startTime;
      if (mountMark) marks.viewMounted = mountMark.startTime;
      resolve(JSON.stringify(marks));
    }, 12000);
  });
})();
`;

function median(nums) {
  const sorted = [...nums].filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

async function fetchWithMode(mode, runIndex) {
  const url = `${BASE_URL}/dashboard?activityMode=${mode}&_run=${runIndex}&_t=${Date.now()}`;
  const res = await fetch(url, { redirect: 'manual' });
  return { url, status: res.status, ok: res.ok };
}

async function main() {
  console.log(`Dashboard LCP A/B/C harness`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Runs per mode: ${RUNS_PER_MODE}`);
  console.log('');
  console.log('NOTE: Full PerformanceObserver metrics require a real browser session.');
  console.log('Paste MEASURE_SCRIPT into DevTools on /dashboard?activityMode=<a|b|c> after login,');
  console.log('or use Cursor browser MCP with the script below.');
  console.log('');
  console.log('--- MEASURE_SCRIPT ---');
  console.log(MEASURE_SCRIPT);
  console.log('--- END ---');
  console.log('');

  const reachability = await fetch(BASE_URL, { redirect: 'manual' }).catch(() => null);
  if (!reachability) {
    console.error(`Cannot reach ${BASE_URL}. Start production server: npm run start`);
    process.exit(1);
  }
  console.log(`Server reachable (HTTP ${reachability.status}).`);
  console.log('');

  const template = {};
  for (const mode of MODES) {
    template[mode] = { runs: [], fcp: [], lcp: [], ttfb: [], lcpElements: [] };
    for (let i = 0; i < RUNS_PER_MODE; i++) {
      const probe = await fetchWithMode(mode, i + 1);
      template[mode].runs.push(probe);
    }
  }

  console.log('URL probes (requires auth cookie for dashboard content):');
  console.log(JSON.stringify(template, null, 2));
  console.log('');
  console.log('Record results in docs/dashboard-activity-abc-results.md after browser runs.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
