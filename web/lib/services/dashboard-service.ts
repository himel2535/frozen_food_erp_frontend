import type { AppState } from '@/lib/state/types';

export type SalesTrendRange = 'day' | 'week' | 'month' | 'quarter' | 'year';

export type ChartSeriesPoint = {
  key: string;
  date: string;
  endDate?: string;
  label: string;
  value: number;
};

/** @deprecated alias */
export type SalesTrendPoint = ChartSeriesPoint;

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const d = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Local calendar date — avoids UTC shift on UTC+6 */
function dateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getMonday(d: Date) {
  const copy = new Date(d);
  copy.setHours(12, 0, 0, 0);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function collectRevenueRows(state: AppState) {
  const invoices = Array.isArray(state.invoices) ? state.invoices : [];
  const posReceipts = Array.isArray(state.posReceipts) ? state.posReceipts : [];
  const rows: { date: Date; amount: number }[] = [];

  for (const inv of invoices) {
    const status = String(inv.status ?? '').toLowerCase();
    if (status === 'cancelled' || status === 'draft') continue;
    const d = parseDate(inv.issueDate ?? inv.date);
    if (d) rows.push({ date: d, amount: Number(inv.amount ?? inv.total ?? 0) });
  }
  for (const receipt of posReceipts) {
    const d = parseDate(receipt.date ?? receipt.createdAt);
    if (d) rows.push({ date: d, amount: Number(receipt.total ?? receipt.amount ?? 0) });
  }
  return rows;
}

function buildChartSeries(rows: { date: Date; amount: number }[], range: SalesTrendRange, now: Date): ChartSeriesPoint[] {
  switch (range) {
    case 'day':
      return buildDayRange(rows, now);
    case 'week':
      return buildWeekRange(rows, now);
    case 'month':
      return buildMonthRange(rows, now);
    case 'quarter':
      return buildQuarterRange(rows, now);
    case 'year':
      return buildYearRange(rows, now);
    default:
      return buildMonthRange(rows, now);
  }
}

export function niceChartAxisMax(value: number) {
  if (value <= 0) return 1000;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude) * magnitude;
}

function collectSalesRows(state: AppState) {
  const orders = Array.isArray(state.salesOrders) ? state.salesOrders : [];
  const posReceipts = Array.isArray(state.posReceipts) ? state.posReceipts : [];
  const rows: { date: Date; amount: number }[] = [];

  for (const order of orders) {
    const d = parseDate(order.date ?? order.createdAt);
    if (d) rows.push({ date: d, amount: Number(order.total ?? 0) });
  }
  for (const receipt of posReceipts) {
    const d = parseDate(receipt.date ?? receipt.createdAt);
    if (d) rows.push({ date: d, amount: Number(receipt.total ?? receipt.amount ?? 0) });
  }
  return rows;
}

function sumBetween(rows: { date: Date; amount: number }[], start: Date, end: Date) {
  const startKey = dateKey(start);
  const endKey = dateKey(end);
  return rows
    .filter((r) => {
      const k = dateKey(r.date);
      return k >= startKey && k <= endKey;
    })
    .reduce((s, r) => s + r.amount, 0);
}

