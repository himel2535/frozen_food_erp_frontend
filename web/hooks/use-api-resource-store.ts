'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  API_RESOURCE_PATHS,
  type ApiModule,
  isModuleApiMode,
} from '@/lib/config/data-source';
import {
  createResource,
  deleteResource,
  fetchResourceList,
  isCachedResourceList,
  readCachedResourceList,
  updateResource,
} from '@/lib/services/api-resource-service';
import { notifyApiMutation, onApiMutation } from '@/lib/services/api-sync-events';
import { setApiListCache } from '@/lib/services/api-list-cache';
import { useModuleInitialRows } from '@/components/providers/ModuleInitialDataProvider';

type ApiResourceStoreOptions = {
  /** Server-fetched rows — skip blocking initial fetch when provided. */
  initialRows?: Record<string, unknown>[];
  skipInitialFetch?: boolean;
};

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
  const skipInitialFetch = Boolean(
    (options?.skipInitialFetch || serverRows?.length) && resolvedInitial?.length,
  );

  const [rows, setRows] = useState<Record<string, unknown>[]>(() => {
    if (!enabled) return [];
    if (resolvedInitial?.length) {
      return resolvedInitial.map((doc) => mapRow(doc));
    }
    const docs = readCachedResourceList(path);
    return docs ? docs.map((doc) => mapRow(doc)) : [];
  });
  const [loading, setLoading] = useState(() => {
    if (!enabled) return false;
    if (resolvedInitial?.length) return false;
    return !isCachedResourceList(path);
  });
  const [initialized, setInitialized] = useState(() => {
    if (!enabled) return true;
    if (resolvedInitial?.length) return true;
    return isCachedResourceList(path);
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
      const docs = await fetchResourceList(path);
      if (generation !== fetchGenRef.current) return;
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
  }, [enabled, path, module]);

  useEffect(() => {
    if (!enabled) return;
    if (skipInitialFetch && initialRowsRef.current?.length) {
      setApiListCache(path, initialRowsRef.current);
      return;
    }
    const hasCache = isCachedResourceList(path);
    void reload(hasCache ? { silent: true } : undefined);
  }, [enabled, path, reload, skipInitialFetch]);

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
      await reload();
      notifyApiMutation([module]);
    }
    return result;
  }, [path, reload, module]);

  const update = useCallback(async (id: string, body: Record<string, unknown>) => {
    const result = await updateResource(path, id, body);
    if (result.ok) {
      await reload();
      notifyApiMutation([module]);
    }
    return result;
  }, [path, reload, module]);

  const remove = useCallback(async (id: string) => {
    const result = await deleteResource(path, id);
    if (result.ok) {
      await reload();
      notifyApiMutation([module]);
    }
    return result;
  }, [path, reload, module]);

  return { enabled, rows, loading, initialized, error, reload, create, update, remove };
}
