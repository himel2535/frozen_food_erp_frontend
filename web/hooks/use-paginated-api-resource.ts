'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  API_RESOURCE_PATHS,
  API_MODULE_LABELS,
  type ApiModule,
  isModuleApiMode,
} from '@/lib/config/data-source';
import {
  createResource,
  deleteResource,
  fetchResourcePage,
  isCachedResourceList,
  isCachedResourceListFresh,
  readCachedResourceList,
  updateResource,
} from '@/lib/services/api-resource-service';
import { getApiListCacheMeta } from '@/lib/services/api-list-cache';
import { onApiMutation, consumeModuleMutation } from '@/lib/services/api-sync-events';
import { invalidateApiListCache, setApiListCache } from '@/lib/services/api-list-cache';
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
  const mapRowRef = useRef(mapRow);
  mapRowRef.current = mapRow;

  const serverRows = useModuleInitialRows(module);
  const initialRows = options?.initialRows ?? serverRows;
  // If SSR returns 0 rows, it's very likely due to 401 Unauthorized (because server doesn't have localstorage JWT).
  // By requiring length > 0, we prevent empty SSR payloads from wiping out valid client cache.
  const hasServerSeed = initialRows !== undefined && initialRows.length > 0;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(options?.pageSize ?? DEFAULT_LIST_PAGE_SIZE);
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
    return getApiListCacheMeta(path, queryKey) ?? {
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
    if (!enabled) return;
    const mutated = consumeModuleMutation(module);
    if (mutated) {
      skipFirstFetchRef.current = false;
      invalidateApiListCache(path);
    }
    if (skipFirstFetchRef.current && page === 1 && isDefaultQuery && seedFitsPage) {
      skipFirstFetchRef.current = false;
      if (initialRows && options?.initialMeta) {
        setApiListCache(path, initialRows, queryKey, options.initialMeta);
      }
      return;
    }
    const isFresh = isCachedResourceListFresh(path, queryKey, 10000);
    if (isFresh && !mutated) return;
    const cached = isCachedResourceList(path, queryKey);
    void reload(cached ? { silent: true } : undefined);
  }, [enabled, path, reload, queryKey, page, debouncedSearch, status, queryFilters]);

  useEffect(() => {
    if (!enabled) return;
    return onApiMutation((modules) => {
      if (modules?.includes(module)) {
        invalidateApiListCache(path);
        void reload();
      }
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
    const result = await createResource(path, body);
    if (result.ok) {
      recordApiAudit(module, 'CREATE', result.id, body);
      invalidateApiListCache(path);
      await reload();
    }
    return result;
  }, [path, reload, module]);

  const update = useCallback(async (id: string, body: Record<string, unknown>) => {
    const result = await updateResource(path, id, body);
    if (result.ok) {
      recordApiAudit(module, 'UPDATE', id, body);
      invalidateApiListCache(path);
      await reload();
    }
    return result;
  }, [path, reload, module]);

  const remove = useCallback(async (id: string) => {
    const result = await deleteResource(path, id);
    if (result.ok) {
      recordApiAudit(module, 'DELETE', id);
      invalidateApiListCache(path);
      await reload();
    }
    return result;
  }, [path, reload, module]);

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