function formatDayLabel(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatShortDay(d: Date) {
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function formatRangeLabel(start: Date, end: Date) {
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth && start.getDate() === end.getDate()) {
    return formatShortDay(start);
  }
  if (sameMonth) {
    const month = start.toLocaleDateString(undefined, { month: 'short' });
    return `${start.getDate()}–${end.getDate()} ${month}`;
  }
  return `${formatShortDay(start)}–${formatShortDay(end)}`;
}

function formatMonthLabel(d: Date) {
  return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
}

/** Day — last 7 calendar days, one bar per day */
function buildDayRange(rows: { date: Date; amount: number }[], now: Date): ChartSeriesPoint[] {
  const result: ChartSeriesPoint[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const value = rows.filter((r) => dateKey(r.date) === key).reduce((s, r) => s + r.amount, 0);
    result.push({ key, date: key, endDate: key, label: formatDayLabel(d), value });
  }
  return result;
}

/** Week — last 4 calendar weeks (Mon–Sun), one bar per week */
function buildWeekRange(rows: { date: Date; amount: number }[], now: Date): ChartSeriesPoint[] {
  const thisMonday = getMonday(now);
  const result: ChartSeriesPoint[] = [];

  for (let i = 3; i >= 0; i -= 1) {
    const weekStart = new Date(thisMonday);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const cappedEnd = weekEnd > now ? new Date(now) : weekEnd;
    const key = dateKey(weekStart);
    const value = sumBetween(rows, weekStart, cappedEnd);
    result.push({
      key,
      date: key,
      endDate: dateKey(cappedEnd),
      label: formatRangeLabel(weekStart, cappedEnd),
      value,
    });
  }
  return result;
}

/** Month — each day from 1st of current month through today */
function buildMonthRange(rows: { date: Date; amount: number }[], now: Date): ChartSeriesPoint[] {
  const year = now.getFullYear();
  const month = now.getMonth();
  const result: ChartSeriesPoint[] = [];

  for (let day = 1; day <= now.getDate(); day += 1) {
    const d = new Date(year, month, day, 12, 0, 0);
    const key = dateKey(d);
    const value = rows.filter((r) => dateKey(r.date) === key).reduce((s, r) => s + r.amount, 0);
    result.push({
      key,
      date: key,
      endDate: key,
      label: formatShortDay(d),
      value,
    });
  }
  return result;
}

/** Last quarter — previous calendar quarter, one bar per month (3 months) */
function buildQuarterRange(rows: { date: Date; amount: number }[], now: Date): ChartSeriesPoint[] {
  const currentQuarter = Math.floor(now.getMonth() / 3);
  let quarter = currentQuarter - 1;
  let year = now.getFullYear();
  if (quarter < 0) {
    quarter = 3;
    year -= 1;
  }
  const startMonth = quarter * 3;
  const result: ChartSeriesPoint[] = [];

  for (let m = 0; m < 3; m += 1) {
    const d = new Date(year, startMonth + m, 1, 12, 0, 0);
    const key = monthKey(d);
    const value = rows.filter((r) => monthKey(r.date) === key).reduce((s, r) => s + r.amount, 0);
    result.push({
      key,
      date: dateKey(d),
      endDate: dateKey(new Date(year, startMonth + m + 1, 0)),
      label: formatMonthLabel(d),
      value,
    });
  }
  return result;
}

/** Year — last 12 calendar months including current, one bar per month */
function buildYearRange(rows: { date: Date; amount: number }[], now: Date): ChartSeriesPoint[] {
  const result: ChartSeriesPoint[] = [];
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1, 12, 0, 0);
    const key = monthKey(d);
    const value = rows.filter((r) => monthKey(r.date) === key).reduce((s, r) => s + r.amount, 0);
    result.push({
      key,
      date: dateKey(d),
      endDate: dateKey(new Date(d.getFullYear(), d.getMonth() + 1, 0)),
      label: formatMonthLabel(d),
      value,
    });
  }
  return result;
}

export function getSalesTrendSeries(state: AppState, range: SalesTrendRange = 'month'): ChartSeriesPoint[] {
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  return buildChartSeries(collectSalesRows(state), range, now);
}

export function getRevenueSeries(state: AppState, range: SalesTrendRange = 'month'): ChartSeriesPoint[] {
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  return buildChartSeries(collectRevenueRows(state), range, now);
}

export function getRevenueByMonth(state: AppState, months = 10): { month: number; year: number; value: number }[] {
  const invoices = Array.isArray(state.invoices) ? state.invoices : [];
  const now = new Date();
  const result: { month: number; year: number; value: number }[] = [];

  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({ month: d.getMonth() + 1, year: d.getFullYear(), value: 0 });
  }

  for (const inv of invoices) {
    const status = String(inv.status ?? '').toLowerCase();
    if (status === 'cancelled' || status === 'draft') continue;
    const d = parseDate(inv.issueDate ?? inv.date);
    if (!d) continue;
    const slot = result.find((r) => r.month === d.getMonth() + 1 && r.year === d.getFullYear());
    if (slot) slot.value += Number(inv.amount ?? inv.total ?? 0);
  }

  return result;
}

export type TopProductRow = {
  name: string;
  category: string;
  sold: number;
  revenue: number;
  imageUrl: string;
};

function isCancelledOrDraft(doc: Record<string, unknown>) {
  const status = String(doc.status ?? '').toLowerCase();
  return status === 'cancelled' || status === 'canceled' || status === 'draft';
}

type CatalogEntry = {
  identity: string;
  name: string;
  category: string;
  imageUrl: string;
};

function uniqueKeys(...values: unknown[]) {
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const key = String(value ?? '').trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    keys.push(key);
  }
  return keys;
}

function lineName(item: Record<string, unknown>) {
  return String(item.productName ?? item.name ?? item.description ?? '').trim();
}

function lineSku(item: Record<string, unknown>) {
  return String(item.sku ?? item.productId ?? item.productSku ?? item.code ?? '').trim();
}

function salesDocuments(state: AppState) {
  return [
    ...(Array.isArray(state.salesOrders) ? state.salesOrders : []),
    ...(Array.isArray(state.invoices) ? state.invoices : []),
    ...(Array.isArray(state.posReceipts) ? state.posReceipts : []),
  ] as Record<string, unknown>[];
}

