'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { API_RESOURCE_PATHS, type ApiModule } from '@/lib/config/data-source';
import { fetchResourceList } from '@/lib/services/api-resource-service';

type AggregateResult = {
  loading: boolean;
  initialized: boolean;
  error: string | null;
  reload: () => Promise<void>;
  reloadModules: (modules?: ApiModule[]) => Promise<void>;
  data: Partial<Record<ApiModule, Record<string, unknown>[]>>;
};

export function useApiAggregate(modules: ApiModule[]): AggregateResult {
  const modulesKey = modules.join(',');
  const moduleSet = useMemo(() => new Set(modules), [modulesKey]);
  const [data, setData] = useState<Partial<Record<ApiModule, Record<string, unknown>[]>>>({});
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const genRef = useRef(0);

  const reloadModules = useCallback(async (mods?: ApiModule[]) => {
    const targets = mods?.length
      ? mods.filter((mod) => moduleSet.has(mod))
      : modules;
    if (!targets.length) return;

    const gen = ++genRef.current;
    setLoading(true);
    setError(null);
    try {
      const entries = await Promise.all(
        targets.map(async (mod) => [mod, await fetchResourceList(API_RESOURCE_PATHS[mod])] as const),
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
  }, [moduleSet, modules, modulesKey]);

  const reload = useCallback(async () => {
    await reloadModules(modules);
  }, [reloadModules, modules]);

  useEffect(() => {
    void reload();
  }, [reload]);

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
