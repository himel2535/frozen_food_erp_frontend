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
  invalidateApiListCache,
} from '@/lib/services/api-list-cache';
import { moduleFromApiPath } from '@/lib/config/data-source';
import { notifyApiMutation } from '@/lib/services/api-sync-events';

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

function notifyMutationForPath(path: string) {
  const module = moduleFromApiPath(path);
  if (!module) return;
  notifyApiMutation([module]);
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
    invalidateApiListCache(path);
    if (!path.includes('/audit-logs')) {
      notifyMutationForPath(path);
    }
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
    invalidateApiListCache(path);
    notifyMutationForPath(path);
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
    invalidateApiListCache(path);
    notifyMutationForPath(path);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Delete failed' };
  }
}

export type DashboardSummary = {
  monthRevenue: number;
  monthSalesCount: number;
  pendingSales: number;
  openLeadsCount: number;
  openLeadsValue: number;
  customerDue: number;
  customerDueCount: number;
  pendingProduction: number;
  pendingProductionQty: number;
  salesSummary?: { count: number; total: number };
  purchaseSummary?: { count: number; total: number };
  supplierDue?: number;
  supplierDueCount?: number;
  productionCompleted?: number;
  productionQty?: number;
  pendingPurchase?: number;
  lowStock?: number;
  rmStockValue?: number;
  sfStockValue?: number;
  fgStockValue?: number;
  totalInventoryValue?: number;
};

export type DashboardSummaryScope = 'kpi' | 'extra' | 'full';

const DASHBOARD_GET_TTL_MS = 15_000;
const summaryCache = new Map<string, { data: DashboardSummary; at: number }>();
const summaryInflight = new Map<string, Promise<DashboardSummary | null>>();

export function peekDashboardSummary(scope: DashboardSummaryScope = 'kpi'): DashboardSummary | null {
  const hit = summaryCache.get(scope);
  if (!hit) return null;
  if (Date.now() - hit.at > DASHBOARD_GET_TTL_MS) {
    summaryCache.delete(scope);
    return null;
  }
  return hit.data;
}

export function invalidateDashboardSummaryCache() {
  summaryCache.clear();
  summaryInflight.clear();
}

export async function fetchDashboardSummary(
  scope: DashboardSummaryScope = 'kpi',
): Promise<DashboardSummary | null> {
  const cached = peekDashboardSummary(scope);
  if (cached) return cached;
  const pending = summaryInflight.get(scope);
  if (pending) return pending;

  const req = (async () => {
    try {
      const { data } = await apiRequest<DashboardSummary>(`/dashboard/summary?scope=${scope}`);
      if (data) summaryCache.set(scope, { data, at: Date.now() });
      return data ?? null;
    } catch {
      return null;
    } finally {
      summaryInflight.delete(scope);
    }
  })();
  summaryInflight.set(scope, req);
  return req;
}

export type DashboardTopProduct = {
  name: string;
  category: string;
  sold: number;
  revenue: number;
  imageUrl: string;
};

export async function fetchDashboardTopProducts(limit = 5): Promise<DashboardTopProduct[] | null> {
  const cached = peekDashboardTopProducts(limit);
  if (cached) return cached;
  if (topProductsInflight) return topProductsInflight;

  topProductsInflight = (async () => {
    try {
      const { data } = await apiRequest<DashboardTopProduct[]>(`/dashboard/top-products?limit=${limit}`);
      const rows = Array.isArray(data) ? data : null;
      if (rows) topProductsCache = { data: rows, limit, at: Date.now() };
      return rows;
    } catch {
      return null;
    } finally {
      topProductsInflight = null;
    }
  })();
  return topProductsInflight;
}

let topProductsCache: { data: DashboardTopProduct[]; limit: number; at: number } | null = null;
let topProductsInflight: Promise<DashboardTopProduct[] | null> | null = null;

export function peekDashboardTopProducts(limit = 5): DashboardTopProduct[] | null {
  if (!topProductsCache || topProductsCache.limit !== limit) return null;
  if (Date.now() - topProductsCache.at > DASHBOARD_GET_TTL_MS) {
    topProductsCache = null;
    return null;
  }
  return topProductsCache.data;
}

export function invalidateDashboardTopProductsCache() {
  topProductsCache = null;
  topProductsInflight = null;
}

export type DashboardBusinessAlertItem = {
  id: string;
  category: string;
  priority: 'critical' | 'warning' | 'info';
  title: string;
  subtitle?: string;
  lines: { label: string; value: string }[];
  href: string;
  actions: { label: string; href: string; variant?: 'primary' | 'outline' }[];
  sortKey: number;
  overdueDays?: number;
};

export type DashboardBusinessAlertSummary = {
  category: string;
  count: number;
  priority: 'critical' | 'warning' | 'info';
};

export type DashboardBusinessAlertsPayload = {
  summaries: DashboardBusinessAlertSummary[];
  items: DashboardBusinessAlertItem[];
};

const ALERTS_CACHE_TTL_MS = 15_000;
let alertsCache: { data: DashboardBusinessAlertsPayload; at: number } | null = null;
let alertsInflight: Promise<DashboardBusinessAlertsPayload | null> | null = null;

export function peekDashboardBusinessAlerts(): DashboardBusinessAlertsPayload | null {
  if (!alertsCache) return null;
  if (Date.now() - alertsCache.at > ALERTS_CACHE_TTL_MS) {
    alertsCache = null;
    return null;
  }
  return alertsCache.data;
}

export function invalidateDashboardBusinessAlertsCache() {
  alertsCache = null;
  alertsInflight = null;
}

export async function fetchDashboardBusinessAlerts(): Promise<DashboardBusinessAlertsPayload | null> {
  const cached = peekDashboardBusinessAlerts();
  if (cached) return cached;

  if (alertsInflight) return alertsInflight;

  alertsInflight = (async () => {
    try {
      const { data } = await apiRequest<DashboardBusinessAlertsPayload>('/dashboard/business-alerts');
      if (!data || !Array.isArray(data.summaries) || !Array.isArray(data.items)) return null;
      alertsCache = { data, at: Date.now() };
      return data;
    } catch {
      return null;
    } finally {
      alertsInflight = null;
    }
  })();

  return alertsInflight;
}
