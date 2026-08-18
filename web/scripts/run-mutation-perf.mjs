/**
 * Mutation performance measurement — traces POST + post-submit GET chains.
 *
 * Usage:
 *   PERF_TRACE=1 in backend, NEXT_PUBLIC_PERF_TRACE=1 in frontend (optional)
 *   node scripts/run-mutation-perf.mjs
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BASE = process.env.NAV_BASE_URL ?? 'http://localhost:3000';
const API_BASE = process.env.NAV_API_BASE ?? 'http://localhost:5000/api/v1';
const EMAIL = process.env.DASHBOARD_EMAIL ?? 'admin@toysfactory.com';
const PASSWORD = process.env.DASHBOARD_PASSWORD ?? 'password123';
const HEADLESS = process.env.HEADLESS !== 'false';

const FORMS = [
  {
    id: 'customer',
    path: '/crm/customers',
    openButton: /add customer/i,
    fill: async (page, stamp) => {
      await page.locator('input[name="name"], input[placeholder*="name" i]').first().fill(`Perf Customer ${stamp}`);
      const phone = page.locator('input[name="phone"], input[type="tel"]').first();
      if (await phone.count()) await phone.fill(`017${String(stamp).slice(-8)}`);
    },
    postMatch: /\/customers$/,
  },
  {
    id: 'product',
    path: '/inventory/products',
    openButton: /add product/i,
    fill: async (page, stamp) => {
      const sku = page.locator('input[name="sku"], input[placeholder*="SKU" i]').first();
      if (await sku.count()) await sku.fill(`PERF-SKU-${stamp}`);
      await page.locator('input[name="name"], input[placeholder*="name" i]').first().fill(`Perf Product ${stamp}`);
    },
    postMatch: /\/products$/,
  },
  {
    id: 'supplier',
    path: '/purchases/suppliers',
    openButton: /add supplier/i,
    fill: async (page, stamp) => {
      await page.locator('input[name="name"], input[placeholder*="name" i]').first().fill(`Perf Supplier ${stamp}`);
    },
    postMatch: /\/suppliers$/,
  },
];

function isApiRequest(url) {
  return url.includes('/api/v1/') || url.startsWith(API_BASE);
}

function resourceFromUrl(url) {
  try {
    const path = new URL(url).pathname;
    const match = path.match(/\/api\/v1\/([^/?]+)/);
    return match ? match[1] : path;
  } catch {
    return url;
  }
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"], input[placeholder*="company"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button:has-text("Sign in")');
  await page.waitForURL('**/dashboard**', { timeout: 45000 }).catch(() => {});
}

async function measureFormMutation(page, form) {
  const events = [];
  const onRequest = (req) => {
    if (!isApiRequest(req.url())) return;
    events.push({
      ts: Date.now(),
      method: req.method(),
      resource: resourceFromUrl(req.url()),
      url: req.url(),
    });
  };
  const onResponse = (res) => {
    if (!isApiRequest(res.url())) return;
    const match = events.find((e) => e.url === res.url() && !e.status);
    if (match) {
      match.status = res.status();
      match.perfTrace = res.headers()['x-perf-trace'] ?? null;
      match.durationMs = Date.now() - match.ts;
    }
  };

  page.on('request', onRequest);
  page.on('response', onResponse);

  await page.goto(`${BASE}${form.path}`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});

  const openGets = [];
  const openOnReq = (req) => {
    if (req.method() === 'GET' && isApiRequest(req.url())) openGets.push(resourceFromUrl(req.url()));
  };
  page.on('request', openOnReq);

  const addBtn = page.getByRole('button', { name: form.openButton }).first();
  const openStart = Date.now();
  if (await addBtn.count()) {
    await addBtn.click();
    await page.waitForTimeout(800);
  }
  const formOpenMs = Date.now() - openStart;
  page.off('request', openOnReq);

  const stamp = Date.now();
  await form.fill(page, stamp);

  events.length = 0;
  const submitStart = Date.now();
  const saveBtn = page.getByRole('button', { name: /^save$/i }).first();
  if (await saveBtn.count()) {
    await saveBtn.click();
    await page.waitForTimeout(4000);
  }
  const submitTotalMs = Date.now() - submitStart;

  page.off('request', onRequest);
  page.off('response', onResponse);

  const posts = events.filter((e) => e.method === 'POST');
  const getsAfter = events.filter((e) => e.method === 'GET');
  const primaryPost = posts.find((e) => form.postMatch.test(new URL(e.url).pathname)) ?? posts[0];

  return {
    id: form.id,
    path: form.path,
    formOpenMs,
    submitTotalMs,
    postCount: posts.length,
    getCountAfterSubmit: getsAfter.length,
    postResources: posts.map((e) => e.resource),
    getResourcesAfter: [...new Set(getsAfter.map((e) => e.resource))],
    primaryPost: primaryPost
      ? {
          resource: primaryPost.resource,
          durationMs: primaryPost.durationMs,
          perfTrace: primaryPost.perfTrace,
        }
      : null,
    openFormGets: [...new Set(openGets)],
    events,
  };
}

async function main() {
  const browser = await chromium.launch({ headless: HEADLESS });
  const context = await browser.newContext();
  const page = await context.newPage();

  await login(page);

  const results = [];
  for (const form of FORMS) {
    console.log(`Measuring mutation: ${form.id}`);
    const row = await measureFormMutation(page, form);
    results.push(row);
    console.log(`  open=${row.formOpenMs}ms submit=${row.submitTotalMs}ms POST=${row.postCount} GET-after=${row.getCountAfterSubmit}`);
    if (row.primaryPost?.perfTrace) console.log(`  X-Perf-Trace: ${row.primaryPost.perfTrace}`);
  }

  await browser.close();

  const summary = {
    measuredAt: new Date().toISOString(),
    baseUrl: BASE,
    apiBase: API_BASE,
    mutations: results,
  };

  const outPath = join(__dirname, '../docs/mutation-perf-results.json');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(`\nWrote ${outPath}`);

  console.log('\n| Form | Open ms | Submit ms | POST | GET after | Primary POST ms |');
  console.log('|---|---:|---:|---:|---:|---:|');
  for (const r of results) {
    console.log(
      `| ${r.id} | ${r.formOpenMs} | ${r.submitTotalMs} | ${r.postCount} | ${r.getCountAfterSubmit} | ${r.primaryPost?.durationMs ?? '—'} |`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
