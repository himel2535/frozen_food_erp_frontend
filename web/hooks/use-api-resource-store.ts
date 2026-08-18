'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  API_RESOURCE_PATHS,
  API_MODULE_LABELS,
  type ApiModule,
  isModuleApiMode,
} from '@/lib/config/data-source';
import { cacheTtlForModule } from '@/lib/config/cache-policy';
import {
  createResource,
  deleteResource,
  fetchResourcePage,
  isCachedResourceListFresh,
  readCachedResourceList,
  updateResource,
  apiDocId,
} from '@/lib/services/api-resource-service';
import { onApiMutation, consumeModuleMutation } from '@/lib/services/api-sync-events';
import {
  setApiListCache,
  setLookupCache,
  prependToListCache,
  patchListCacheRow,
  removeFromListCache,
  LOOKUP_CACHE_QUERY,
  isLookupCacheFresh,
  getLookupCache,
} from '@/lib/services/api-list-cache';
import { useModuleInitialRows } from '@/components/providers/ModuleInitialDataProvider';
import { useAppStore } from '@/lib/state/app-store';

type ApiResourceStoreOptions = {
  initialRows?: Record<string, unknown>[];
  skipInitialFetch?: boolean;
  pageOnly?: boolean;
  lookupLimit?: number;
  /** When true, use hydrator/lookup cache only — no network unless cache stale or reload() called. */
  cacheOnly?: boolean;
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

export function useApiResourceStore(
  module: ApiModule,
  mapRow: (doc: Record<string, unknown>) => Record<string, unknown>,
  options?: ApiResourceStoreOptions,
) {
  const enabled = isModuleApiMode(module);
  const path = API_RESOURCE_PATHS[module];
  const mapRowRef = useRef(mapRow);
  mapRowRef.current = mapRow;
  const listTtl = cacheTtlForModule(module);
  const skipMutationReloadRef = useRef(false);
  const pageOnly = options?.pageOnly ?? true;
  const listQuery = LOOKUP_CACHE_QUERY;

  const serverRows = useModuleInitialRows(module);
  const initialRowsRef = useRef(options?.initialRows ?? serverRows);
  initialRowsRef.current = options?.initialRows ?? serverRows;
  const resolvedInitial = initialRowsRef.current;
  const hasServerSeed = resolvedInitial !== undefined;
  const skipInitialFetch = Boolean(options?.skipInitialFetch || hasServerSeed || options?.cacheOnly);
  const skipFetchRef = useRef(skipInitialFetch);
  const cacheOnly = options?.cacheOnly ?? false;
  const apiDataReady = useAppStore((s) => s.apiDataReady);

  const readInitialRows = (): Record<string, unknown>[] => {
    if (isLookupCacheFresh(path, listTtl)) {
      const lookup = getLookupCache(path);
      if (lookup) return lookup;
    }
    const cached = readCachedResourceList(path, listQuery);
    return cached ?? [];
  };

  const [rows, setRows] = useState<Record<string, unknown>[]>(() => {
    if (!enabled) return [];
    if (hasServerSeed) {
      return (resolvedInitial ?? []).map((doc) => mapRow(doc));
    }
    const docs = readInitialRows();
    return docs.length ? docs.map((doc) => mapRow(doc)) : [];
  });
  const [loading, setLoading] = useState(() => {
    if (!enabled) return false;
    if (hasServerSeed) return false;
    return !isLookupCacheFresh(path, listTtl) && !readCachedResourceList(path, listQuery);
  });
  const [initialized, setInitialized] = useState(() => {
    if (!enabled) return true;
    if (hasServerSeed) return true;
    return Boolean(isLookupCacheFresh(path, listTtl) || readCachedResourceList(path, listQuery));
  });
  const [error, setError] = useState<string | null>(null);
  const fetchGenRef = useRef(0);

  const reload = useCallback(async (opts?: { silent?: boolean }) => {
    if (!enabled) return;
    const generation = ++fetchGenRef.current;
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const result = await fetchResourcePage(path, listQuery);
      if (generation !== fetchGenRef.current) return;
      setLookupCache(path, result.rows, result.meta);
      setRows(result.rows.map((doc) => mapRowRef.current(doc)));
    } catch (err) {
      if (generation !== fetchGenRef.current) return;
      setError(err instanceof Error ? err.message : `Failed to load ${module}`);
    } finally {
      if (generation === fetchGenRef.current) {
        setLoading(false);
        setInitialized(true);
      }
    }
  }, [enabled, path, module, listQuery]);

  useEffect(() => {
    if (!enabled || !apiDataReady) return;
    const mutated = consumeModuleMutation(module);
    if (mutated) skipFetchRef.current = false;
    if (skipFetchRef.current && initialRowsRef.current !== undefined) {
      skipFetchRef.current = false;
      setLookupCache(path, initialRowsRef.current ?? []);
      return;
    }
    const fresh = isLookupCacheFresh(path, listTtl)
      || isCachedResourceListFresh(path, listQuery, listTtl);
    if (fresh && !mutated) {
      const docs = readInitialRows();
      if (docs.length) {
        setRows(docs.map((doc) => mapRowRef.current(doc)));
        setInitialized(true);
        setLoading(false);
      }
      return;
    }
    void reload({ silent: fresh });
  }, [enabled, apiDataReady, path, reload, listTtl, listQuery, module]);

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
  }, [enabled, module, reload]);

  const create = useCallback(async (body: Record<string, unknown>) => {
    skipMutationReloadRef.current = true;
    const result = await createResource(path, body);
    if (result.ok) {
      recordApiAudit(module, 'CREATE', result.id, body);
      const raw = { ...body, ...result.data, id: result.id };
      prependToListCache(path, listQuery, raw);
      setLookupCache(path, [raw, ...getLookupCache(path)?.filter((d) => apiDocId(d) !== result.id) ?? []]);
      setRows((prev) => [mapRowRef.current(raw), ...prev.filter((r) => apiDocId(r) !== result.id)]);
    } else {
      skipMutationReloadRef.current = false;
    }
    return result;
  }, [path, module, listQuery]);

  const update = useCallback(async (id: string, body: Record<string, unknown>) => {
    skipMutationReloadRef.current = true;
    const result = await updateResource(path, id, body);
    if (result.ok) {
      recordApiAudit(module, 'UPDATE', id, body);
      patchListCacheRow(path, listQuery, id, body);
      setRows((prev) =>
        prev.map((row) => (apiDocId(row) === id ? mapRowRef.current({ ...row, ...body, id }) : row)),
      );
    } else {
      skipMutationReloadRef.current = false;
    }
    return result;
  }, [path, module, listQuery]);

  const remove = useCallback(async (id: string) => {
    skipMutationReloadRef.current = true;
    const result = await deleteResource(path, id);
    if (result.ok) {
      recordApiAudit(module, 'DELETE', id);
      removeFromListCache(path, listQuery, id);
      setRows((prev) => prev.filter((row) => apiDocId(row) !== id));
    } else {
      skipMutationReloadRef.current = false;
    }
    return result;
  }, [path, module, listQuery]);

  return { enabled, rows, loading, initialized, error, reload, create, update, remove };
}
