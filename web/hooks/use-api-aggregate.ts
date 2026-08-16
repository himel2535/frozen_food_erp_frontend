'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { API_RESOURCE_PATHS, type ApiModule } from '@/lib/config/data-source';
import { fetchResourcePage, isCachedResourceList, isCachedResourceListFresh } from '@/lib/services/api-resource-service';
import { LOOKUP_LIST_PAGE_SIZE } from '@/lib/services/api-pagination-types';
import { setApiListCache, invalidateApiListCache } from '@/lib/services/api-list-cache';
import { consumeModuleMutation, onApiMutation } from '@/lib/services/api-sync-events';
import { useModuleInitialSnapshot } from '@/components/providers/ModuleInitialDataProvider';

type AggregateResult = {
  loading: boolean;
  initialized: boolean;
  error: string | null;
  reload: () => Promise<void>;
  reloadModules: (modules?: ApiModule[]) => Promise<void>;
  data: Partial<Record<ApiModule, Record<string, unknown>[]>>;
};

function seedFromSnapshot(
  modules: readonly ApiModule[],
  snapshot: Partial<Record<ApiModule, Record<string, unknown>[]>> | null,
) {
  if (!snapshot) return { data: {} as Partial<Record<ApiModule, Record<string, unknown>[]>>, ready: false };
  const data: Partial<Record<ApiModule, Record<string, unknown>[]>> = {};
  for (const mod of modules) {
    if (!(mod in snapshot)) return { data: {}, ready: false };
    data[mod] = snapshot[mod] ?? [];
  }
  return { data, ready: true };
}

function seedAggregateCache(data: Partial<Record<ApiModule, Record<string, unknown>[]>>) {
  for (const [mod, rows] of Object.entries(data) as [ApiModule, Record<string, unknown>[]][]) {
    setApiListCache(API_RESOURCE_PATHS[mod], rows);
  }
}

function modulesHaveCache(modules: readonly ApiModule[]) {
  return modules.some((mod) => isCachedResourceList(API_RESOURCE_PATHS[mod]));
}

function modulesAreFresh(modules: readonly ApiModule[]) {
  return modules.every((mod) => isCachedResourceListFresh(API_RESOURCE_PATHS[mod], undefined, 10000));
}

export function useApiAggregate(modules: readonly ApiModule[]): AggregateResult {
  const modulesKey = modules.join(',');
  const modulesRef = useRef(modules);
  modulesRef.current = modules;

  const moduleSet = useMemo(() => new Set(modules), [modulesKey]);
  const serverSnapshot = useModuleInitialSnapshot();
  const serverSnapshotRef = useRef(serverSnapshot);
  serverSnapshotRef.current = serverSnapshot;

  const initialSeed = useMemo(
    () => seedFromSnapshot(modules, serverSnapshot),
    [modules, modulesKey, serverSnapshot],
  );
  const initialCached = useMemo(() => modulesHaveCache(modules), [modulesKey]);

  const [data, setData] = useState<Partial<Record<ApiModule, Record<string, unknown>[]>>>(
    () => (initialSeed.ready ? initialSeed.data : {}),
  );
  const [loading, setLoading] = useState(() => !initialSeed.ready && !initialCached);
  const [initialized, setInitialized] = useState(() => initialSeed.ready || initialCached);
  const [error, setError] = useState<string | null>(null);
  const genRef = useRef(0);
  const bootstrappedKeyRef = useRef<string | null>(null);

  const reloadModules = useCallback(async (mods?: ApiModule[]) => {
    const activeModules = modulesRef.current;
    const targets = mods?.length
      ? mods.filter((mod) => moduleSet.has(mod))
      : activeModules;
    if (!targets.length) return;

    const gen = ++genRef.current;
    setLoading(true);
    setError(null);
    try {
      const entries = await Promise.all(
        targets.map(async (mod) => {
          const result = await fetchResourcePage(API_RESOURCE_PATHS[mod], {
            page: 1,
            limit: LOOKUP_LIST_PAGE_SIZE,
          });
          return [mod, result.rows] as const;
        }),
      );
      if (gen !== genRef.current) return;
      setData((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    } catch (err) {
      if (gen !== genRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      if (gen === genRef.current) {
        setLoading(false);
        setInitialized(true);
      }
    }
  }, [moduleSet, modulesKey]);

  const reload = useCallback(async () => {
    await reloadModules();
  }, [reloadModules]);

  useEffect(() => {
    if (bootstrappedKeyRef.current === modulesKey) return;
    bootstrappedKeyRef.current = modulesKey;

    let mutated = false;
    for (const mod of modulesRef.current) {
      if (consumeModuleMutation(mod)) {
        mutated = true;
        invalidateApiListCache(API_RESOURCE_PATHS[mod]);
      }
    }

    const seed = seedFromSnapshot(modulesRef.current, serverSnapshotRef.current);
    if (seed.ready && !mutated) {
      setData(seed.data);
      seedAggregateCache(seed.data);
      setLoading(false);
      setInitialized(true);
      return;
    }

    if (modulesAreFresh(modulesRef.current) && !mutated) {
      setLoading(false);
      setInitialized(true);
      return;
    }

    if (modulesHaveCache(modulesRef.current) && !mutated) {
      void reloadModules();
      return;
    }

    void reload();
  }, [modulesKey, reload, reloadModules]);

  useEffect(() => {
    return onApiMutation((modules) => {
      const active = modulesRef.current;
      const targets = modules?.length
        ? active.filter((mod) => modules.includes(mod))
        : [];
      if (!targets.length) return;
      for (const mod of targets) {
        invalidateApiListCache(API_RESOURCE_PATHS[mod]);
      }
      void reloadModules(targets);
    });
  }, [reloadModules, modulesKey]);

  return { loading, initialized, error, reload, reloadModules, data };
}

/** Fetch rows for a single API module (convenience wrapper). */
export function useApiRows(module: ApiModule) {
  const agg = useApiAggregate([module]);
  return {
    rows: agg.data[module] ?? [],
    loading: agg.loading,
    initialized: agg.initialized,
    error: agg.error,
    reload: agg.reload,
  };
}
