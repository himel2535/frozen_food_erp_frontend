/**
 * Navigation performance measurement — counts API requests per route transition.
 *
 * Usage:
 *   node scripts/run-navigation-perf.mjs
 *   NAV_BASE_URL=http://localhost:3000 node scripts/run-navigation-perf.mjs
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BASE = process.env.NAV_BASE_URL ?? 'http://localhost:3000';
const EMAIL = process.env.DASHBOARD_EMAIL ?? 'admin@toysfactory.com';
const PASSWORD = process.env.DASHBOARD_PASSWORD ?? 'password123';
const HEADLESS = process.env.HEADLESS !== 'false';
const API_BASE = process.env.NAV_API_BASE ?? 'http://localhost:5000/api/v1';

const LIST_RESOURCES = new Set([
  'products', 'customers', 'suppliers', 'employees', 'categories', 'units', 'warehouses',
  'sales-orders', 'invoices', 'purchase-orders', 'leads', 'roles', 'admin',
]);

const TRANSITIONS = [
  { from: '/dashboard', to: '/inventory/products', label: 'Dashboard → Products' },
  { from: '/dashboard', to: '/settings/users', label: 'Dashboard → Users' },
  { from: '/settings/users', to: '/settings/roles', label: 'Users → Roles' },
  { from: '/settings/roles', to: '/crm/customers', label: 'Roles → Customers' },
  { from: '/crm/customers', to: '/inventory/products', label: 'Customers → Products' },
  { from: '/inventory/products', to: '/inventory/warehouses', label: 'Products → Warehouses' },
  { from: '/inventory/warehouses', to: '/sales/orders', label: 'Warehouses → Sales Orders' },
  { from: '/sales/orders', to: '/purchases/orders', label: 'Sales Orders → Purchases' },
  { from: '/purchases/orders', to: '/manufacturing/machine-maintenance', label: 'Purchases → Production' },
  { from: '/manufacturing/machine-maintenance', to: '/crm/leads', label: 'Production → CRM Leads' },
  { from: '/crm/leads', to: '/dashboard', label: 'CRM Leads → Dashboard' },
];

function isApiRequest(url) {
  return url.includes('/api/v1/') || url.startsWith(API_BASE);
}

function isRscPrefetch(url) {
  return url.includes('_rsc=');
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

async function measureTransition(page, from, to, label) {
  const requests = [];

  const onRequest = (req) => {
    if (req.method() !== 'GET') return;
    const url = req.url();
    if (!isApiRequest(url)) return;
    requests.push({ url, resource: resourceFromUrl(url) });
  };

  page.on('request', onRequest);

  await page.goto(`${BASE}${from}`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  requests.length = 0;
  const navStart = Date.now();

  await page.goto(`${BASE}${to}`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(500);

  page.off('request', onRequest);

  const listRequests = requests.filter((r) => LIST_RESOURCES.has(r.resource));
  const uniqueResources = [...new Set(requests.map((r) => r.resource))];
  const uniqueListResources = [...new Set(listRequests.map((r) => r.resource))];

  return {
    label,
    from,
    to,
    totalRequests: requests.length,
    listRequests: listRequests.length,
    uniqueResources,
    uniqueListResources,
    uniqueCount: uniqueResources.length,
    durationMs: Date.now() - navStart,
    requests: requests.map((r) => ({ resource: r.resource })),
  };
}

async function measureRscHover(page) {
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  const rscRequests = [];
  const onRequest = (req) => {
    if (isRscPrefetch(req.url())) rscRequests.push(req.url());
  };
  page.on('request', onRequest);

  const links = page.locator('aside a[href^="/"]').filter({ hasNot: page.locator('[href="/dashboard"]') });
  const count = Math.min(await links.count(), 5);
  for (let i = 0; i < count; i += 1) {
    await links.nth(i).hover();
    await page.waitForTimeout(200);
  }
  await page.waitForTimeout(500);
  page.off('request', onRequest);

  return {
    label: 'Sidebar hover (5 links)',
    rscPrefetchCount: rscRequests.length,
    rscUrls: rscRequests.slice(0, 10),
  };
}

async function measureProductCreateGets(page) {
  await page.goto(`${BASE}/inventory/products`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});

  const gets = [];
  const posts = [];
  const onRequest = (req) => {
    const url = req.url();
    if (!isApiRequest(url)) return;
    if (req.method() === 'GET') gets.push(resourceFromUrl(url));
    if (req.method() === 'POST' && url.includes('/products')) posts.push(url);
  };
  page.on('request', onRequest);

  const addBtn = page.getByRole('button', { name: /add product/i }).first();
  if (await addBtn.count()) {
    await addBtn.click();
    await page.waitForTimeout(500);
  }

  const skuInput = page.locator('input[name="sku"], input[placeholder*="SKU" i]').first();
  const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
  if (await skuInput.count()) {
    const stamp = Date.now();
    await skuInput.fill(`PERF-SKU-${stamp}`);
    if (await nameInput.count()) await nameInput.fill(`Perf Product ${stamp}`);
    const saveBtn = page.getByRole('button', { name: /save/i }).first();
    if (await saveBtn.count()) {
      gets.length = 0;
      posts.length = 0;
      await saveBtn.click();
      await page.waitForTimeout(3000);
    }
  }

  page.off('request', onRequest);

  return {
    label: 'Product create mutation',
    postCount: posts.length,
    getCountAfterPost: gets.length,
    getResources: [...new Set(gets)],
  };
}

async function measureCacheReuse(page) {
  const measureVisit = async (path) => {
    const requests = [];
    const onRequest = (req) => {
      if (req.method() !== 'GET') return;
      const url = req.url();
      if (!isApiRequest(url)) return;
      requests.push({ resource: resourceFromUrl(url) });
    };
    page.on('request', onRequest);
    const start = Date.now();
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(400);
    page.off('request', onRequest);
    return { path, totalRequests: requests.length, resources: [...new Set(requests.map((r) => r.resource))], durationMs: Date.now() - start };
  };

  const first = await measureVisit('/crm/customers');
  await measureVisit('/inventory/products');
  const second = await measureVisit('/crm/customers');

  return {
    label: 'Customers → Products → Customers cache reuse',
    firstVisit: first,
    secondVisit: second,
    requestsSaved: Math.max(0, first.totalRequests - second.totalRequests),
    reused: second.totalRequests < first.totalRequests,
  };
}

async function main() {
  const browser = await chromium.launch({ headless: HEADLESS });
  const context = await browser.newContext();
  const page = await context.newPage();

  await login(page);

  const results = [];
  for (const t of TRANSITIONS) {
    console.log(`Measuring: ${t.label}`);
    const row = await measureTransition(page, t.from, t.to, t.label);
    results.push(row);
    console.log(`  ${row.totalRequests} GET (${row.listRequests} list) in ${row.durationMs}ms`);
    console.log(`  Resources: ${row.uniqueResources.join(', ') || '(none)'}`);
  }

  console.log('Measuring: Sidebar RSC hover');
  const rscHover = await measureRscHover(page);
  console.log(`  ${rscHover.rscPrefetchCount} _rsc= prefetches`);

  console.log('Measuring: Product create');
  const productCreate = await measureProductCreateGets(page);
  console.log(`  POST=${productCreate.postCount} GET-after=${productCreate.getCountAfterPost}`);

  console.log('Measuring: A→B→A cache reuse');
  const cacheReuse = await measureCacheReuse(page);
  console.log(`  first=${cacheReuse.firstVisit.totalRequests} second=${cacheReuse.secondVisit.totalRequests} saved=${cacheReuse.requestsSaved}`);

  await browser.close();

  const summary = {
    measuredAt: new Date().toISOString(),
    baseUrl: BASE,
    transitions: results,
    rscHover,
    productCreate,
    cacheReuse,
    totals: {
      requests: results.reduce((s, r) => s + r.totalRequests, 0),
      listRequests: results.reduce((s, r) => s + r.listRequests, 0),
      avgPerTransition: Math.round(results.reduce((s, r) => s + r.totalRequests, 0) / results.length),
    },
  };

  const outPath = join(__dirname, '../docs/navigation-perf-results.json');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(`\nWrote ${outPath}`);

  console.log('\n| Navigation | GETs | List GETs | Duration ms |');
  console.log('|---|---:|---:|---:|');
  for (const r of results) {
    console.log(`| ${r.label} | ${r.totalRequests} | ${r.listRequests} | ${r.durationMs} |`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
