'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
import { notifyApiMutation, onApiMutation, consumeModuleMutation } from '@/lib/services/api-sync-events';
import { invalidateApiListCache, setApiListCache } from '@/lib/services/api-list-cache';
import { DEFAULT_LIST_PAGE_SIZE } from '@/lib/services/api-pagination-types';
import { useModuleInitialRows } from '@/components/providers/ModuleInitialDataProvider';
import { useAppStore } from '@/lib/state/app-store';

type ApiResourceStoreOptions = {
  /** Server-fetched rows — skip blocking initial fetch when provided. */
  initialRows?: Record<string, unknown>[];
  skipInitialFetch?: boolean;
  /** When true, fetches only the first page (faster for large lists). */
  pageOnly?: boolean;
  /** Page size for pageOnly fetches (dropdowns / lookups). */
  lookupLimit?: number;
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
  const serverRows = useModuleInitialRows(module);
  const initialRowsRef = useRef(options?.initialRows ?? serverRows);
  initialRowsRef.current = options?.initialRows ?? serverRows;
  const resolvedInitial = initialRowsRef.current;
  const hasServerSeed = resolvedInitial !== undefined;
  const skipInitialFetch = Boolean(options?.skipInitialFetch || hasServerSeed);
  const skipFetchRef = useRef(skipInitialFetch);
  const pageOnly = options?.pageOnly ?? true;
  const listQuery = { page: 1, limit: options?.lookupLimit ?? DEFAULT_LIST_PAGE_SIZE };

  const [rows, setRows] = useState<Record<string, unknown>[]>(() => {
    if (!enabled) return [];
    if (hasServerSeed) {
      return (resolvedInitial ?? []).map((doc) => mapRow(doc));
    }
    const docs = readCachedResourceList(path, listQuery);
    return docs ? docs.map((doc) => mapRow(doc)) : [];
  });
  const [loading, setLoading] = useState(() => {
    if (!enabled) return false;
    if (hasServerSeed) return false;
    return !isCachedResourceList(path, listQuery);
  });
  const [initialized, setInitialized] = useState(() => {
    if (!enabled) return true;
    if (hasServerSeed) return true;
    return isCachedResourceList(path, listQuery);
  });
  const [error, setError] = useState<string | null>(null);
  const fetchGenRef = useRef(0);

  const reload = useCallback(async (opts?: { silent?: boolean }) => {
    if (!enabled) return;
    const generation = ++fetchGenRef.current;
    if (!opts?.silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const result = pageOnly
        ? await fetchResourcePage(path, listQuery)
        : await fetchResourcePage(path, { page: 1, limit: 100 });
      if (generation !== fetchGenRef.current) return;
      const docs = result.rows;
      setRows(docs.map((doc) => mapRowRef.current(doc)));
    } catch (err) {
      if (generation !== fetchGenRef.current) return;
      setError(err instanceof Error ? err.message : `Failed to load ${module}`);
    } finally {
      if (generation === fetchGenRef.current) {
        setLoading(false);
        setInitialized(true);
      }
    }
  }, [enabled, path, module, pageOnly]);

  useEffect(() => {
    if (!enabled) return;
    const mutated = consumeModuleMutation(module);
    if (mutated) {
      skipFetchRef.current = false;
      invalidateApiListCache(path);
    }
    if (skipFetchRef.current && initialRowsRef.current !== undefined) {
      skipFetchRef.current = false;
      setApiListCache(path, initialRowsRef.current ?? [], listQuery);
      return;
    }
    const isFresh = isCachedResourceListFresh(path, listQuery, 10000);
    if (isFresh && !mutated) return;
    const hasCache = isCachedResourceList(path, listQuery);
    void reload(hasCache ? { silent: true } : undefined);
  }, [enabled, path, reload, listQuery.limit]);

  useEffect(() => {
    if (!enabled) return;
    return onApiMutation((modules) => {
      if (!modules || modules.includes(module)) {
        void reload();
      }
    });
  }, [enabled, module, reload]);

  const create = useCallback(async (body: Record<string, unknown>) => {
    const result = await createResource(path, body);
    if (result.ok) {
      recordApiAudit(module, 'CREATE', result.id, body);
      invalidateApiListCache(path);
      await reload();
      notifyApiMutation([module]);
    }
    return result;
  }, [path, reload, module]);

  const update = useCallback(async (id: string, body: Record<string, unknown>) => {
    const result = await updateResource(path, id, body);
    if (result.ok) {
      recordApiAudit(module, 'UPDATE', id, body);
      invalidateApiListCache(path);
      await reload();
      notifyApiMutation([module]);
    }
    return result;
  }, [path, reload, module]);

  const remove = useCallback(async (id: string) => {
    const result = await deleteResource(path, id);
    if (result.ok) {
      recordApiAudit(module, 'DELETE', id);
      invalidateApiListCache(path);
      await reload();
      notifyApiMutation([module]);
    }
    return result;
  }, [path, reload, module]);

  return { enabled, rows, loading, initialized, error, reload, create, update, remove };
}
