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

export function useApiResourceStore(
  module: ApiModule,
  mapRow: (doc: Record<string, unknown>) => Record<string, unknown>,
) {
  const enabled = isModuleApiMode(module);
  const path = API_RESOURCE_PATHS[module];
  const mapRowRef = useRef(mapRow);
  mapRowRef.current = mapRow;

  const [rows, setRows] = useState<Record<string, unknown>[]>(() => {
    if (!enabled) return [];
    const docs = readCachedResourceList(path);
    return docs ? docs.map((doc) => mapRow(doc)) : [];
  });
  const [loading, setLoading] = useState(() => {
    if (!enabled) return false;
    return !isCachedResourceList(path);
  });
  const [initialized, setInitialized] = useState(() => {
    if (!enabled) return true;
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
    const hasCache = isCachedResourceList(path);
    void reload(hasCache ? { silent: true } : undefined);
  }, [enabled, path, reload]);

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
