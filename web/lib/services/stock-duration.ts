import type { AppState } from '@/lib/state/types';
import {
  computeTotalStock,
  listFinishedGoods,
  listInventory,
  listRawMaterials,
  listSemiFinishedProducts,
  resolveProductLowStockThreshold,
} from '@/lib/services/inventory-service';

const MS_PER_DAY = 86_400_000;

export type LowStockItemType = 'product' | 'rawMaterial' | 'semiFinished' | 'finishedGood';

export type StockDurationMetrics = {
  expectedDays: number | null;
  elapsedDays: number;
  remainingDays: number | null;
  remainingRatio: number | null;
  overdue: boolean;
};

export type LowStockAlertRow = {
  id: string;
  legacyId: string;
  name: string;
  sku: string;
  category: string;
  imageUrl: string;
  unit: string;
  qty: number;
  min: number;
  itemType: LowStockItemType;
  itemTypeLabel: string;
  href: string;
  stockDurationDays: number;
  stockDurationStartedAt: unknown;
  createdAt: unknown;
  expectedDays: number | null;
  elapsedDays: number;
  remainingDays: number | null;
  remainingRatio: number | null;
  overdue: boolean;
};

export type LowStockAlertCounts = {
  total: number;
  products: number;
  rawMaterials: number;
  overdue: number;
};

const ITEM_HREF: Record<LowStockItemType, string> = {
  product: '/inventory/products',
  rawMaterial: '/inventory/raw-materials',
  semiFinished: '/inventory/semi-finished-products',
  finishedGood: '/inventory/finished-goods',
};

const ITEM_LABEL: Record<LowStockItemType, string> = {
  product: 'Product',
  rawMaterial: 'Raw Material',
  semiFinished: 'Semi-Finished',
  finishedGood: 'Finished Good',
};

function toTime(value: unknown): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? ms : NaN;
  }
  return NaN;
}

export function isQtyLowStock(qty: number, min: number): boolean {
  return qty > 0 && min > 0 && qty <= min;
}

export function stockDurationMetrics(
  row: {
    stockDurationDays?: unknown;
    stockDurationStartedAt?: unknown;
    createdAt?: unknown;
  },
  now = Date.now(),
): StockDurationMetrics {
  const expected = Math.max(0, Math.floor(Number(row.stockDurationDays ?? 0) || 0));
  const startMs = toTime(row.stockDurationStartedAt ?? row.createdAt);
  const elapsedDays = Number.isFinite(startMs) ? Math.max(0, Math.floor((now - startMs) / MS_PER_DAY)) : 0;
  if (expected <= 0) {
    return { expectedDays: null, elapsedDays, remainingDays: null, remainingRatio: null, overdue: false };
  }
  const remainingDays = expected - elapsedDays;
  return {
    expectedDays: expected,
    elapsedDays,
    remainingDays,
    remainingRatio: remainingDays / expected,
    overdue: elapsedDays > expected,
  };
}

type DurationSortRow = {
  remainingRatio: number | null;
  name?: string;
};

/** Overdue first; then more time-left % first so 10d/9 elapsed sits after 100d/10 elapsed. */
export function compareByRemainingRatio(a: DurationSortRow, b: DurationSortRow): number {
  const ar = a.remainingRatio;
  const br = b.remainingRatio;
  if (ar == null && br == null) return String(a.name ?? '').localeCompare(String(b.name ?? ''));
  if (ar == null) return 1;
  if (br == null) return -1;
  const aOver = ar < 0;
  const bOver = br < 0;
  if (aOver !== bOver) return aOver ? -1 : 1;
  if (ar !== br) return aOver ? ar - br : br - ar;
  return String(a.name ?? '').localeCompare(String(b.name ?? ''));
}

function toAlertRow(
  item: Record<string, unknown>,
  itemType: LowStockItemType,
  qty: number,
  min: number,
): LowStockAlertRow {
  const duration = stockDurationMetrics(item);
  return {
    id: String(item.id ?? item.legacyId ?? ''),
    legacyId: String(item.legacyId ?? ''),
    name: String(item.name ?? ''),
    sku: String(item.sku ?? ''),
    category: String(item.category ?? ''),
    imageUrl: String(item.imageUrl ?? ''),
    unit: String(item.uom ?? item.unit ?? 'pcs'),
    qty,
    min,
    itemType,
    itemTypeLabel: ITEM_LABEL[itemType],
    href: ITEM_HREF[itemType],
    stockDurationDays: Number(item.stockDurationDays ?? 0),
    stockDurationStartedAt: item.stockDurationStartedAt ?? null,
    createdAt: item.createdAt ?? null,
    ...duration,
  };
}

export function collectLocalLowStockAlertRows(state: AppState): LowStockAlertRow[] {
  const rows: LowStockAlertRow[] = [];

  listInventory(state, { excludeRaw: false }).forEach((item) => {
    if (item.discontinued) return;
    const qty = computeTotalStock(item);
    const min = resolveProductLowStockThreshold(item);
    if (!isQtyLowStock(qty, min)) return;
    rows.push(toAlertRow(item, 'product', qty, min));
  });

  listRawMaterials(state).forEach((item) => {
    const qty = Number(item.quantity ?? 0);
    const min = Number(item.threshold ?? 0);
    if (!isQtyLowStock(qty, min)) return;
    rows.push(toAlertRow(item, 'rawMaterial', qty, min));
  });

  listSemiFinishedProducts(state).forEach((item) => {
    const qty = Number(item.quantity ?? 0);
    const min = Number(item.minStock ?? 0);
    if (!isQtyLowStock(qty, min)) return;
    rows.push(toAlertRow(item, 'semiFinished', qty, min));
  });

  listFinishedGoods(state).forEach((item) => {
    const qty = Number(item.quantity ?? 0);
    const min = Number(item.minStock ?? 0);
    if (!isQtyLowStock(qty, min)) return;
    rows.push(toAlertRow(item, 'finishedGood', qty, min));
  });

  return rows.sort(compareByRemainingRatio);
}

export function countLowStockAlertRows(rows: LowStockAlertRow[]): LowStockAlertCounts {
  return {
    total: rows.length,
    products: rows.filter((r) => r.itemType === 'product').length,
    rawMaterials: rows.filter((r) => r.itemType === 'rawMaterial').length,
    overdue: rows.filter((r) => r.overdue).length,
  };
}

export function filterLowStockAlertRows(
  rows: LowStockAlertRow[],
  search: string,
  itemType: LowStockItemType | 'all',
): LowStockAlertRow[] {
  const q = search.trim().toLowerCase();
  return rows.filter((row) => {
    if (itemType !== 'all' && row.itemType !== itemType) return false;
    if (!q) return true;
    return `${row.name} ${row.sku} ${row.legacyId} ${row.category}`.toLowerCase().includes(q);
  });
}
