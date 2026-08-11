'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/state/app-store';
import { MONGODB_READY_MODULES, isMongoDbBackend } from '@/lib/config/data-source';
import { useApiAggregate } from '@/hooks/use-api-aggregate';
import { applyApiDataToAppState } from '@/lib/services/api-app-state-mapper';
import { onApiMutation } from '@/lib/services/api-sync-events';

const USE_API = isMongoDbBackend();

/** Keeps Zustand appState in sync with MongoDB for legacy service consumers. */
export function ApiStateHydrator() {
  const replaceAppState = useAppStore((s) => s.replaceAppState);
  const setApiDataReady = useAppStore((s) => s.setApiDataReady);
  const agg = useApiAggregate(USE_API ? [...MONGODB_READY_MODULES] : []);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (!USE_API || !agg.initialized) return;
    const current = useAppStore.getState().appState;
    replaceAppState(applyApiDataToAppState(current, agg.data));
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      setApiDataReady(true);
    }
  }, [USE_API, agg.initialized, agg.data, replaceAppState, setApiDataReady]);

  useEffect(() => {
    if (!USE_API) return;
    const onFocus = () => { void agg.reload(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [USE_API, agg.reload]);

  useEffect(() => {
    if (!USE_API) return;
    return onApiMutation(() => { void agg.reload(); });
  }, [USE_API, agg.reload]);

  return null;
}
