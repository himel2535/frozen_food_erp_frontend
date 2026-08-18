/** In-memory list cache — keyed by path + pagination query for fast route revisits. */

import {
  buildListQueryString,
  LOOKUP_LIST_PAGE_SIZE,
  type ApiListQuery,
  type ApiPaginationMeta,
} from '@/lib/services/api-pagination-types';

type CacheEntry = {
  docs: Record<string, unknown>[];
  meta?: ApiPaginationMeta;
  fetchedAt: number;
};

export type ListCacheHit = {
  docs: Record<string, unknown>[];
  meta?: ApiPaginationMeta;
  query: ApiListQuery;
};

const cache = new Map<string, CacheEntry>();

export const LOOKUP_CACHE_QUERY: ApiListQuery = { page: 1, limit: LOOKUP_LIST_PAGE_SIZE };

function normalizePath(path: string): string {
  const base = path.startsWith('/') ? path : `/${path}`;
  return base.split('?')[0];
}

function cacheKey(path: string, query?: ApiListQuery): string {
  const base = normalizePath(path);
  if (!query) return `${base}?page=1&limit=25`;
  return `${base}?${buildListQueryString(query)}`;
}

function lookupCacheKey(path: string): string {
  return `${normalizePath(path)}?lookup=1`;
}

function filterSignature(query: ApiListQuery): string {
  const { page: _p, limit: _l, ...filters } = query;
  return JSON.stringify(filters);
}

function docId(doc: Record<string, unknown>): string {
  return String(doc.id ?? doc._id ?? doc.legacyId ?? '');
}

function isFresh(entry: CacheEntry, ttlMs: number): boolean {
  return Date.now() - entry.fetchedAt < ttlMs;
}

export function getApiListCache(path: string, query?: ApiListQuery): Record<string, unknown>[] | null {
  const entry = cache.get(cacheKey(path, query));
  return entry ? entry.docs : null;
}

export function getApiListCacheMeta(path: string, query?: ApiListQuery) {
  const entry = cache.get(cacheKey(path, query));
  return entry?.meta ?? null;
}

export function hasApiListCache(path: string, query?: ApiListQuery): boolean {
  return cache.has(cacheKey(path, query));
}

export function isApiListCacheFresh(path: string, query?: ApiListQuery, ttlMs: number = 10000): boolean {
  const entry = cache.get(cacheKey(path, query));
  if (!entry) return false;
  return isFresh(entry, ttlMs);
}

export function setApiListCache(
  path: string,
  docs: Record<string, unknown>[],
  query?: ApiListQuery,
  meta?: ApiPaginationMeta,
) {
  cache.set(cacheKey(path, query), { docs, meta, fetchedAt: Date.now() });
}

export function getLookupCache(path: string): Record<string, unknown>[] | null {
  const entry = cache.get(lookupCacheKey(path));
  return entry ? entry.docs : null;
}

export function getLookupCacheMeta(path: string): ApiPaginationMeta | null {
  const entry = cache.get(lookupCacheKey(path));
  return entry?.meta ?? null;
}

export function isLookupCacheFresh(path: string, ttlMs: number): boolean {
  const entry = cache.get(lookupCacheKey(path));
  if (!entry) return false;
  return isFresh(entry, ttlMs);
}

export function setLookupCache(
  path: string,
  docs: Record<string, unknown>[],
  meta?: ApiPaginationMeta,
) {
  cache.set(lookupCacheKey(path), { docs, meta, fetchedAt: Date.now() });
}

/** Exact cache key match. */
export function findFreshListCache(
  path: string,
  query: ApiListQuery,
  ttlMs: number,
): ListCacheHit | null {
  const key = cacheKey(path, query);
  const entry = cache.get(key);
  if (!entry || !isFresh(entry, ttlMs)) return null;
  return { docs: entry.docs, meta: entry.meta, query };
}

/**
 * Page-1 cache with same filters and limit >= requested — slices rows when needed.
 */
