import { formatCurrency } from '@/lib/services/domain-service';
import { formatAppDate } from '@/lib/i18n/locale-format';
import type { KpiCardItem } from '@/components/shared/KpiCards';

export type SalesReportRow = {
  id: string;
  date: string;
  ref: string;
  customer: string;
  status: string;
  paymentMethod: string;
  total: number;
};

export type SalesReportFilters = {
  search: string;
  dateStart: string;
  dateEnd: string;
  customer: string;
  status: string;
};

export type SalesStatusSummary = {
  paid: number;
  unpaid: number;
  partial: number;
  cancelled: number;
  total: number;
};

export type SalesTopCustomer = {
  name: string;
  initials: string;
  totalSpent: number;
  orderCount: number;
};

export type SalesChartPoint = {
  label: string;
  thisMonth: number;
  lastMonth: number;
};

function parseDay(iso: string): Date | null {
  const day = String(iso ?? '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const d = new Date(`${day}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function referenceDate(rows: SalesReportRow[]): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let latest = today;
  rows.forEach((row) => {
    const d = parseDay(row.date);
    if (d && d > latest) latest = d;
  });
  return latest;
}

function normalizeRow(row: Record<string, unknown>): SalesReportRow {
  return {
    id: String(row.id ?? row.ref ?? ''),
    date: String(row.date ?? ''),
    ref: String(row.ref ?? ''),
    customer: String(row.customer ?? ''),
    status: String(row.status ?? ''),
    paymentMethod: String(row.paymentMethod ?? 'Cash'),
    total: Number(row.total ?? 0),
  };
}

export function listSalesReportRows(rows: Record<string, unknown>[]): SalesReportRow[] {
  return rows.map(normalizeRow);
}

export function filterSalesRows(rows: SalesReportRow[], filters: SalesReportFilters): SalesReportRow[] {
  let data = [...rows];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    data = data.filter(
      (row) => row.ref.toLowerCase().includes(q) || row.customer.toLowerCase().includes(q),
    );
  }
  if (filters.dateStart) {
    data = data.filter((row) => row.date >= filters.dateStart);
  }
  if (filters.dateEnd) {
    data = data.filter((row) => row.date <= filters.dateEnd);
  }
  if (filters.customer !== 'All') {
    data = data.filter((row) => row.customer === filters.customer);
  }
  if (filters.status !== 'All') {
    data = data.filter((row) => row.status === filters.status);
  }

  return data;
}

export function uniqueCustomers(rows: SalesReportRow[]): string[] {
  return [...new Set(rows.map((r) => r.customer))].sort();
}

function trendSub(current: number, previous: number, suffix: string): string {
  if (previous <= 0 && current <= 0) return `— ${suffix}`;
  if (previous <= 0) return `▲ 100% ${suffix}`;
  const pct = ((current - previous) / previous) * 100;
  const arrow = pct >= 0 ? '▲' : '▼';
  return `${arrow} ${Math.abs(pct).toFixed(1)}% ${suffix}`;
}

function splitByMonth(rows: SalesReportRow[]) {
  const ref = referenceDate(rows);
  const thisKey = monthKey(ref);
  const last = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);
  const lastKey = monthKey(last);
  const thisMonth: SalesReportRow[] = [];
  const lastMonth: SalesReportRow[] = [];

  rows.forEach((row) => {
    const month = row.date.slice(0, 7);
    if (month === thisKey) thisMonth.push(row);
    else if (month === lastKey) lastMonth.push(row);
  });

  return { thisMonth, lastMonth };
}

export function buildSalesKpis(
  rows: SalesReportRow[],
  allRows: SalesReportRow[],
  trendSuffix: string,
): KpiCardItem[] {
  const total = rows.reduce((s, r) => s + r.total, 0);
  const avg = rows.length ? total / rows.length : 0;
  const paidOrders = rows.filter((r) => r.status === 'Paid').length;
  const unpaidAmount = rows
    .filter((r) => r.status === 'Unpaid' || r.status === 'Partial')
    .reduce((s, r) => s + r.total, 0);

  const { thisMonth, lastMonth } = splitByMonth(allRows);
  const thisTotal = thisMonth.reduce((s, r) => s + r.total, 0);
  const lastTotal = lastMonth.reduce((s, r) => s + r.total, 0);
  const thisCount = thisMonth.length;
  const lastCount = lastMonth.length;
  const thisAvg = thisCount ? thisTotal / thisCount : 0;
  const lastAvg = lastCount ? lastTotal / lastCount : 0;
  const thisPaid = thisMonth.filter((r) => r.status === 'Paid').length;
  const lastPaid = lastMonth.filter((r) => r.status === 'Paid').length;
  const thisUnpaid = thisMonth
    .filter((r) => r.status === 'Unpaid' || r.status === 'Partial')
    .reduce((s, r) => s + r.total, 0);
  const lastUnpaid = lastMonth
    .filter((r) => r.status === 'Unpaid' || r.status === 'Partial')
    .reduce((s, r) => s + r.total, 0);

  return [
    {
      key: 'revenue',
      label: 'Total Revenue',
      value: formatCurrency(total),
      sub: trendSub(thisTotal, lastTotal, trendSuffix),
      iconify: 'flat-color-icons:line-chart',
    },
    {
      key: 'orders',
      label: 'Total Orders',
      value: String(rows.length),
      sub: trendSub(thisCount, lastCount, trendSuffix),
      iconify: 'flat-color-icons:document',
    },
    {
      key: 'avg',
      label: 'Avg Order Value',
      value: formatCurrency(avg),
      sub: trendSub(thisAvg, lastAvg, trendSuffix),
      iconify: 'flat-color-icons:currency-exchange',
    },
    {
      key: 'paid',
      label: 'Paid Orders',
      value: String(paidOrders),
      sub: trendSub(thisPaid, lastPaid, trendSuffix),
      iconify: 'flat-color-icons:paid',
    },
    {
      key: 'unpaid',
      label: 'Unpaid Amount',
      value: formatCurrency(unpaidAmount),
      sub: trendSub(thisUnpaid, lastUnpaid, trendSuffix),
      iconify: 'fluent-color:alert-badge-24',
      alert: unpaidAmount > 0,
    },
  ];
}

