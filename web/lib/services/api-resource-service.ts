import { apiRequest } from '@/lib/services/api-client';
import {
  buildListQueryString,
  DEFAULT_LIST_PAGE_SIZE,
  LOOKUP_LIST_PAGE_SIZE,
  MAX_FULL_LIST_PAGES,
  parseApiPaginationMeta,
  type ApiListQuery,
  type ApiPaginationMeta,
} from '@/lib/services/api-pagination-types';
import {
  getApiListCache,
  hasApiListCache,
  setApiListCache,
  isApiListCacheFresh,
} from '@/lib/services/api-list-cache';

export function apiDocId(doc: { id?: string; _id?: string; legacyId?: string }): string {
  return String(doc.id ?? doc._id ?? doc.legacyId ?? '');
}

/** Strip client ids on POST — backend assigns unique legacyId */
export function sanitizeApiCreateBody(body: Record<string, unknown>): Record<string, unknown> {
  const next = { ...body };
  for (const key of ['legacyId', 'id', '_id', '_mongoId']) {
    delete next[key];
  }
  for (const key of ['sku', 'employeeCode', 'ticketNo', 'receiptNo', 'code']) {
    if (next[key] != null && String(next[key]).trim() === '') delete next[key];
  }
  return next;
}

function normalizeListPath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

export type ApiPageResult = {
  rows: Record<string, unknown>[];
  meta: ApiPaginationMeta;
};

/** Single-page list fetch — preferred for tables and route prefetch. */
export async function fetchResourcePage(
  path: string,
  query: ApiListQuery = {},
): Promise<ApiPageResult> {
  const base = normalizeListPath(path);
  const qs = buildListQueryString(query);
  const { data, meta } = await apiRequest<Record<string, unknown>[]>(`${base}?${qs}`);
  const rows = Array.isArray(data) ? data : [];
  const parsed = parseApiPaginationMeta(meta);
  setApiListCache(base, rows, query);
  return { rows, meta: parsed };
}

const LIST_PAGE_SIZE = LOOKUP_LIST_PAGE_SIZE;

/**
 * Fetch all pages — use only for small lookups, exports, or cross-module joins.
 * List pages should use fetchResourcePage instead.
 */
export async function fetchResourceList(
  path: string,
  options?: { maxPages?: number },
): Promise<Record<string, unknown>[]> {
  const base = normalizeListPath(path);
  const maxPages = options?.maxPages ?? MAX_FULL_LIST_PAGES;

  const first = await fetchResourcePage(path, { page: 1, limit: LIST_PAGE_SIZE });
  if (first.meta.totalPages <= 1) {
    return first.rows;
  }

  const all = [...first.rows];
  const totalPages = Math.min(first.meta.totalPages, maxPages);
  for (let page = 2; page <= totalPages; page += 1) {
    const next = await fetchResourcePage(path, { page, limit: LIST_PAGE_SIZE });
    all.push(...next.rows);
    if (next.rows.length === 0) break;
  }

  setApiListCache(base, all);
  return all;
}

/** Return cached rows when available (no network). */
export function readCachedResourceList(
  path: string,
  query?: ApiListQuery,
): Record<string, unknown>[] | null {
  return getApiListCache(normalizeListPath(path), query);
}

/** True once this list endpoint has completed at least one fetch. */
export function isCachedResourceList(path: string, query?: ApiListQuery): boolean {
  return hasApiListCache(normalizeListPath(path), query);
}

/** True if the cache exists and was fetched within the given TTL (default 10s). */
export function isCachedResourceListFresh(path: string, query?: ApiListQuery, ttlMs?: number): boolean {
  return isApiListCacheFresh(normalizeListPath(path), query, ttlMs);
}

export async function fetchResourceById(path: string, id: string): Promise<Record<string, unknown> | null> {
  try {
    const { data } = await apiRequest<Record<string, unknown>>(`${path}/${id}`);
    return data ?? null;
  } catch {
    return null;
  }
}

export async function createResource(
  path: string,
  body: Record<string, unknown>,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const { data } = await apiRequest<Record<string, unknown>>(path, {
      method: 'POST',
      body: JSON.stringify(sanitizeApiCreateBody(body)),
    });
    const id = apiDocId(data ?? {});
    if (!id) return { ok: false, error: 'Missing id from API response' };
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Create failed' };
  }
}

export async function updateResource(
  path: string,
  id: string,
  body: Record<string, unknown>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await apiRequest<Record<string, unknown>>(`${path}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Update failed' };
  }
}

export async function deleteResource(
  path: string,
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await apiRequest<null>(`${path}/${id}`, { method: 'DELETE' });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Delete failed' };
  }
}

export type DashboardSummary = {
  salesSummary: { count: number; total: number };
  purchaseSummary: { count: number; total: number };
  monthRevenue: number;
  monthSalesCount: number;
  pendingSales: number;
  openLeadsCount: number;
  openLeadsValue: number;
  customerDue: number;
  customerDueCount: number;
  supplierDue: number;
  supplierDueCount: number;
  pendingProduction: number;
  pendingProductionQty: number;
  productionCompleted: number;
  productionQty: number;
  pendingPurchase: number;
  lowStock: number;
  rmStockValue: number;
  sfStockValue: number;
  fgStockValue: number;
  totalInventoryValue: number;
};

export async function fetchDashboardSummary(): Promise<DashboardSummary | null> {
  try {
    const { data } = await apiRequest<DashboardSummary>('/dashboard/summary');
    return data ?? null;
  } catch {
    return null;
  }
}
