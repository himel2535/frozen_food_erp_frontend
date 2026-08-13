'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/state/app-store';
import { applyApiDataToAppState } from '@/lib/services/api-app-state-mapper';
import { useApiAggregate } from '@/hooks/use-api-aggregate';
import { isMongoDbBackend, type ApiModule } from '@/lib/config/data-source';
import type { AppState } from '@/lib/state/types';

const USE_API = isMongoDbBackend();

/** Scoped API merge for pages that need fresh data beyond global hydrator timing. */
export function useApiAppState(modules?: ApiModule[]) {
  const base = useAppStore((s) => s.appState);
  const agg = useApiAggregate(USE_API && modules?.length ? modules : []);

  const state = useMemo(() => {
    if (!USE_API || !modules?.length || !agg.initialized) return base;
    return applyApiDataToAppState(base, agg.data);
  }, [base, modules, agg.initialized, agg.data]);

  return {
    state,
    apiActive: USE_API,
    loading: agg.loading,
    error: agg.error,
    reload: agg.reload,
  };
}

/** Prefer global Zustand state (hydrated by ApiStateHydrator) with optional local override. */
export function useMergedAppState(localOverride?: Partial<AppState>): AppState {
  const base = useAppStore((s) => s.appState);
  return useMemo(
    () => (localOverride ? { ...base, ...localOverride } as AppState : base),
    [base, localOverride],
  );
}
