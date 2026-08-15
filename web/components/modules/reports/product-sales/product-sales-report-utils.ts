import { formatCurrency } from '@/lib/services/domain-service';
import { formatAppDate } from '@/lib/i18n/locale-format';
import type { KpiCardItem } from '@/components/shared/KpiCards';

export type ProductSaleLine = {
  id: string;
  date: string;
  invoiceRef: string;
  productId: string;
  productName: string;
  sku: string;
  qty: number;
  unitPrice: number;
  revenue: number;
  customer: string;
};

export type ProductSalesRow = {
  key: string;
  productId: string;
  productName: string;
  sku: string;
  qty: number;
  revenue: number;
  avgPrice: number;
  invoiceCount: number;
  sharePct: number;
};

export type ProductSalesFilters = {
  search: string;
  dateStart: string;
  dateEnd: string;
  productKey: string;
};

export type ProductSalesOption = {
  key: string;
  productName: string;
  sku: string;
};

export type ProductSalesSlice = {
  key: string;
  label: string;
  amount: number;
  pct: number;
};

export const PRODUCT_SLICE_COLORS: Record<string, { from: string; to: string }> = {};

const FALLBACK_SLICE_COLORS = [
  { from: '#3b82f6', to: '#2563eb' },
  { from: '#10b981', to: '#059669' },
  { from: '#f97316', to: '#ea580c' },
  { from: '#8b5cf6', to: '#7c3aed' },
  { from: '#06b6d4', to: '#0891b2' },
  { from: '#f43f5e', to: '#e11d48' },
];

export function getProductSliceColors(
  map: Record<string, { from: string; to: string }>,
  key: string,
  index: number,
) {
  return map[key] ?? FALLBACK_SLICE_COLORS[index % FALLBACK_SLICE_COLORS.length];
}

function normalizeLine(row: Record<string, unknown>): ProductSaleLine {
  const qty = Number(row.qty ?? row.quantity ?? 0);
  const unitPrice = Number(row.unitPrice ?? row.price ?? row.rate ?? 0);
  const revenue = Number(row.revenue ?? row.total ?? row.amount ?? qty * unitPrice);
  const productName = String(row.productName ?? row.name ?? row.description ?? '').trim() || 'Unnamed product';
  const sku = String(row.sku ?? '').trim();
  const productId = String(row.productId ?? sku ?? productName);
  return {
    id: String(row.id ?? `${row.invoiceRef ?? 'inv'}-${productId}`),
    date: String(row.date ?? '').slice(0, 10),
    invoiceRef: String(row.invoiceRef ?? row.ref ?? ''),
    productId,
    productName,
    sku,
    qty,
    unitPrice,
    revenue,
    customer: String(row.customer ?? ''),
  };
}

export function productSaleKey(line: Pick<ProductSaleLine, 'sku' | 'productId' | 'productName'>): string {
  return (line.sku || line.productId || line.productName).toLowerCase();
}

export function listProductSaleLines(rows: Record<string, unknown>[]): ProductSaleLine[] {
  return rows.map(normalizeLine).filter((line) => line.qty !== 0 || line.revenue !== 0);
}

export function invoicesToProductSaleLines(invoices: Record<string, unknown>[]): ProductSaleLine[] {
  const rows: ProductSaleLine[] = [];
  invoices.forEach((invoice) => {
    const status = String(invoice.status ?? '').toLowerCase();
    if (status === 'cancelled' || status === 'draft') return;
    const items = Array.isArray(invoice.items) ? invoice.items : [];
    items.forEach((raw, index) => {
      if (!raw || typeof raw !== 'object') return;
      const item = raw as Record<string, unknown>;
      rows.push(normalizeLine({
        id: `${invoice.id ?? invoice.legacyId}-${index}`,
        date: String(invoice.issueDate ?? invoice.date ?? ''),
        invoiceRef: invoice.id ?? invoice.legacyId,
        productId: item.productId,
        productName: item.name ?? item.description ?? item.productName,
        sku: item.sku,
        qty: item.qty ?? item.quantity,
        unitPrice: item.price ?? item.rate,
        revenue: item.total ?? item.amount,
        customer: invoice.customerName ?? invoice.customer,
      }));
    });
  });
  return rows.filter((line) => line.qty !== 0 || line.revenue !== 0);
}

