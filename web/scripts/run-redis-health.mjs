/**
 * Redis health + application cache HIT/MISS test.
 *
 * Usage:
 *   node scripts/run-redis-health.mjs
 *   API_BASE=http://localhost:5000 node scripts/run-redis-health.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_BASE = process.env.API_BASE ?? 'http://localhost:5000';
const HEALTH = `${API_BASE}/health`;
const EMAIL = process.env.DASHBOARD_EMAIL ?? 'admin@toysfactory.com';
const PASSWORD = process.env.DASHBOARD_PASSWORD ?? 'password123';

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, headers: Object.fromEntries(res.headers.entries()), body };
}

async function loginCookie() {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const raw = res.headers.get('set-cookie');
  const cookies = setCookie.length ? setCookie : raw ? [raw] : [];
  const tokenCookie = cookies.find((c) => c.startsWith('token='));
  if (!tokenCookie) throw new Error('Login failed — no token cookie');
  return tokenCookie.split(';')[0];
}

async function timedGet(path, cookie) {
  const started = Date.now();
  const res = await fetchJson(`${API_BASE}${path}`, {
    headers: { Cookie: cookie },
  });
  return { ...res, durationMs: Date.now() - started };
}

async function main() {
  const health = await fetchJson(HEALTH);
  const redisTest = await fetchJson(`${HEALTH}/redis-test`);

  let appCache = null;
  try {
    const cookie = await loginCookie();
    const first = await timedGet('/api/v1/dashboard/summary?scope=full', cookie);
    const second = await timedGet('/api/v1/dashboard/summary?scope=full', cookie);
    appCache = {
      firstMs: first.durationMs,
      secondMs: second.durationMs,
      speedupMs: first.durationMs - second.durationMs,
      secondFaster: second.durationMs < first.durationMs,
    };
  } catch (err) {
    appCache = { error: err instanceof Error ? err.message : String(err) };
  }

  const summary = {
    measuredAt: new Date().toISOString(),
    apiBase: API_BASE,
    health: health.body,
    redisTest: redisTest.body,
    appCache,
    redisStatus:
      health.body?.data?.redis
      ?? health.body?.redis
      ?? 'unknown',
  };

  const outPath = join(__dirname, '../docs/redis-health-results.json');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  console.log(`\nWrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
