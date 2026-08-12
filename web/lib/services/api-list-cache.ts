/** In-memory list cache — seeded by ApiStateHydrator, reused by page hooks (avoids refetch on every navigation). */

type CacheEntry = {
  docs: Record<string, unknown>[];
  fetchedAt: number;
};

const cache = new Map<string, CacheEntry>();

function normalizePath(path: string): string {
  const base = path.startsWith('/') ? path : `/${path}`;
  return base.split('?')[0];
}

export function getApiListCache(path: string): Record<string, unknown>[] | null {
  const entry = cache.get(normalizePath(path));
  return entry ? entry.docs : null;
}

/** True once a list has been fetched at least once (including empty results). */
export function hasApiListCache(path: string): boolean {
  return cache.has(normalizePath(path));
}

export function setApiListCache(path: string, docs: Record<string, unknown>[]) {
  cache.set(normalizePath(path), { docs, fetchedAt: Date.now() });
}

export function invalidateApiListCache(path?: string) {
  if (path) cache.delete(normalizePath(path));
  else cache.clear();
}