export function filterProductSaleLines(
  rows: ProductSaleLine[],
  filters: ProductSalesFilters,
): ProductSaleLine[] {
  let data = [...rows];
  if (filters.productKey) {
    data = data.filter((row) => productSaleKey(row) === filters.productKey);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    data = data.filter((row) =>
      row.productName.toLowerCase().includes(q)
      || row.sku.toLowerCase().includes(q)
      || row.invoiceRef.toLowerCase().includes(q)
      || row.customer.toLowerCase().includes(q),
    );
  }
  if (filters.dateStart) data = data.filter((row) => row.date >= filters.dateStart);
  if (filters.dateEnd) data = data.filter((row) => row.date <= filters.dateEnd);
  return data;
}

export function uniqueProductOptions(lines: ProductSaleLine[]): ProductSalesOption[] {
  const map = new Map<string, ProductSalesOption>();
  lines.forEach((line) => {
    const key = productSaleKey(line);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { key, productName: line.productName, sku: line.sku });
      return;
    }
    if (!existing.sku && line.sku) existing.sku = line.sku;
  });
  return [...map.values()].sort((a, b) => a.productName.localeCompare(b.productName));
}

export function aggregateProductSales(lines: ProductSaleLine[]): ProductSalesRow[] {
  const map = new Map<string, {
    productId: string;
    productName: string;
    sku: string;
    qty: number;
    revenue: number;
    invoices: Set<string>;
  }>();

  lines.forEach((line) => {
    const key = productSaleKey(line);
    const existing = map.get(key) ?? {
      productId: line.productId,
      productName: line.productName,
      sku: line.sku,
      qty: 0,
      revenue: 0,
      invoices: new Set<string>(),
    };
    existing.qty += line.qty;
    existing.revenue += line.revenue;
    if (line.invoiceRef) existing.invoices.add(line.invoiceRef);
    if (!existing.sku && line.sku) existing.sku = line.sku;
    map.set(key, existing);
  });

  const totalRevenue = [...map.values()].reduce((sum, row) => sum + row.revenue, 0);

  return [...map.entries()]
    .map(([key, row]) => ({
      key,
      productId: row.productId,
      productName: row.productName,
      sku: row.sku,
      qty: row.qty,
      revenue: row.revenue,
      avgPrice: row.qty > 0 ? row.revenue / row.qty : row.revenue,
      invoiceCount: row.invoices.size,
      sharePct: totalRevenue > 0 ? (row.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue || b.qty - a.qty);
}

export function buildProductSalesKpis(rows: ProductSalesRow[]): KpiCardItem[] {
  const revenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  const qty = rows.reduce((sum, row) => sum + row.qty, 0);
  const avgPrice = qty > 0 ? revenue / qty : 0;
  const topShare = rows[0]?.sharePct ?? 0;

  return [
    {
      key: 'revenue',
      label: 'Total Revenue',
      value: formatCurrency(revenue),
      iconify: 'flat-color-icons:line-chart',
    },
    {
      key: 'products',
      label: 'Products Sold',
      value: String(rows.length),
      iconify: 'fluent-color:apps-list-24',
    },
    {
      key: 'qty',
      label: 'Qty Sold',
      value: String(qty),
      iconify: 'fluent-color:apps-24',
    },
    {
      key: 'avg',
      label: 'Avg Selling Price',
      value: formatCurrency(avgPrice),
      iconify: 'flat-color-icons:currency-exchange',
    },
    {
      key: 'topShare',
      label: 'Top Product Share',
      value: `${topShare.toFixed(1)}%`,
      sub: rows[0]?.productName,
      iconify: 'fluent-color:data-pie-24',
    },
  ];
}

export function buildSingleProductKpis(lines: ProductSaleLine[]): KpiCardItem[] {
  const revenue = lines.reduce((sum, line) => sum + line.revenue, 0);
  const qty = lines.reduce((sum, line) => sum + line.qty, 0);
  const invoices = new Set(lines.map((line) => line.invoiceRef).filter(Boolean));
  const customers = new Set(lines.map((line) => line.customer.trim()).filter(Boolean));
  const avgPrice = qty > 0 ? revenue / qty : 0;

  return [
    {
      key: 'revenue',
      label: 'Total Revenue',
      value: formatCurrency(revenue),
      iconify: 'flat-color-icons:line-chart',
    },
    {
      key: 'qty',
      label: 'Qty Sold',
      value: String(qty),
      iconify: 'fluent-color:apps-24',
    },
    {
      key: 'avg',
      label: 'Avg Selling Price',
      value: formatCurrency(avgPrice),
      iconify: 'flat-color-icons:currency-exchange',
    },
    {
      key: 'invoices',
      label: 'Invoices',
      value: String(invoices.size),
      iconify: 'fluent-color:receipt-24',
    },
    {
      key: 'customers',
      label: 'Customers',
      value: String(customers.size),
      iconify: 'fluent-color:people-24',
    },
  ];
}

export function buildCustomerShareSlices(lines: ProductSaleLine[], limit = 6): ProductSalesSlice[] {
  const map = new Map<string, number>();
  lines.forEach((line) => {
    const name = line.customer.trim() || 'Unknown';
    map.set(name, (map.get(name) ?? 0) + line.revenue);
  });
  const ranked = [...map.entries()].sort((a, b) => b[1] - a[1]);
  const total = ranked.reduce((sum, [, amount]) => sum + amount, 0);
  const top = ranked.slice(0, limit);
  const rest = ranked.slice(limit).reduce((sum, [, amount]) => sum + amount, 0);
  const slices = top.map(([label, amount]) => ({
    key: label.toLowerCase(),
    label,
    amount,
    pct: total > 0 ? (amount / total) * 100 : 0,
  }));
  if (rest > 0) {
    slices.push({
      key: 'other',
      label: 'Other',
      amount: rest,
      pct: total > 0 ? (rest / total) * 100 : 0,
    });
  }
  return slices;
}

export function buildProductCustomerRows(lines: ProductSaleLine[]): ProductSalesRow[] {
  const map = new Map<string, { name: string; qty: number; revenue: number; invoices: Set<string> }>();
  lines.forEach((line) => {
    const name = line.customer.trim() || 'Unknown';
    const key = name.toLowerCase();
    const existing = map.get(key) ?? { name, qty: 0, revenue: 0, invoices: new Set<string>() };
    existing.qty += line.qty;
    existing.revenue += line.revenue;
    if (line.invoiceRef) existing.invoices.add(line.invoiceRef);
    map.set(key, existing);
  });
  const totalRevenue = [...map.values()].reduce((sum, row) => sum + row.revenue, 0);
  return [...map.entries()]
    .map(([key, row]) => ({
      key,
      productId: key,
      productName: row.name,
      sku: '',
      qty: row.qty,
      revenue: row.revenue,
      avgPrice: row.qty > 0 ? row.revenue / row.qty : row.revenue,
      invoiceCount: row.invoices.size,
      sharePct: totalRevenue > 0 ? (row.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue || b.qty - a.qty);
}

export function formatProductSaleDate(date: string): string {
  if (!date) return '—';
  const d = new Date(`${date}T00:00:00`);
  return formatAppDate(d, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function buildProductShareSlices(rows: ProductSalesRow[], limit = 6): ProductSalesSlice[] {
  const total = rows.reduce((sum, row) => sum + row.revenue, 0);
  const top = rows.slice(0, limit);
  const restRevenue = rows.slice(limit).reduce((sum, row) => sum + row.revenue, 0);
  const slices = top.map((row) => ({
    key: row.key,
    label: row.productName,
    amount: row.revenue,
    pct: total > 0 ? (row.revenue / total) * 100 : 0,
  }));
  if (restRevenue > 0) {
    slices.push({
      key: 'other',
      label: 'Other',
      amount: restRevenue,
      pct: total > 0 ? (restRevenue / total) * 100 : 0,
    });
  }
  return slices;
}

export function formatFilterSummary(filters: ProductSalesFilters, productName?: string): string {
  const parts: string[] = [];
  if (productName) parts.push(productName);
  if (filters.dateStart || filters.dateEnd) {
    parts.push(`${filters.dateStart || '…'} – ${filters.dateEnd || '…'}`);
  }
  if (filters.search) parts.push(filters.search);
  return parts.length ? parts.join(' · ') : 'All records';
}
