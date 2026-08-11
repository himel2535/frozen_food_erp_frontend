'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { API_RESOURCE_PATHS, type ApiModule } from '@/lib/config/data-source';
import { fetchResourceList } from '@/lib/services/api-resource-service';

type AggregateResult = {
  loading: boolean;
  initialized: boolean;
  error: string | null;
  reload: () => Promise<void>;
  data: Partial<Record<ApiModule, Record<string, unknown>[]>>;
};

export function useApiAggregate(modules: ApiModule[]): AggregateResult {
  const modulesKey = modules.join(',');
  const [data, setData] = useState<Partial<Record<ApiModule, Record<string, unknown>[]>>>({});
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const genRef = useRef(0);

  const reload = useCallback(async () => {
    const gen = ++genRef.current;
    setLoading(true);
    setError(null);
    try {
      const entries = await Promise.all(
        modules.map(async (mod) => {
          const rows = await fetchResourceList(API_RESOURCE_PATHS[mod]);
          return [mod, rows] as const;
        }),
      );
      if (gen !== genRef.current) return;
      setData(Object.fromEntries(entries) as Partial<Record<ApiModule, Record<string, unknown>[]>>);
    } catch (err) {
      if (gen !== genRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      if (gen === genRef.current) {
        setLoading(false);
        setInitialized(true);
      }
    }
  }, [modulesKey]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { loading, initialized, error, reload, data };
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