function catalogLookup(state: AppState) {
  const byKey = new Map<string, CatalogEntry>();
  const set = (key: string, entry: CatalogEntry) => {
    const normalized = key.trim().toLowerCase();
    if (!normalized || byKey.has(normalized)) return;
    byKey.set(normalized, entry);
  };
  const inventory = Array.isArray(state.inventory) ? state.inventory : [];
  const catalogRows = [
    ...inventory.filter((row) => !String(row.productType ?? '').toLowerCase().includes('raw')),
    ...(Array.isArray(state.finishedGoods) ? state.finishedGoods : []),
  ];
  catalogRows.forEach((product) => {
    const name = String(product.name ?? 'Product').trim();
    if (!name) return;
    const identity = uniqueKeys(product.sku, product.legacyId, product.id, product._mongoId)[0] || name.toLowerCase();
    const entry: CatalogEntry = {
      identity,
      name,
      category: String(product.category ?? '').trim() || '—',
      imageUrl: String(product.imageUrl ?? '').trim(),
    };
    for (const key of uniqueKeys(product.id, product.legacyId, product.sku, product._mongoId, name)) {
      set(key, entry);
    }
  });
  return byKey;
}

/** Lines that still have the old name can reuse SKU/productId from other docs. */
function skuHintsFromDocuments(docs: Record<string, unknown>[]) {
  const hints = new Map<string, string>();
  for (const doc of docs) {
    if (isCancelledOrDraft(doc)) continue;
    const items = Array.isArray(doc.items) ? doc.items : [];
    for (const raw of items) {
      if (!raw || typeof raw !== 'object') continue;
      const item = raw as Record<string, unknown>;
      const name = lineName(item).toLowerCase();
      const sku = lineSku(item);
      if (name && sku && !hints.has(name)) hints.set(name, sku);
    }
  }
  return hints;
}

function catalogHitForLine(
  item: Record<string, unknown>,
  catalog: Map<string, CatalogEntry>,
  skuHints: Map<string, string>,
): CatalogEntry | undefined {
  const hintedSku = skuHints.get(lineName(item).toLowerCase()) ?? '';
  const keys = uniqueKeys(
    item.sku,
    item.productId,
    item.productSku,
    item.code,
    item.id,
    hintedSku,
    item.productName,
    item.name,
    item.description,
  );
  for (const key of keys) {
    const hit = catalog.get(key);
    if (hit) return hit;
  }
  return undefined;
}

function lineRevenue(item: Record<string, unknown>, qty: number, unitPrice: number) {
  const stored = Number(item.total ?? item.amount ?? item.lineTotal ?? NaN);
  if (Number.isFinite(stored) && stored > 0) return stored;
  return qty * unitPrice;
}

function accumulateLineItem(
  map: Map<string, TopProductRow>,
  item: Record<string, unknown>,
  catalog: Map<string, CatalogEntry>,
  skuHints: Map<string, string>,
) {
  const qty = Number(item.qty ?? item.quantity ?? 0);
  const unitPrice = Number(item.price ?? item.unitPrice ?? item.rate ?? 0);
  const revenue = lineRevenue(item, qty, unitPrice);
  if (qty <= 0 && revenue <= 0) return;

  const catalogHit = catalogHitForLine(item, catalog, skuHints);
  // Skip names that only exist on old SO/invoice/POS lines (deleted or never in Products).
  if (!catalogHit) return;

  const existing = map.get(catalogHit.identity) ?? {
    name: catalogHit.name,
    category: catalogHit.category,
    sold: 0,
    revenue: 0,
    imageUrl: catalogHit.imageUrl,
  };
  existing.sold += qty;
  existing.revenue += revenue;
  existing.name = catalogHit.name;
  existing.category = catalogHit.category;
  existing.imageUrl = catalogHit.imageUrl || existing.imageUrl;
  map.set(catalogHit.identity, existing);
}

function accumulateFromDocuments(
  map: Map<string, TopProductRow>,
  docs: Record<string, unknown>[],
  catalog: Map<string, CatalogEntry>,
  skuHints: Map<string, string>,
) {
  for (const doc of docs) {
    if (isCancelledOrDraft(doc)) continue;
    const items = Array.isArray(doc.items) ? doc.items : [];
    for (const item of items) {
      if (item && typeof item === 'object') {
        accumulateLineItem(map, item as Record<string, unknown>, catalog, skuHints);
      }
    }
  }
}

export function getTopProducts(state: AppState, limit = 3): TopProductRow[] {
  const catalog = catalogLookup(state);
  const docs = salesDocuments(state);
  const skuHints = skuHintsFromDocuments(docs);
  const map = new Map<string, TopProductRow>();
  accumulateFromDocuments(map, docs, catalog, skuHints);

  return Array.from(map.values())
    .filter((row) => row.sold > 0 || row.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue || b.sold - a.sold)
    .slice(0, limit);
}

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '—';
  const diffMs = Date.now() - then.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