export function findCompatibleListCache(
  path: string,
  query: ApiListQuery,
  ttlMs: number,
): ListCacheHit | null {
  const exact = findFreshListCache(path, query, ttlMs);
  if (exact) return exact;

  const page = query.page ?? 1;
  if (page !== 1) return null;

  const requestedLimit = query.limit ?? 25;
  const sig = filterSignature(query);
  const base = normalizePath(path);

  for (const [key, entry] of cache.entries()) {
    if (!key.startsWith(`${base}?`) || key.endsWith('?lookup=1')) continue;
    if (!isFresh(entry, ttlMs)) continue;

    const qs = key.slice(base.length + 1);
    const params = new URLSearchParams(qs);
    const cachedPage = Number(params.get('page') ?? 1);
    const cachedLimit = Number(params.get('limit') ?? 25);
    if (cachedPage !== 1 || cachedLimit < requestedLimit) continue;

    const cachedQuery: ApiListQuery = {
      page: 1,
      limit: cachedLimit,
      search: params.get('search') ?? undefined,
      status: params.get('status') ?? undefined,
    };
    if (filterSignature(cachedQuery) !== sig) continue;

    const docs = entry.docs.slice(0, requestedLimit);
    const meta = entry.meta
      ? { ...entry.meta, page: 1, limit: requestedLimit }
      : undefined;
    return { docs, meta, query };
  }

  return null;
}

export function prependToListCache(
  path: string,
  query: ApiListQuery,
  row: Record<string, unknown>,
  meta?: ApiPaginationMeta,
) {
  const key = cacheKey(path, query);
  const entry = cache.get(key);
  const id = docId(row);
  const docs = entry ? entry.docs.filter((d) => docId(d) !== id) : [];
  docs.unshift(row);
  const limit = query.limit ?? 25;
  const trimmed = docs.slice(0, limit);
  const nextMeta = meta ?? (entry?.meta
    ? { ...entry.meta, total: (entry.meta.total ?? trimmed.length) + (entry.docs.some((d) => docId(d) === id) ? 0 : 1) }
    : { total: trimmed.length, page: 1, limit, totalPages: 1 });
  cache.set(key, { docs: trimmed, meta: nextMeta, fetchedAt: Date.now() });
}

export function patchListCacheRow(
  path: string,
  query: ApiListQuery,
  id: string,
  row: Record<string, unknown>,
) {
  const key = cacheKey(path, query);
  const entry = cache.get(key);
  if (!entry) return;
  const docs = entry.docs.map((d) => (docId(d) === id ? { ...d, ...row, id } : d));
  cache.set(key, { ...entry, docs, fetchedAt: Date.now() });

  const lookupKey = lookupCacheKey(path);
  const lookupEntry = cache.get(lookupKey);
  if (lookupEntry) {
    const lookupDocs = lookupEntry.docs.map((d) => (docId(d) === id ? { ...d, ...row, id } : d));
    cache.set(lookupKey, { ...lookupEntry, docs: lookupDocs, fetchedAt: Date.now() });
  }
}

export function removeFromListCache(path: string, query: ApiListQuery, id: string) {
  const key = cacheKey(path, query);
  const entry = cache.get(key);
  if (entry) {
    const had = entry.docs.some((d) => docId(d) === id);
    const docs = entry.docs.filter((d) => docId(d) !== id);
    const meta = entry.meta && had
      ? { ...entry.meta, total: Math.max(0, entry.meta.total - 1) }
      : entry.meta;
    cache.set(key, { docs, meta, fetchedAt: Date.now() });
  }

  const lookupKey = lookupCacheKey(path);
  const lookupEntry = cache.get(lookupKey);
  if (lookupEntry) {
    const docs = lookupEntry.docs.filter((d) => docId(d) !== id);
    cache.set(lookupKey, { ...lookupEntry, docs, fetchedAt: Date.now() });
  }
}

export function invalidateApiListCache(path?: string) {
  if (!path) {
    cache.clear();
    return;
  }
  const base = normalizePath(path);
  for (const key of cache.keys()) {
    if (key.startsWith(`${base}?`)) cache.delete(key);
  }
}
