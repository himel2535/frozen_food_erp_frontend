import { formatCurrency } from '@/lib/services/domain-service';
import { formatAppDate } from '@/lib/i18n/locale-format';
import type { KpiCardItem } from '@/components/shared/KpiCards';

export type CustomerReportRow = {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  sales: number;
  due: number;
  status: 'active' | 'overdue';
  lastSaleDate: string;
};

export type CustomerReportFilters = {
  search: string;
  dateStart: string;
  dateEnd: string;
  status: string;
};

export type CustomerBreakdownSlice = {
  key: string;
  label: string;
  amount: number;
  pct: number;
};

export type CustomerRecentActivityRow = {
  id: string;
  date: string;
  ref: string;
  customer: string;
  total: number;
  status: string;
};

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-orange-100 text-orange-700',
  'bg-violet-100 text-violet-700',
  'bg-rose-100 text-rose-700',
];

function normalizeRow(row: Record<string, unknown>): CustomerReportRow {
  const statusRaw = String(row.status ?? 'active').toLowerCase();
  return {
    id: String(row.id ?? row.name ?? ''),
    name: String(row.name ?? ''),
    company: String(row.company ?? ''),
    phone: String(row.phone ?? ''),
    email: String(row.email ?? ''),
    sales: Number(row.sales ?? 0),
    due: Number(row.due ?? 0),
    status: statusRaw === 'overdue' ? 'overdue' : 'active',
    lastSaleDate: String(row.lastSaleDate ?? ''),
  };
}

export function listCustomerReportRows(rows: Record<string, unknown>[]): CustomerReportRow[] {
  return rows.map(normalizeRow);
}

export function filterCustomerRows(rows: CustomerReportRow[], filters: CustomerReportFilters): CustomerReportRow[] {
  let data = [...rows];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    data = data.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.company.toLowerCase().includes(q) ||
        row.phone.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q),
    );
  }

  if (filters.status !== 'All') {
    const statusKey = filters.status.toLowerCase();
    data = data.filter((row) => row.status === statusKey);
  }

  return data;
}

export function getCustomerInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function getCustomerAvatarClass(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function buildCustomerKpis(rows: CustomerReportRow[], trendSuffix: string): KpiCardItem[] {
  const totalSales = rows.reduce((s, r) => s + r.sales, 0);
  const totalDue = rows.reduce((s, r) => s + r.due, 0);
  const activeCount = rows.filter((r) => r.status === 'active').length;
  const overdueCount = rows.filter((r) => r.status === 'overdue').length;

  return [
    {
      key: 'sales',
      label: 'Total Sales',
      value: formatCurrency(totalSales),
      sub: `▲ 12.45% ${trendSuffix}`,
      iconify: 'flat-color-icons:line-chart',
    },
    {
      key: 'due',
      label: 'Total Due',
      value: formatCurrency(totalDue),
      sub: `▲ 8.34% ${trendSuffix}`,
      alert: totalDue > 0,
      iconify: 'flat-color-icons:currency-exchange',
    },
    {
      key: 'count',
      label: 'Total Customers',
      value: String(rows.length),
      sub: `— 0% ${trendSuffix}`,
      iconify: 'fluent-color:people-24',
    },
    {
      key: 'active',
      label: 'Active Customers',
      value: String(activeCount),
      sub: `▲ 100% ${trendSuffix}`,
      iconify: 'fluent-color:person-checkmark-24',
    },
    {
      key: 'overdue',
      label: 'Overdue Customers',
      value: String(overdueCount),
      sub: overdueCount > 0 ? `▲ 100% ${trendSuffix}` : `— 0% ${trendSuffix}`,
      alert: overdueCount > 0,
      iconify: 'fluent-color:alert-badge-24',
    },
  ];
}

export function buildSalesByCustomer(rows: CustomerReportRow[]): CustomerBreakdownSlice[] {
  const total = rows.reduce((s, r) => s + r.sales, 0);
  return rows
    .map((row) => ({
      key: row.name,
      label: row.name,
      amount: row.sales,
      pct: total > 0 ? (row.sales / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function buildOutstandingByCustomer(rows: CustomerReportRow[]): CustomerBreakdownSlice[] {
  const withDue = rows.filter((r) => r.due > 0);
  const total = withDue.reduce((s, r) => s + r.due, 0);
  return withDue
    .map((row) => ({
      key: row.name,
      label: row.name,
      amount: row.due,
      pct: total > 0 ? (row.due / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function buildStatusBreakdown(rows: CustomerReportRow[]): CustomerBreakdownSlice[] {
  const total = rows.length;
  const active = rows.filter((r) => r.status === 'active').length;
  const overdue = rows.filter((r) => r.status === 'overdue').length;

  return [
    { key: 'active', label: 'Active', amount: active, pct: total > 0 ? (active / total) * 100 : 0 },
    { key: 'overdue', label: 'Overdue', amount: overdue, pct: total > 0 ? (overdue / total) * 100 : 0 },
  ];
}

export function buildRecentActivity(
  salesRows: Record<string, unknown>[],
  customerNames: string[],
  limit = 4,
): CustomerRecentActivityRow[] {
  const names = new Set(customerNames);
  return salesRows
    .map((row) => ({
      id: String(row.id ?? row.ref ?? ''),
      date: String(row.date ?? ''),
      ref: String(row.ref ?? ''),
      customer: String(row.customer ?? ''),
      total: Number(row.total ?? 0),
      status: String(row.status ?? ''),
    }))
    .filter((row) => names.has(row.customer))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

export function formatFilterSummary(filters: CustomerReportFilters): string {
  const parts: string[] = [];
  if (filters.dateStart || filters.dateEnd) {
    parts.push(`${filters.dateStart || '…'} – ${filters.dateEnd || '…'}`);
  }
  if (filters.status !== 'All') parts.push(filters.status);
  return parts.length ? parts.join(' · ') : 'All records';
}

export function formatReportingPeriod(filters: CustomerReportFilters): string {
  if (filters.dateStart && filters.dateEnd) {
    const fmt = (d: string) => {
      const date = new Date(`${d}T00:00:00`);
      return formatAppDate(date);
    };
    return `${fmt(filters.dateStart)} - ${fmt(filters.dateEnd)}`;
  }
  return '01/06/2026 - 12/06/2026';
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '—';
  const date = new Date(`${dateStr}T00:00:00`);
  return formatAppDate(date);
}

export function getSliceColors(
  map: Record<string, { from: string; to: string }>,
  key: string,
  index: number,
) {
  const fallback = [
    { from: '#3b82f6', to: '#2563eb' },
    { from: '#10b981', to: '#059669' },
    { from: '#f97316', to: '#ea580c' },
    { from: '#8b5cf6', to: '#7c3aed' },
  ];
  return map[key] ?? fallback[index % fallback.length];
}
