import { formatCurrency } from '@/lib/services/domain-service';
import { formatAppDate } from '@/lib/i18n/locale-format';
import type { KpiCardItem } from '@/components/shared/KpiCards';

export type PurchaseReportRow = {
  id: string;
  date: string;
  ref: string;
  supplier: string;
  status: string;
  paymentStatus: string;
  total: number;
  received: number;
  pending: number;
};

export type PurchaseReportFilters = {
  search: string;
  dateStart: string;
  dateEnd: string;
  supplier: string;
  status: string;
};

export type PurchaseStatusSummary = {
  received: number;
  pending: number;
  cancelled: number;
  totalAmount: number;
};

export type PurchaseTopSupplier = {
  name: string;
  initials: string;
  totalSpent: number;
  orderCount: number;
};

export type PurchaseChartPoint = {
  label: string;
  thisMonth: number;
  lastMonth: number;
};

function normalizeRow(row: Record<string, unknown>): PurchaseReportRow {
  const total = Number(row.total ?? 0);
  const received = Number(row.received ?? 0);
  const pending = Number(row.pending ?? total - received);
  return {
    id: String(row.id ?? row.ref ?? ''),
    date: String(row.date ?? ''),
    ref: String(row.ref ?? ''),
    supplier: String(row.supplier ?? ''),
    status: String(row.status ?? ''),
    paymentStatus: String(row.paymentStatus ?? 'Unpaid'),
    total,
    received,
    pending,
  };
}

export function listPurchaseReportRows(rows: Record<string, unknown>[]): PurchaseReportRow[] {
  return rows.map(normalizeRow);
}

export function filterPurchaseRows(rows: PurchaseReportRow[], filters: PurchaseReportFilters): PurchaseReportRow[] {
  let data = [...rows];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    data = data.filter(
      (row) => row.ref.toLowerCase().includes(q) || row.supplier.toLowerCase().includes(q),
    );
  }
  if (filters.dateStart) {
    data = data.filter((row) => row.date >= filters.dateStart);
  }
  if (filters.dateEnd) {
    data = data.filter((row) => row.date <= filters.dateEnd);
  }
  if (filters.supplier !== 'All') {
    data = data.filter((row) => row.supplier === filters.supplier);
  }
  if (filters.status !== 'All') {
    data = data.filter((row) => row.status === filters.status);
  }

  return data;
}

export function uniqueSuppliers(rows: PurchaseReportRow[]): string[] {
  return [...new Set(rows.map((r) => r.supplier))].sort();
}

function trendSub(current: number, previous: number, suffix: string): string {
  if (previous <= 0 && current <= 0) return `— ${suffix}`;
  if (previous <= 0) return `▲ 100% ${suffix}`;
  const pct = ((current - previous) / previous) * 100;
  const arrow = pct >= 0 ? '▲' : '▼';
  return `${arrow} ${Math.abs(pct).toFixed(1)}% ${suffix}`;
}

function splitByMonth(rows: PurchaseReportRow[]) {
  const thisMonth: PurchaseReportRow[] = [];
  const lastMonth: PurchaseReportRow[] = [];

  rows.forEach((row) => {
    const month = row.date.slice(0, 7);
    if (month === '2026-06') thisMonth.push(row);
    else if (month === '2026-05') lastMonth.push(row);
  });

  return { thisMonth, lastMonth };
}

