import { formatCurrency } from '@/lib/services/domain-service';
import { formatAppDate } from '@/lib/i18n/locale-format';
import type { KpiCardItem } from '@/components/shared/KpiCards';

export type SupplierReportRow = {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  purchases: number;
  due: number;
  status: 'active' | 'inactive';
  lastPurchaseDate: string;
};

export type SupplierReportFilters = {
  search: string;
  dateStart: string;
  dateEnd: string;
  status: string;
};

export type SupplierBreakdownSlice = {
  key: string;
  label: string;
  amount: number;
  pct: number;
};

export type SupplierRecentActivityRow = {
  id: string;
  date: string;
  ref: string;
  supplier: string;
  items: string;
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

const DEMO_ITEMS_BY_REF: Record<string, string> = {
  'PO-2026-00041': 'Cotton Yarn, Dye, Buttons, Elastic',
  'PO-2026-00038': 'Silk Fabric, Thread',
  'PO-2026-00036': 'Red Dye #4, Blue Dye, Solvent',
  'PO-2026-00032': 'Plastic Resin, Colorant',
};

function normalizeRow(row: Record<string, unknown>): SupplierReportRow {
  const statusRaw = String(row.status ?? 'active').toLowerCase();
  return {
    id: String(row.id ?? row.name ?? ''),
    name: String(row.name ?? ''),
    contactPerson: String(row.contactPerson ?? row.contact ?? ''),
    phone: String(row.phone ?? ''),
    email: String(row.email ?? ''),
    purchases: Number(row.purchases ?? 0),
    due: Number(row.due ?? 0),
    status: statusRaw === 'inactive' ? 'inactive' : 'active',
    lastPurchaseDate: String(row.lastPurchaseDate ?? ''),
  };
}

export function listSupplierReportRows(rows: Record<string, unknown>[]): SupplierReportRow[] {
  return rows.map(normalizeRow);
}

export function filterSupplierRows(rows: SupplierReportRow[], filters: SupplierReportFilters): SupplierReportRow[] {
  let data = [...rows];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    data = data.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.contactPerson.toLowerCase().includes(q) ||
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

export function getSupplierInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function getSupplierAvatarClass(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function buildSupplierKpis(rows: SupplierReportRow[], trendSuffix: string): KpiCardItem[] {
  const totalPurchases = rows.reduce((s, r) => s + r.purchases, 0);
  const totalPayables = rows.reduce((s, r) => s + r.due, 0);
  const activeCount = rows.filter((r) => r.status === 'active').length;
  const overduePayablesCount = rows.filter((r) => r.due > 0).length;

  return [
    {
      key: 'purchases',
      label: 'Total Purchases',
      value: formatCurrency(totalPurchases),
      sub: `▲ 8.65% ${trendSuffix}`,
      iconify: 'flat-color-icons:shop',
    },
    {
      key: 'payables',
      label: 'Total Payables',
      value: formatCurrency(totalPayables),
      sub: `▼ 4.20% ${trendSuffix}`,
      alert: totalPayables > 0,
      iconify: 'flat-color-icons:currency-exchange',
    },
    {
      key: 'count',
      label: 'Total Suppliers',
      value: String(rows.length),
      sub: `— 0% ${trendSuffix}`,
      iconify: 'fluent-color:people-24',
    },
    {
      key: 'active',
      label: 'Active Suppliers',
      value: String(activeCount),
      sub: `▲ 100% ${trendSuffix}`,
      iconify: 'fluent-color:person-checkmark-24',
    },
    {
      key: 'overdue',
      label: 'Overdue Payables',
      value: String(overduePayablesCount),
      sub: overduePayablesCount > 0 ? `▲ 100% ${trendSuffix}` : `— 0% ${trendSuffix}`,
      alert: overduePayablesCount > 0,
      iconify: 'fluent-color:alert-badge-24',
    },
  ];
}

export function buildPurchasesBySupplier(rows: SupplierReportRow[]): SupplierBreakdownSlice[] {
  const total = rows.reduce((s, r) => s + r.purchases, 0);
  return rows
    .map((row) => ({
      key: row.name,
      label: row.name,
      amount: row.purchases,
      pct: total > 0 ? (row.purchases / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function buildPayablesBySupplier(rows: SupplierReportRow[]): SupplierBreakdownSlice[] {
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

export function buildPayablesStatusBreakdown(rows: SupplierReportRow[]): SupplierBreakdownSlice[] {
  const total = rows.length;
  const clear = rows.filter((r) => r.due <= 0).length;
  const outstanding = rows.filter((r) => r.due > 0).length;

  return [
    { key: 'clear', label: 'Paid / Clear', amount: clear, pct: total > 0 ? (clear / total) * 100 : 0 },
    { key: 'outstanding', label: 'Outstanding', amount: outstanding, pct: total > 0 ? (outstanding / total) * 100 : 0 },
  ];
}

export function buildRecentPurchaseActivity(
  purchaseRows: Record<string, unknown>[],
  supplierNames: string[],
  limit = 4,
): SupplierRecentActivityRow[] {
  const names = new Set(supplierNames);
  return purchaseRows
    .map((row, idx) => {
      const ref = String(row.ref ?? '');
      return {
        id: String(row.id ?? ref ?? idx),
        date: String(row.date ?? ''),
        ref,
        supplier: String(row.supplier ?? ''),
        items: DEMO_ITEMS_BY_REF[ref] ?? `${3 + (idx % 5)} Items`,
        total: Number(row.total ?? 0),
        status: String(row.paymentStatus ?? row.status ?? ''),
      };
    })
    .filter((row) => names.has(row.supplier))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

export function formatFilterSummary(filters: SupplierReportFilters): string {
  const parts: string[] = [];
  if (filters.dateStart || filters.dateEnd) {
    parts.push(`${filters.dateStart || '…'} – ${filters.dateEnd || '…'}`);
  }
  if (filters.status !== 'All') parts.push(filters.status);
  return parts.length ? parts.join(' · ') : 'All records';
}

export function formatReportingPeriod(filters: SupplierReportFilters): string {
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
