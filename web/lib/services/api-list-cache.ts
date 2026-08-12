/** In-memory list cache — keyed by path + pagination query for fast route revisits. */

import {
  buildListQueryString,
  type ApiListQuery,
} from '@/lib/services/api-pagination-types';

type CacheEntry = {
  docs: Record<string, unknown>[];
  meta?: { total: number; page: number; limit: number; totalPages: number };
  fetchedAt: number;
};

const cache = new Map<string, CacheEntry>();

function normalizePath(path: string): string {
  const base = path.startsWith('/') ? path : `/${path}`;
  return base.split('?')[0];
}

function cacheKey(path: string, query?: ApiListQuery): string {
  const base = normalizePath(path);
  if (!query) return `${base}?page=1&limit=25`;
  return `${base}?${buildListQueryString(query)}`;
}

export function getApiListCache(path: string, query?: ApiListQuery): Record<string, unknown>[] | null {
  const entry = cache.get(cacheKey(path, query));
  return entry ? entry.docs : null;
}

export function getApiListCacheMeta(path: string, query?: ApiListQuery) {
  const entry = cache.get(cacheKey(path, query));
  return entry?.meta ?? null;
}

/** True once a list has been fetched at least once (including empty results). */
export function hasApiListCache(path: string, query?: ApiListQuery): boolean {
  return cache.has(cacheKey(path, query));
}

export function setApiListCache(
  path: string,
  docs: Record<string, unknown>[],
  query?: ApiListQuery,
  meta?: CacheEntry['meta'],
) {
  cache.set(cacheKey(path, query), { docs, meta, fetchedAt: Date.now() });
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
