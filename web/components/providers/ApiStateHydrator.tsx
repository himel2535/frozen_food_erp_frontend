'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/state/app-store';
import {
  API_BOOT_MODULES,
  API_RESOURCE_PATHS,
  getApiBackgroundModules,
  isMongoDbBackend,
  MONGODB_READY_MODULES,
  type ApiModule,
} from '@/lib/config/data-source';
import { fetchResourceList } from '@/lib/services/api-resource-service';
import { applyApiDataToAppState } from '@/lib/services/api-app-state-mapper';
import { onApiMutation } from '@/lib/services/api-sync-events';

const USE_API = isMongoDbBackend();
const BACKGROUND_MODULES = getApiBackgroundModules();
const BACKGROUND_CHUNK = 6;

async function fetchModules(mods: ApiModule[]) {
  const entries = await Promise.all(
    mods.map(async (mod) => [mod, await fetchResourceList(API_RESOURCE_PATHS[mod])] as const),
  );
  return Object.fromEntries(entries) as Partial<Record<ApiModule, Record<string, unknown>[]>>;
}

function mergeApiSnapshot(partial: Partial<Record<ApiModule, Record<string, unknown>[]>>) {
  const { replaceAppState, appState } = useAppStore.getState();
  replaceAppState(applyApiDataToAppState(appState, partial));
}

/** Keeps Zustand appState in sync with MongoDB — boot modules first, rest in background. */
export function ApiStateHydrator() {
  const setApiDataReady = useAppStore((s) => s.setApiDataReady);
  const bootDoneRef = useRef(false);

  useEffect(() => {
    if (!USE_API) return;
    let cancelled = false;

    void (async () => {
      try {
        const boot = await fetchModules([...API_BOOT_MODULES]);
        if (cancelled) return;
        mergeApiSnapshot(boot);
        bootDoneRef.current = true;
        setApiDataReady(true);

        for (let i = 0; i < BACKGROUND_MODULES.length; i += BACKGROUND_CHUNK) {
          if (cancelled) return;
          const chunk = BACKGROUND_MODULES.slice(i, i + BACKGROUND_CHUNK);
          const partial = await fetchModules(chunk);
          if (cancelled) return;
          mergeApiSnapshot(partial);
        }
      } catch {
        if (!cancelled && !bootDoneRef.current) {
          setApiDataReady(true);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [setApiDataReady]);

  useEffect(() => {
    if (!USE_API) return;
    return onApiMutation((modules) => {
      const targets = (modules?.length
        ? modules.filter((mod) => MONGODB_READY_MODULES.includes(mod))
        : [...API_BOOT_MODULES]) as ApiModule[];
      if (!targets.length) return;
      void fetchModules(targets).then((partial) => {
        if (Object.keys(partial).length > 0) mergeApiSnapshot(partial);
      });
    });
  }, []);

  return null;
}
