/**
 * Shared dashboard performance measurement utilities (Playwright).
 */

export const BASE = process.env.DASHBOARD_BASE_URL ?? 'http://localhost:3000';
export const RUNS = Number(process.env.LCP_RUNS ?? 5);
export const EMAIL = process.env.DASHBOARD_EMAIL ?? 'admin@toysfactory.com';
export const PASSWORD = process.env.DASHBOARD_PASSWORD ?? 'password123';
export const HEADLESS = process.env.HEADLESS !== 'false';

export function percentile(nums, p) {
  const s = nums.filter(Number.isFinite).sort((a, b) => a - b);
  if (!s.length) return null;
  const idx = Math.ceil((p / 100) * s.length) - 1;
  return s[Math.max(0, Math.min(idx, s.length - 1))];
}

export function median(nums) {
  return percentile(nums, 50);
}

export function summarizeRuns(rows) {
  const pick = (key) => rows.map((r) => r[key]).filter(Number.isFinite);
  const lcpElements = [...new Set(rows.map((r) => r.lcpElement).filter(Boolean))];
  return {
    runs: rows.length,
    fcp: { p25: percentile(pick('fcpMs'), 25), median: median(pick('fcpMs')), p75: percentile(pick('fcpMs'), 75) },
    lcp: { p25: percentile(pick('lcpMs'), 25), median: median(pick('lcpMs')), p75: percentile(pick('lcpMs'), 75) },
    ttfb: { p25: percentile(pick('ttfbMs'), 25), median: median(pick('ttfbMs')), p75: percentile(pick('ttfbMs'), 75) },
    chunkEval: { median: median(pick('chunkEvalMs')) },
    viewMounted: { median: median(pick('viewMountedMs')) },
    lcpElements,
  };
}

export async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"], input[placeholder*="company"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button:has-text("Sign in")');
  await page.waitForURL('**/dashboard**', { timeout: 45000 }).catch(() => {});
}

export async function collectDashboardMetrics(page, url) {
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  return page.evaluate(async () => {
    return new Promise((resolve) => {
      const out = {
        fcpMs: null,
        lcpMs: null,
        lcpElement: '',
        ttfbMs: null,
        chunkEvalMs: null,
        viewMountedMs: null,
        mountMeasureMs: null,
      };
      const nav = performance.getEntriesByType('navigation')[0];
      if (nav) out.ttfbMs = nav.responseStart;

      const fcpObs = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (e.name === 'first-contentful-paint') out.fcpMs = e.startTime;
        }
      });
      fcpObs.observe({ type: 'paint', buffered: true });

      const lcpObs = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (!last) return;
        out.lcpMs = last.startTime;
        const el = last.element;
        out.lcpElement = el
          ? `${el.tagName} ${(el.textContent || '').trim().slice(0, 120)}`
          : '';
      });
      lcpObs.observe({ type: 'largest-contentful-paint', buffered: true });

      const finish = () => {
        const chunk = performance.getEntriesByName('dashboard-view-chunk-evaluated')[0];
        const mount = performance.getEntriesByName('dashboard-view-mounted')[0];
        const measure = performance.getEntriesByName('dashboard-view-mount')[0];
        if (chunk) out.chunkEvalMs = chunk.startTime;
        if (mount) out.viewMountedMs = mount.startTime;
        if (measure) out.mountMeasureMs = measure.duration;
        fcpObs.disconnect();
        lcpObs.disconnect();
        resolve(out);
      };

      const started = Date.now();
      const poll = setInterval(() => {
        const mount = performance.getEntriesByName('dashboard-view-mounted')[0];
        const timedOut = Date.now() - started > 20000;
        if (mount || timedOut) {
          clearInterval(poll);
          setTimeout(finish, 800);
        }
      }, 50);
    });
  });
}

export async function createAuthedContext(browser, { disableCache = false } = {}) {
  const context = await browser.newContext();
  if (disableCache) {
    const cdp = await context.newCDPSession(await context.newPage());
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await (await context.pages()[0]?.close?.()) ;
  }
  const page = await context.newPage();
  if (disableCache) {
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  }
  await login(page);
  return { context, page };
}
