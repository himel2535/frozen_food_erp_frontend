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

const TRANSITIONS = [
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
  const start = Date.now();

  const onRequest = (req) => {
    if (req.method() !== 'GET') return;
    const url = req.url();
    if (!isApiRequest(url)) return;
    requests.push({ url, resource: resourceFromUrl(url), at: Date.now() - start });
  };

  page.on('request', onRequest);

  await page.goto(`${BASE}${from}`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  requests.length = 0;
  const navStart = Date.now();

  await page.goto(`${BASE}${to}`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(500);

  page.off('request', onRequest);

  const resources = requests.map((r) => r.resource);
  const uniqueResources = [...new Set(resources)];

  return {
    label,
    from,
    to,
    totalRequests: requests.length,
    uniqueResources,
    uniqueCount: uniqueResources.length,
    durationMs: Date.now() - navStart,
    requests: requests.map((r) => ({ resource: r.resource, ms: r.at })),
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
    console.log(`  ${row.totalRequests} GET requests (${row.uniqueCount} unique) in ${row.durationMs}ms`);
    console.log(`  Resources: ${row.uniqueResources.join(', ') || '(none)'}`);
  }

  await browser.close();

  const summary = {
    measuredAt: new Date().toISOString(),
    baseUrl: BASE,
    transitions: results,
    totals: {
      requests: results.reduce((s, r) => s + r.totalRequests, 0),
      avgPerTransition: Math.round(results.reduce((s, r) => s + r.totalRequests, 0) / results.length),
    },
  };

  const outPath = join(__dirname, '../docs/navigation-perf-results.json');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(`\nWrote ${outPath}`);

  console.log('\n| Navigation | Requests | Unique | Duration ms |');
  console.log('|---|---:|---:|---:|');
  for (const r of results) {
    console.log(`| ${r.label} | ${r.totalRequests} | ${r.uniqueCount} | ${r.durationMs} |`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
