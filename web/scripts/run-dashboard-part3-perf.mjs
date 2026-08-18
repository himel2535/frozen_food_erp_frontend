/**
 * Part 3 protocol LCP measurement — matches manual Chrome methodology:
 * - Headed Chrome (set HEADLESS=false)
 * - No perfCollect=1, no activityMode query params
 * - /dashboard only, wait for load + dashboard-view-mounted mark
 * - 5+ warm reloads in same session + 5 cold runs (fresh context, cache disabled)
 *
 * Usage:
 *   HEADLESS=false node scripts/run-dashboard-part3-perf.mjs
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
  createAuthedContext,
} from './dashboard-perf-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUILD_ID = fs.existsSync(path.join(__dirname, '../.next/BUILD_ID'))
  ? fs.readFileSync(path.join(__dirname, '../.next/BUILD_ID'), 'utf8').trim()
  : 'unknown';

async function warmRuns(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await login(page);
  const rows = [];
  for (let i = 1; i <= RUNS; i++) {
    const sample = await collectDashboardMetrics(page, `${BASE}/dashboard?_warm=${i}&_t=${Date.now()}`);
    rows.push({ ...sample, phase: 'warm', run: i });
    process.stderr.write(`warm ${i}/${RUNS} LCP=${sample.lcpMs ?? 'n/a'}ms FCP=${sample.fcpMs ?? 'n/a'}ms\n`);
  }
  await context.close();
  return rows;
}

async function coldRuns(browser) {
  const rows = [];
  for (let i = 1; i <= RUNS; i++) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await login(page);
    const sample = await collectDashboardMetrics(page, `${BASE}/dashboard?_cold=${i}&_t=${Date.now()}`);
    rows.push({ ...sample, phase: 'cold', run: i });
    process.stderr.write(`cold ${i}/${RUNS} LCP=${sample.lcpMs ?? 'n/a'}ms FCP=${sample.fcpMs ?? 'n/a'}ms\n`);
    await context.close();
  }
  return rows;
}

async function main() {
  const label = process.env.PERF_LABEL ?? 'post-split';
  process.stderr.write(`Part3 protocol | label=${label} | BUILD_ID=${BUILD_ID} | headless=${HEADLESS}\n`);

  const browser = await chromium.launch({ headless: HEADLESS });
  const warm = await warmRuns(browser);
  const cold = await coldRuns(browser);
  await browser.close();

  const output = {
    protocol: 'part3',
    label,
    buildId: BUILD_ID,
    headless: HEADLESS,
    baseUrl: BASE,
    timestamp: new Date().toISOString(),
    warm: { samples: warm, summary: summarizeRuns(warm) },
    cold: { samples: cold, summary: summarizeRuns(cold) },
  };

  const outPath = path.join(__dirname, `../docs/dashboard-part3-perf-${label}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  process.stderr.write(`Wrote ${outPath}\n`);
  console.log(JSON.stringify(output, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
