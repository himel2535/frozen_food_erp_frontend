'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/state/app-store';
import {
  API_BOOT_MODULES,
  API_RESOURCE_PATHS,
  isMongoDbBackend,
  type ApiModule,
} from '@/lib/config/data-source';
import { fetchResourcePage } from '@/lib/services/api-resource-service';
import { setApiListCache } from '@/lib/services/api-list-cache';
import { applyApiDataToAppState } from '@/lib/services/api-app-state-mapper';
import { onApiMutation } from '@/lib/services/api-sync-events';
import { DEFAULT_LIST_PAGE_SIZE } from '@/lib/services/api-pagination-types';

const USE_API = isMongoDbBackend();

async function fetchModulesPageSafe(mods: ApiModule[]) {
  const results = await Promise.allSettled(
    mods.map(async (mod) => {
      const path = API_RESOURCE_PATHS[mod];
      const { rows, meta } = await fetchResourcePage(path, { page: 1, limit: DEFAULT_LIST_PAGE_SIZE });
      setApiListCache(path, rows, { page: 1, limit: DEFAULT_LIST_PAGE_SIZE }, meta);
      return [mod, rows] as const;
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

/** Seeds Zustand with first-page API data — no full-list background sweep. */
export function ApiStateHydrator() {
  const authUser = useAppStore((s) => s.authUser);
  const authReady = useAppStore((s) => s.authReady);
  const setApiDataReady = useAppStore((s) => s.setApiDataReady);
  const bootDoneRef = useRef(false);

  useEffect(() => {
    if (!USE_API || !authReady || !authUser) return;

    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    void (async () => {
      await new Promise<void>((resolve) => {
        const idle = window.requestIdleCallback;
        if (typeof idle === 'function') {
          idleId = idle(() => resolve(), { timeout: 2500 });
        } else {
          timeoutId = window.setTimeout(resolve, 200);
        }
      });
      if (cancelled) return;
      try {
        const boot = await fetchModulesPageSafe([...API_BOOT_MODULES]);
        if (cancelled) return;
        mergeApiSnapshot(boot);
        setApiDataReady(true);
        bootDoneRef.current = true;
      } catch {
        if (!cancelled && !bootDoneRef.current) {
          setApiDataReady(true);
          bootDoneRef.current = true;
        }
      }
    })();

    return () => {
      cancelled = true;
      if (idleId != null && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, [authReady, authUser, setApiDataReady]);

  useEffect(() => {
    if (!USE_API || !authUser) return;
    return onApiMutation((modules) => {
      if (!modules?.length) return;
      const targets = modules.filter((mod) =>
        API_BOOT_MODULES.includes(mod as ApiModule),
      ) as ApiModule[];
      if (!targets.length) return;
      void fetchModulesPageSafe(targets).then((partial) => mergeApiSnapshot(partial));
    });
  }, [authUser]);

  return null;
}
