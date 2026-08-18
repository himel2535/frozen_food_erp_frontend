/**
 * A/B/C Activity Feed LCP measurement (fixed harness).
 * - Fresh context per cold run; warm reuse within mode
 * - No perfCollect=1 (inline PerformanceObserver)
 * - Waits for dashboard-view-mounted mark (not fixed 13s)
 * - Reports p25/median/p75 per mode and phase
 *
 * Usage:
 *   node scripts/run-dashboard-abc-perf.mjs
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BASE,
  RUNS,
  HEADLESS,
  summarizeRuns,
  login,
  collectDashboardMetrics,
} from './dashboard-perf-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODES = ['a', 'b', 'c'];

async function runMode(browser, mode, phase) {
  const rows = [];
  let context;
  let page;

  if (phase === 'warm') {
    context = await browser.newContext();
    page = await context.newPage();
    await login(page);
  }

  for (let i = 1; i <= RUNS; i++) {
    if (phase === 'cold') {
      context = await browser.newContext();
      page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      await login(page);
    }

    const url = `${BASE}/dashboard?activityMode=${mode}&_phase=${phase}&_run=${i}&_t=${Date.now()}`;
    const sample = await collectDashboardMetrics(page, url);
    rows.push({ ...sample, activityMode: mode, phase, run: i });
    process.stderr.write(`${phase} mode=${mode} run=${i}/${RUNS} LCP=${sample.lcpMs ?? 'n/a'}ms\n`);

    if (phase === 'cold') await context.close();
  }

  if (phase === 'warm') await context.close();
  return rows;
}

async function main() {
  const browser = await chromium.launch({ headless: HEADLESS });
  const results = {};

  for (const mode of MODES) {
    results[mode] = {
      warm: { samples: await runMode(browser, mode, 'warm'), summary: null },
      cold: { samples: await runMode(browser, mode, 'cold'), summary: null },
    };
    results[mode].warm.summary = summarizeRuns(results[mode].warm.samples);
    results[mode].cold.summary = summarizeRuns(results[mode].cold.samples);
  }

  await browser.close();

  const output = {
    protocol: 'abc-fixed',
    headless: HEADLESS,
    timestamp: new Date().toISOString(),
    results,
  };

  const outPath = path.join(__dirname, '../docs/dashboard-abc-perf-fixed.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  process.stderr.write(`Wrote ${outPath}\n`);
  console.log(JSON.stringify(output, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