export function buildStatusSummary(rows: SalesReportRow[]): SalesStatusSummary {
  const summary = { paid: 0, unpaid: 0, partial: 0, cancelled: 0, total: rows.length };
  rows.forEach((row) => {
    const key = row.status.toLowerCase();
    if (key === 'paid') summary.paid += 1;
    else if (key === 'unpaid') summary.unpaid += 1;
    else if (key === 'partial') summary.partial += 1;
    else if (key === 'cancelled') summary.cancelled += 1;
  });
  return summary;
}

export function buildTopCustomers(rows: SalesReportRow[], limit = 5): SalesTopCustomer[] {
  const map = new Map<string, { totalSpent: number; orderCount: number }>();

  rows.forEach((row) => {
    const existing = map.get(row.customer) ?? { totalSpent: 0, orderCount: 0 };
    existing.totalSpent += row.total;
    existing.orderCount += 1;
    map.set(row.customer, existing);
  });

  return [...map.entries()]
    .map(([name, data]) => ({
      name,
      initials: name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join(''),
      totalSpent: data.totalSpent,
      orderCount: data.orderCount,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, limit);
}

export function buildChartSeries(rows: SalesReportRow[]): SalesChartPoint[] {
  const active = rows.filter((row) => {
    const status = row.status.toLowerCase();
    return status !== 'cancelled' && status !== 'draft';
  });
  const ref = referenceDate(active);
  const thisYear = ref.getFullYear();
  const thisMonthIdx = ref.getMonth();
  const lastDay = new Date(thisYear, thisMonthIdx + 1, 0).getDate();
  const cuts = [...new Set([5, 10, 15, 20, 25, lastDay].filter((day) => day <= lastDay))];

  const lastMonthDate = new Date(thisYear, thisMonthIdx - 1, 1);
  const lastYear = lastMonthDate.getFullYear();
  const lastMonthIdx = lastMonthDate.getMonth();
  const lastMonthLastDay = new Date(lastYear, lastMonthIdx + 1, 0).getDate();

  const sumInWindow = (year: number, month: number, startDay: number, endDay: number) =>
    active.reduce((sum, row) => {
      const d = parseDay(row.date);
      if (!d || d.getFullYear() !== year || d.getMonth() !== month) return sum;
      const day = d.getDate();
      if (day < startDay || day > endDay) return sum;
      return sum + row.total;
    }, 0);

  return cuts.map((endDay, index) => {
    const startDay = index === 0 ? 1 : (cuts[index - 1] ?? 0) + 1;
    return {
      label: String(endDay),
      thisMonth: sumInWindow(thisYear, thisMonthIdx, startDay, endDay),
      lastMonth: sumInWindow(
        lastYear,
        lastMonthIdx,
        startDay,
        Math.min(endDay, lastMonthLastDay),
      ),
    };
  });
}

export function customerInitials(name: string): string {
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

export function paymentMethodIcon(method: string): string {
  const key = method.toLowerCase();
  if (key.includes('cash')) return 'fluent-color:money-24';
  if (key.includes('bank')) return 'fluent-color:building-bank-24';
  if (key.includes('card')) return 'fluent-color:credit-card-person-24';
  if (key.includes('bkash')) return 'mdi:cellphone';
  return 'fluent-color:wallet-24';
}

export function formatFilterSummary(filters: SalesReportFilters): string {
  const parts: string[] = [];
  if (filters.dateStart || filters.dateEnd) {
    parts.push(`${filters.dateStart || '…'} – ${filters.dateEnd || '…'}`);
  }
  if (filters.customer !== 'All') parts.push(filters.customer);
  if (filters.status !== 'All') parts.push(filters.status);
  return parts.length ? parts.join(' · ') : 'All records';
}
