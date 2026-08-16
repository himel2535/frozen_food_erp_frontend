import { apiRequest } from '@/lib/services/api-client';
import { parseApiPaginationMeta, type ApiPaginationMeta } from '@/lib/services/api-pagination-types';
import type {
  LowStockAlertCounts,
  LowStockAlertRow,
  LowStockItemType,
} from '@/lib/services/stock-duration';

function parseCounts(meta?: Record<string, unknown>): LowStockAlertCounts {
  const raw = (meta?.counts ?? {}) as Record<string, unknown>;
  return {
    total: Number(raw.total ?? meta?.total ?? 0),
    products: Number(raw.products ?? 0),
    rawMaterials: Number(raw.rawMaterials ?? 0),
    overdue: Number(raw.overdue ?? 0),
  };
}

export async function fetchLowStockAlertsPage(query: {
  page?: number;
  limit?: number;
  search?: string;
  itemType?: LowStockItemType | 'all';
}): Promise<{ rows: LowStockAlertRow[]; meta: ApiPaginationMeta; counts: LowStockAlertCounts }> {
  const params = new URLSearchParams();
  params.set('page', String(query.page ?? 1));
  params.set('limit', String(query.limit ?? 10));
  if (query.search?.trim()) params.set('search', query.search.trim());
  if (query.itemType && query.itemType !== 'all') params.set('itemType', query.itemType);

  const { data, meta } = await apiRequest<LowStockAlertRow[]>(`/inventory/low-stock-alerts?${params.toString()}`);
  const rows = Array.isArray(data) ? data : [];
  return {
    rows,
    meta: parseApiPaginationMeta(meta),
    counts: parseCounts(meta),
  };
}
