import { formatCurrency } from '@/lib/services/domain-service';
import { formatAppDate } from '@/lib/i18n/locale-format';
import type { KpiCardItem } from '@/components/shared/KpiCards';

export type InventoryReportRow = {
  id: string;
  sku: string;
  name: string;
  category: string;
  warehouse: string;
  qty: number;
  cost: number;
  reorderLevel: number;
  image: string;
  value: number;
  status: 'In Stock' | 'Low Stock';
};

export type InventoryReportFilters = {
  search: string;
  dateStart: string;
  dateEnd: string;
  category: string;
  warehouse: string;
};

export type InventoryBreakdownSlice = {
  key: string;
  label: string;
  amount: number;
  pct: number;
};

export type InventoryStockMovement = {
  stockIn: number;
  stockOut: number;
  adjustments: number;
  netChange: number;
};

const STOCK_MOVEMENT_DEMO: InventoryStockMovement = {
  stockIn: 28500,
  stockOut: 18950,
  adjustments: 455,
  netChange: 9095,
};

function rowStatus(qty: number, reorderLevel: number): 'In Stock' | 'Low Stock' {
  return qty <= reorderLevel ? 'Low Stock' : 'In Stock';
}

function normalizeRow(row: Record<string, unknown>): InventoryReportRow {
  const qty = Number(row.qty ?? 0);
  const cost = Number(row.cost ?? 0);
  const reorderLevel = Number(row.reorderLevel ?? 50);
  return {
    id: String(row.id ?? row.sku ?? ''),
    sku: String(row.sku ?? ''),
    name: String(row.name ?? ''),
    category: String(row.category ?? ''),
    warehouse: String(row.warehouse ?? ''),
    qty,
    cost,
    reorderLevel,
    image: String(row.image ?? ''),
    value: qty * cost,
    status: rowStatus(qty, reorderLevel),
  };
}

export function listInventoryReportRows(rows: Record<string, unknown>[]): InventoryReportRow[] {
  return rows.map(normalizeRow);
}

export function filterInventoryRows(rows: InventoryReportRow[], filters: InventoryReportFilters): InventoryReportRow[] {
  let data = [...rows];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    data = data.filter(
      (row) =>
        row.sku.toLowerCase().includes(q) ||
        row.name.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q),
    );
  }
  if (filters.category !== 'All') {
    data = data.filter((row) => row.category === filters.category);
  }
  if (filters.warehouse !== 'All') {
    data = data.filter((row) => row.warehouse === filters.warehouse);
  }

  return data;
}

export function uniqueCategories(rows: InventoryReportRow[]): string[] {
  return [...new Set(rows.map((r) => r.category))].sort();
}

export function uniqueWarehouses(rows: InventoryReportRow[]): string[] {
  return [...new Set(rows.map((r) => r.warehouse))].sort();
}

function trendSub(current: number, previous: number, suffix: string): string {
  if (previous <= 0 && current <= 0) return `— ${suffix}`;
  if (previous <= 0) return `▲ 100% ${suffix}`;
  const pct = ((current - previous) / previous) * 100;
  const arrow = pct >= 0 ? '▲' : '▼';
  return `${arrow} ${Math.abs(pct).toFixed(2)}% ${suffix}`;
}

export function buildInventoryKpis(rows: InventoryReportRow[], trendSuffix: string): KpiCardItem[] {
  const totalValue = rows.reduce((s, r) => s + r.value, 0);
  const totalQty = rows.reduce((s, r) => s + r.qty, 0);
  const lowStock = rows.filter((r) => r.status === 'Low Stock').length;

  return [
    {
      key: 'value',
      label: 'Total Inventory Value',
      value: formatCurrency(totalValue),
      sub: trendSub(totalValue, totalValue * 0.92, trendSuffix),
      iconify: 'flat-color-icons:line-chart',
    },
    {
      key: 'skus',
      label: 'Total SKUs',
      value: String(rows.length),
      sub: `▲ 2 New this month`,
      iconify: 'flat-color-icons:document',
    },
    {
      key: 'qty',
      label: 'Total Quantity',
      value: totalQty.toLocaleString('en-US'),
      sub: trendSub(totalQty, totalQty * 0.89, trendSuffix),
      iconify: 'fluent-color:box-24',
    },
    {
      key: 'low',
      label: 'Low Stock Items',
      value: String(lowStock),
      sub: lowStock > 0 ? 'Needs attention' : undefined,
      alert: lowStock > 0,
      iconify: 'fluent-color:alert-badge-24',
    },
  ];
}

export function buildCategoryBreakdown(rows: InventoryReportRow[]): InventoryBreakdownSlice[] {
  const total = rows.reduce((s, r) => s + r.value, 0);
  const map = new Map<string, number>();

  rows.forEach((row) => {
    map.set(row.category, (map.get(row.category) ?? 0) + row.value);
  });

  return [...map.entries()]
    .map(([key, amount]) => ({
      key,
      label: key,
      amount,
      pct: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function buildWarehouseBreakdown(rows: InventoryReportRow[]): InventoryBreakdownSlice[] {
  const total = rows.reduce((s, r) => s + r.value, 0);
  const map = new Map<string, number>();

  rows.forEach((row) => {
    map.set(row.warehouse, (map.get(row.warehouse) ?? 0) + row.value);
  });

  return [...map.entries()]
    .map(([key, amount]) => ({
      key,
      label: key,
      amount,
      pct: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function buildLowStockRows(rows: InventoryReportRow[]): InventoryReportRow[] {
  return rows.filter((r) => r.status === 'Low Stock');
}

export function getStockMovement(): InventoryStockMovement {
  return STOCK_MOVEMENT_DEMO;
}

export function formatFilterSummary(filters: InventoryReportFilters): string {
  const parts: string[] = [];
  if (filters.dateStart || filters.dateEnd) {
    parts.push(`${filters.dateStart || '…'} – ${filters.dateEnd || '…'}`);
  }
  if (filters.category !== 'All') parts.push(filters.category);
  if (filters.warehouse !== 'All') parts.push(filters.warehouse);
  return parts.length ? parts.join(' · ') : 'All records';
}

export function formatReportingPeriod(filters: InventoryReportFilters): string {
  if (filters.dateStart && filters.dateEnd) {
    const fmt = (d: string) => {
      const date = new Date(`${d}T00:00:00`);
      return formatAppDate(date);
    };
    return `${fmt(filters.dateStart)} - ${fmt(filters.dateEnd)}`;
  }
  return '01/06/2026 - 12/06/2026';
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
