'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  API_RESOURCE_PATHS,
  API_MODULE_LABELS,
  type ApiModule,
  isModuleApiMode,
} from '@/lib/config/data-source';
import { cacheTtlForModule } from '@/lib/config/cache-policy';
import { getRouteModulePageSize } from '@/lib/config/route-table-config';
import {
  createResource,
  deleteResource,
  fetchResourcePage,
  isCachedResourceList,
  isCachedResourceListFresh,
  readCachedResourceList,
  updateResource,
  apiDocId,
} from '@/lib/services/api-resource-service';
import { onApiMutation, consumeModuleMutation } from '@/lib/services/api-sync-events';
import {
  invalidateApiListCache,
  setApiListCache,
  prependToListCache,
  patchListCacheRow,
  removeFromListCache,
  LOOKUP_CACHE_QUERY,
} from '@/lib/services/api-list-cache';
import { DEFAULT_LIST_PAGE_SIZE, isDefaultListQuery, type ApiPaginationMeta } from '@/lib/services/api-pagination-types';
import { useModuleInitialRows } from '@/components/providers/ModuleInitialDataProvider';
import { useAppStore } from '@/lib/state/app-store';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

type PaginatedApiOptions = {
  pageSize?: number;
  initialRows?: Record<string, unknown>[];
  initialMeta?: ApiPaginationMeta;
};

function auditEntityLabel(body: Record<string, unknown>, id: string): string {
  return String(
    body.name ?? body.title ?? body.customerName ?? body.company ?? body.buyer ?? body.item ?? id,
  );
}

function recordApiAudit(
  module: ApiModule,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  id: string,
  body?: Record<string, unknown>,
) {
  const label = API_MODULE_LABELS[module] ?? module;
  const entity = body ? auditEntityLabel(body, id) : id;
  const verb = action === 'CREATE' ? 'Created' : action === 'UPDATE' ? 'Updated' : 'Deleted';
  useAppStore.getState().recordAuditEvent({
    action,
    module: label,
    entityType: module,
    entityId: id,
    description: `${verb} ${entity} in ${label}`,
  });
}

