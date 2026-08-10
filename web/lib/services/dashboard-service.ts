import type { AppState } from '@/lib/state/types';

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const d = new Date(String(value).slice(0, 10) + 'T12:00:00');
  return Number.isNaN(d.getTime()) ? null : d;
}

function weekStartKey(d: Date): string {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().slice(0, 10);
}

export function getSalesTrendSeries(state: AppState): { date: string; value: number }[] {
  const orders = Array.isArray(state.salesOrders) ? state.salesOrders : [];
  const invoices = Array.isArray(state.invoices) ? state.invoices : [];
  const buckets = new Map<string, number>();

  for (const order of orders) {
    const d = parseDate(order.date);
    if (!d) continue;
    const key = weekStartKey(d);
    buckets.set(key, (buckets.get(key) ?? 0) + Number(order.total ?? 0));
  }
  for (const inv of invoices) {
    const d = parseDate(inv.date);
    if (!d) continue;
    const key = weekStartKey(d);
    buckets.set(key, (buckets.get(key) ?? 0) + Number(inv.amount ?? 0));
  }

  const sorted = Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7);

  if (!sorted.length) {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i) * 7);
      return { date: weekStartKey(d), value: 0 };
    });
  }

  return sorted.map(([date, value]) => ({ date, value }));
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
    const d = parseDate(inv.date);
    if (!d) continue;
    const slot = result.find((r) => r.month === d.getMonth() + 1 && r.year === d.getFullYear());
    if (slot) slot.value += Number(inv.amount ?? 0);
  }

  return result;
}

export type TopProductRow = {
  name: string;
  category: string;
  sold: number;
  revenue: number;
};

export function getTopProducts(state: AppState, limit = 3): TopProductRow[] {
  const orders = Array.isArray(state.salesOrders) ? state.salesOrders : [];
  const map = new Map<string, TopProductRow>();

  for (const order of orders) {
    const items = Array.isArray(order.items) ? order.items : [];
    for (const item of items) {
      const name = String(item.name ?? item.productName ?? 'Product');
      const existing = map.get(name) ?? { name, category: String(item.category ?? '—'), sold: 0, revenue: 0 };
      const qty = Number(item.qty ?? item.quantity ?? 0);
      const price = Number(item.price ?? item.unitPrice ?? 0);
      existing.sold += qty;
      existing.revenue += qty * price;
      map.set(name, existing);
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
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
