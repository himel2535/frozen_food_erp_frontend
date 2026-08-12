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
import { setApiListCache } from '@/lib/services/api-list-cache';
import { applyApiDataToAppState } from '@/lib/services/api-app-state-mapper';
import { onApiMutation } from '@/lib/services/api-sync-events';

const USE_API = isMongoDbBackend();
const BACKGROUND_MODULES = getApiBackgroundModules();
const BACKGROUND_CHUNK = 4;

async function fetchModulesSafe(mods: ApiModule[]) {
  const results = await Promise.allSettled(
    mods.map(async (mod) => {
      const path = API_RESOURCE_PATHS[mod];
      const docs = await fetchResourceList(path);
      setApiListCache(path, docs);
      return [mod, docs] as const;
    }),
  );

  const partial: Partial<Record<ApiModule, Record<string, unknown>[]>> = {};
  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    const [mod, docs] = result.value;
    partial[mod] = docs;
  }
  return partial;
}

function mergeApiSnapshot(partial: Partial<Record<ApiModule, Record<string, unknown>[]>>) {
  if (Object.keys(partial).length === 0) return;
  const { replaceAppState, appState } = useAppStore.getState();
  replaceAppState(applyApiDataToAppState(appState, partial));
}

/** Keeps Zustand appState in sync with MongoDB — never blocks the UI. */
export function ApiStateHydrator() {
  const setApiDataReady = useAppStore((s) => s.setApiDataReady);
  const bootDoneRef = useRef(false);

  useEffect(() => {
    if (!USE_API) return;
    setApiDataReady(true);

    let cancelled = false;

    void (async () => {
      try {
        const boot = await fetchModulesSafe([...API_BOOT_MODULES]);
        if (cancelled) return;
        mergeApiSnapshot(boot);
        bootDoneRef.current = true;

        for (let i = 0; i < BACKGROUND_MODULES.length; i += BACKGROUND_CHUNK) {
          if (cancelled) return;
          const chunk = BACKGROUND_MODULES.slice(i, i + BACKGROUND_CHUNK);
          const partial = await fetchModulesSafe(chunk);
          if (cancelled) return;
          mergeApiSnapshot(partial);
        }
      } catch {
        if (!cancelled && !bootDoneRef.current) {
          bootDoneRef.current = true;
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
      void fetchModulesSafe(targets).then((partial) => mergeApiSnapshot(partial));
    });
  }, []);

  return null;
}