export function usePaginatedApiResource(
  module: ApiModule,
  mapRow: (doc: Record<string, unknown>) => Record<string, unknown>,
  options?: PaginatedApiOptions,
) {
  const enabled = isModuleApiMode(module);
  const path = API_RESOURCE_PATHS[module];
  const pathname = usePathname();
  const mapRowRef = useRef(mapRow);
  mapRowRef.current = mapRow;
  const listTtl = cacheTtlForModule(module);
  const skipMutationReloadRef = useRef(false);

  const serverRows = useModuleInitialRows(module);
  const initialRows = options?.initialRows ?? serverRows;
  const hasServerSeed = initialRows !== undefined && initialRows.length > 0;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(
    options?.pageSize ?? getRouteModulePageSize(pathname, module),
  );
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [queryFilters, setQueryFilters] = useState<Record<string, string>>({});
  const debouncedSearch = useDebouncedValue(search, 300);

  const queryKey = useMemo(
    () => ({ page, limit: pageSize, search: debouncedSearch, status, ...queryFilters }),
    [page, pageSize, debouncedSearch, status, queryFilters],
  );

  const isDefaultQuery = isDefaultListQuery(queryKey);
  const seedFitsPage = Boolean(hasServerSeed && (initialRows?.length ?? 0) <= pageSize);

  const [rows, setRows] = useState<Record<string, unknown>[]>(() => {
    if (!enabled) return [];
    if (hasServerSeed && page === 1 && isDefaultQuery) {
      const seeded = seedFitsPage ? initialRows ?? [] : (initialRows ?? []).slice(0, pageSize);
      return seeded.map((doc) => mapRow(doc));
    }
    const cached = readCachedResourceList(path, queryKey);
    return cached ? cached.map((doc) => mapRow(doc)) : [];
  });

  const [meta, setMeta] = useState<ApiPaginationMeta>(() => {
    if (options?.initialMeta) return options.initialMeta;
    return {
      total: 0,
      page: 1,
      limit: pageSize,
      totalPages: 1,
    };
  });

  const [loading, setLoading] = useState(() => {
    if (!enabled) return false;
    if (seedFitsPage && options?.initialMeta && page === 1 && !debouncedSearch && status === 'all') return false;
    return !isCachedResourceList(path, queryKey);
  });

  const [initialized, setInitialized] = useState(() => {
    if (!enabled) return true;
    if (seedFitsPage && options?.initialMeta && page === 1 && !debouncedSearch && status === 'all') return true;
    return isCachedResourceList(path, queryKey);
  });

  const [error, setError] = useState<string | null>(null);
  const fetchGenRef = useRef(0);
  const skipFirstFetchRef = useRef(Boolean(seedFitsPage && options?.initialMeta));
  const apiDataReady = useAppStore((s) => s.apiDataReady);

  const reload = useCallback(async (opts?: { silent?: boolean }) => {
    if (!enabled) return;
    const generation = ++fetchGenRef.current;
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const result = await fetchResourcePage(path, queryKey);
      if (generation !== fetchGenRef.current) return;
      setRows(result.rows.map((doc) => mapRowRef.current(doc)));
      setMeta(result.meta);
      setApiListCache(path, result.rows, queryKey, result.meta);
    } catch (err) {
      if (generation !== fetchGenRef.current) return;
      setError(err instanceof Error ? err.message : `Failed to load ${module}`);
    } finally {
      if (generation === fetchGenRef.current) {
        setLoading(false);
        setInitialized(true);
      }
    }
  }, [enabled, path, module, queryKey]);

  useEffect(() => {
    if (!enabled || !apiDataReady) return;
    const mutated = consumeModuleMutation(module);
    if (mutated) {
      skipFirstFetchRef.current = false;
    }
    if (skipFirstFetchRef.current && page === 1 && isDefaultQuery && seedFitsPage) {
      skipFirstFetchRef.current = false;
      if (initialRows && options?.initialMeta) {
        setApiListCache(path, initialRows, queryKey, options.initialMeta);
      }
      return;
    }
    const isFresh = isCachedResourceListFresh(path, queryKey, listTtl);
    const hasCached = isCachedResourceList(path, queryKey);
    if (isFresh && !mutated) {
      const cached = readCachedResourceList(path, queryKey);
      if (cached !== null) {
        setRows(cached.map((doc) => mapRowRef.current(doc)));
        setInitialized(true);
        setLoading(false);
      }
      return;
    }
    if (hasCached && !mutated) {
      const cached = readCachedResourceList(path, queryKey);
      if (cached !== null) {
        setRows(cached.map((doc) => mapRowRef.current(doc)));
        setInitialized(true);
        setLoading(false);
      }
      void reload({ silent: true });
      return;
    }
    void reload(undefined);
  }, [enabled, apiDataReady, path, reload, queryKey, page, debouncedSearch, status, queryFilters, listTtl, module, isDefaultQuery, seedFitsPage, initialRows, options?.initialMeta]);

  useEffect(() => {
    if (!enabled) return;
    return onApiMutation((modules) => {
      if (!modules?.includes(module)) return;
      if (skipMutationReloadRef.current) {
        skipMutationReloadRef.current = false;
        return;
      }
      void reload({ silent: true });
    });
  }, [enabled, module, path, reload]);

  const setSearchTerm = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const setStatusFilter = useCallback((value: string) => {
    setStatus(value);
    setPage(1);
  }, []);

  const setQueryFilter = useCallback((key: string, value: string) => {
    setQueryFilters((prev) => {
      if (!value || value === 'all') {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      }
      if (prev[key] === value) return prev;
      return { ...prev, [key]: value };
    });
    setPage(1);
  }, []);

  const create = useCallback(async (body: Record<string, unknown>) => {
    skipMutationReloadRef.current = true;
    const result = await createResource(path, body);
    if (result.ok) {
      recordApiAudit(module, 'CREATE', result.id, body);
      const raw = { ...body, ...result.data, id: result.id };
      const mapped = mapRowRef.current(raw);
      prependToListCache(path, queryKey, raw, {
        total: meta.total + 1,
        page: meta.page,
        limit: meta.limit,
        totalPages: Math.max(1, Math.ceil((meta.total + 1) / meta.limit)),
      });
      if (page === 1 && isDefaultQuery) {
        setRows((prev) => {
          const id = apiDocId(raw);
          const filtered = prev.filter((r) => apiDocId(r) !== id);
          return [mapped, ...filtered].slice(0, pageSize);
        });
        setMeta((m) => ({ ...m, total: m.total + 1 }));
      }
    } else {
      skipMutationReloadRef.current = false;
    }
    return result;
  }, [path, module, queryKey, meta, page, pageSize, isDefaultQuery]);

  const update = useCallback(async (id: string, body: Record<string, unknown>) => {
    skipMutationReloadRef.current = true;
    const result = await updateResource(path, id, body);
    if (result.ok) {
      recordApiAudit(module, 'UPDATE', id, body);
      patchListCacheRow(path, queryKey, id, body);
      setRows((prev) =>
        prev.map((row) => (apiDocId(row) === id ? mapRowRef.current({ ...row, ...body, id }) : row)),
      );
    } else {
      skipMutationReloadRef.current = false;
    }
    return result;
  }, [path, module, queryKey]);

  const remove = useCallback(async (id: string) => {
    skipMutationReloadRef.current = true;
    const result = await deleteResource(path, id);
    if (result.ok) {
      recordApiAudit(module, 'DELETE', id);
      removeFromListCache(path, queryKey, id);
      setRows((prev) => prev.filter((row) => apiDocId(row) !== id));
      setMeta((m) => ({ ...m, total: Math.max(0, m.total - 1) }));
    } else {
      skipMutationReloadRef.current = false;
    }
    return result;
  }, [path, module, queryKey]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPage(1);
  }, []);

  return {
    enabled,
    rows,
    meta,
    page,
    pageSize,
    search,
    status,
    queryFilters,
    loading,
    initialized,
    error,
    setPage,
    setPageSize,
    setSearchTerm,
    setStatusFilter,
    setQueryFilter,
    reload,
    create,
    update,
    remove,
  };
}