export function buildPurchaseKpis(
  rows: PurchaseReportRow[],
  allRows: PurchaseReportRow[],
  trendSuffix: string,
): KpiCardItem[] {
  const total = rows.reduce((s, r) => s + r.total, 0);
  const avg = rows.length ? total / rows.length : 0;
  const receivedAmount = rows.reduce((s, r) => s + r.received, 0);
  const pendingAmount = rows.reduce((s, r) => s + r.pending, 0);

  const { thisMonth, lastMonth } = splitByMonth(allRows);
  const thisTotal = thisMonth.reduce((s, r) => s + r.total, 0);
  const lastTotal = lastMonth.reduce((s, r) => s + r.total, 0);
  const thisCount = thisMonth.length;
  const lastCount = lastMonth.length;
  const thisAvg = thisCount ? thisTotal / thisCount : 0;
  const lastAvg = lastCount ? lastTotal / lastCount : 0;
  const thisReceived = thisMonth.reduce((s, r) => s + r.received, 0);
  const lastReceived = lastMonth.reduce((s, r) => s + r.received, 0);
  const thisPending = thisMonth.reduce((s, r) => s + r.pending, 0);
  const lastPending = lastMonth.reduce((s, r) => s + r.pending, 0);

  return [
    {
      key: 'spend',
      label: 'Total Spend',
      value: formatCurrency(total),
      sub: trendSub(thisTotal, lastTotal, trendSuffix),
      iconify: 'flat-color-icons:line-chart',
    },
    {
      key: 'count',
      label: 'PO Count',
      value: String(rows.length),
      sub: trendSub(thisCount, lastCount, trendSuffix),
      iconify: 'flat-color-icons:document',
    },
    {
      key: 'avg',
      label: 'Avg PO Value',
      value: formatCurrency(avg),
      sub: trendSub(thisAvg, lastAvg, trendSuffix),
      iconify: 'flat-color-icons:currency-exchange',
    },
    {
      key: 'received',
      label: 'Received Amount',
      value: formatCurrency(receivedAmount),
      sub: trendSub(thisReceived, lastReceived, trendSuffix),
      iconify: 'flat-color-icons:paid',
    },
    {
      key: 'pending',
      label: 'Pending Amount',
      value: formatCurrency(pendingAmount),
      sub: trendSub(thisPending, lastPending, trendSuffix),
      iconify: 'fluent-color:alert-badge-24',
      alert: pendingAmount > 0,
    },
  ];
}

export function buildPurchaseStatusSummary(rows: PurchaseReportRow[]): PurchaseStatusSummary {
  const summary = { received: 0, pending: 0, cancelled: 0, totalAmount: 0 };

  rows.forEach((row) => {
    summary.totalAmount += row.total;
    const key = row.status.toLowerCase();
    if (key === 'received') summary.received += row.total;
    else if (key === 'cancelled') summary.cancelled += row.total;
    else summary.pending += row.total;
  });

  return summary;
}

export function buildTopSuppliers(rows: PurchaseReportRow[], limit = 5): PurchaseTopSupplier[] {
  const map = new Map<string, { totalSpent: number; orderCount: number }>();

  rows.forEach((row) => {
    const existing = map.get(row.supplier) ?? { totalSpent: 0, orderCount: 0 };
    existing.totalSpent += row.total;
    existing.orderCount += 1;
    map.set(row.supplier, existing);
  });

  return [...map.entries()]
    .map(([name, data]) => ({
      name,
      initials: supplierInitials(name),
      totalSpent: data.totalSpent,
      orderCount: data.orderCount,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, limit);
}

const CHART_BUCKETS = ['May 5', 'May 12', 'May 19', 'May 26', 'Jun 2', 'Jun 9', 'Jun 16'];

export function buildPurchaseChartSeries(rows: PurchaseReportRow[]): PurchaseChartPoint[] {
  const mayRows = rows.filter((r) => r.date.startsWith('2026-05'));
  const juneRows = rows.filter((r) => r.date.startsWith('2026-06'));

  const bucketMay = (day: number) => mayRows.filter((r) => Number(r.date.slice(8, 10)) <= day);
  const bucketJune = (day: number) => juneRows.filter((r) => Number(r.date.slice(8, 10)) <= day);

  const mayCuts = [5, 12, 19, 26].map((d) => bucketMay(d).reduce((s, r) => s + r.total, 0));
  const juneCuts = [2, 9, 16].map((d) => bucketJune(d).reduce((s, r) => s + r.total, 0));

  return CHART_BUCKETS.map((label, idx) => ({
    label,
    lastMonth: idx < 4 ? mayCuts[idx] ?? 0 : 0,
    thisMonth: idx >= 4 ? juneCuts[idx - 4] ?? 0 : 0,
  }));
}

export function supplierInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function formatReportDate(date: string): string {
  if (!date) return '—';
  const d = new Date(`${date}T00:00:00`);
  return formatAppDate(d, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatFilterSummary(filters: PurchaseReportFilters): string {
  const parts: string[] = [];
  if (filters.dateStart || filters.dateEnd) {
    parts.push(`${filters.dateStart || '…'} – ${filters.dateEnd || '…'}`);
  }
  if (filters.supplier !== 'All') parts.push(filters.supplier);
  if (filters.status !== 'All') parts.push(filters.status);
  return parts.length ? parts.join(' · ') : 'All records';
}
