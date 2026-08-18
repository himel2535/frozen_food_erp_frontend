/**
 * API-level performance measurement (no browser required).
 * Simulates hydrator fetches per route and measures mutations.
 *
 * Usage: PERF_TRACE=1 on backend, node scripts/run-api-perf.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_BASE = process.env.API_BASE ?? 'http://localhost:5000';
const EMAIL = process.env.DASHBOARD_EMAIL ?? 'admin@toysfactory.com';
const PASSWORD = process.env.DASHBOARD_PASSWORD ?? 'password123';

const ROUTE_API_MAP = {
  '/dashboard': [],
  '/settings/users': [],
  '/crm/customers': [{ path: '/api/v1/customers', query: 'page=1&limit=10' }],
  '/inventory/products': [
    { path: '/api/v1/products', query: 'page=1&limit=10' },
    { path: '/api/v1/categories', query: 'page=1&limit=100&lookup=1' },
    { path: '/api/v1/units', query: 'page=1&limit=100&lookup=1' },
    { path: '/api/v1/warehouses', query: 'page=1&limit=100&lookup=1' },
  ],
  '/hrm/employees': [{ path: '/api/v1/employees', query: 'page=1&limit=10' }],
  '/purchases/suppliers': [{ path: '/api/v1/suppliers', query: 'page=1&limit=8' }],
  '/sales/orders': [{ path: '/api/v1/sales-orders', query: 'page=1&limit=10' }],
  '/purchases/orders': [
    { path: '/api/v1/purchase-orders', query: 'page=1&limit=10' },
    { path: '/api/v1/suppliers', query: 'page=1&limit=100&lookup=1' },
  ],
  '/manufacturing/machine-maintenance': [],
  '/crm/leads': [
    { path: '/api/v1/leads', query: 'page=1&limit=10' },
    { path: '/api/v1/employees', query: 'page=1&limit=100&lookup=1' },
  ],
};

async function login() {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const cookies = res.headers.getSetCookie?.() ?? [];
  const raw = res.headers.get('set-cookie');
  const list = cookies.length ? cookies : raw ? [raw] : [];
  const token = list.find((c) => c.startsWith('token='));
  if (!token) throw new Error('Login failed');
  return token.split(';')[0];
}

async function timedRequest(cookie, method, path, body) {
  const started = Date.now();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Cookie: cookie,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const durationMs = Date.now() - started;
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return {
    status: res.status,
    durationMs,
    perfTrace: res.headers.get('x-perf-trace'),
    ok: res.ok,
    data,
  };
}

function parsePerfTrace(header) {
  if (!header) return {};
  const legs = {};
  for (const part of header.split(' ')) {
    const [k, v] = part.split('=');
    if (k && v) legs[k] = Number.parseInt(v.replace('ms', ''), 10);
  }
  return legs;
}

async function measureAuth(cookie) {
  const first = await timedRequest(cookie, 'GET', '/api/v1/customers?page=1&limit=1');
  const second = await timedRequest(cookie, 'GET', '/api/v1/customers?page=1&limit=1');
  return {
    firstMs: first.durationMs,
    secondMs: second.durationMs,
    firstAuthMs: parsePerfTrace(first.perfTrace).auth,
    secondAuthMs: parsePerfTrace(second.perfTrace).auth,
    cacheHitLikely: second.durationMs < first.durationMs * 0.5,
  };
}

async function measureMutation(cookie, label, path, body) {
  const post = await timedRequest(cookie, 'POST', path, body);
  const legs = parsePerfTrace(post.perfTrace);
  return {
    label,
    postMs: post.durationMs,
    perfTrace: post.perfTrace,
    legs: {
      auth: legs.auth,
      mongo: legs.mongo,
      redis: legs.redis,
      cacheInvalidate: legs.cacheInvalidate,
      total: legs.total,
    },
    id: post.data?.data?.id ?? post.data?.data?._id,
  };
}

async function measureRouteBundle(cookie, route, apis) {
  const results = [];
  let totalMs = 0;
  for (const api of apis) {
    const r = await timedRequest(cookie, 'GET', `${api.path}?${api.query}`);
    results.push({ ...api, durationMs: r.durationMs, perfTrace: r.perfTrace });
    totalMs += r.durationMs;
  }
  return { route, apiCount: apis.length, totalMs, apis: results };
}

async function main() {
  const cookie = await login();

  const auth = await measureAuth(cookie);

  const stamp = Date.now();
  const customer = await measureMutation(cookie, 'customer', '/api/v1/customers', {
    name: `Perf Customer ${stamp}`,
    phone: `017${String(stamp).slice(-8)}`,
    status: 'active',
  });

  const product = await measureMutation(cookie, 'product', '/api/v1/products', {
    name: `Perf Product ${stamp}`,
    sku: `PERF-SKU-${stamp}`,
    status: 'active',
    productType: 'finished',
  });

  const supplier = await measureMutation(cookie, 'supplier', '/api/v1/suppliers', {
    name: `Perf Supplier ${stamp}`,
    status: 'active',
  });

  const navigation = [];
  for (const [route, apis] of Object.entries(ROUTE_API_MAP)) {
    navigation.push(await measureRouteBundle(cookie, route, apis));
  }

  const slowApis = [];
  for (const nav of navigation) {
    for (const api of nav.apis) {
      if (api.durationMs >= 500) {
        slowApis.push({ route: nav.route, path: api.path, durationMs: api.durationMs });
      }
    }
  }
  for (const m of [customer, product, supplier]) {
    if (m.postMs >= 500) slowApis.push({ route: 'mutation', path: m.label, durationMs: m.postMs });
  }

  const summary = {
    measuredAt: new Date().toISOString(),
    apiBase: API_BASE,
    auth,
    mutations: { customer, product, supplier },
    navigation,
    slowApis,
    comparison: {
      customerPostMs: customer.postMs,
      productPostMs: product.postMs,
      differenceMs: product.postMs - customer.postMs,
      customerMongoMs: customer.legs.mongo,
      productMongoMs: product.legs.mongo,
    },
  };

  const outPath = join(__dirname, '../docs/api-perf-results.json');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  console.log(`\nWrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
