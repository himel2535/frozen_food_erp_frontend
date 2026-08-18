'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/state/app-store';
import {
  API_BOOT_MODULES,
  API_RESOURCE_PATHS,
  DASHBOARD_CRITICAL_BOOT_MODULES,
  DASHBOARD_DEFERRED_BOOT_MODULES,
  isMongoDbBackend,
  type ApiModule,
} from '@/lib/config/data-source';
import { fetchResourcePage } from '@/lib/services/api-resource-service';
import { setApiListCache } from '@/lib/services/api-list-cache';
import { applyApiDataToAppState } from '@/lib/services/api-app-state-mapper';
import { onApiMutation } from '@/lib/services/api-sync-events';
import { DEFAULT_LIST_PAGE_SIZE } from '@/lib/services/api-pagination-types';
import { isDashboardPath } from '@/lib/ui/dashboard-kpi';

const USE_API = isMongoDbBackend();

async function fetchModulesPageSafe(mods: readonly ApiModule[]) {
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

function scheduleIdle(fn: () => void): () => void {
  if (typeof requestIdleCallback === 'function') {
    const id = requestIdleCallback(fn, { timeout: 2000 });
    return () => cancelIdleCallback(id);
  }
  const timer = window.setTimeout(fn, 0);
  return () => window.clearTimeout(timer);
}

/** Seeds Zustand with first-page API data — no full-list background sweep. */
export function ApiStateHydrator() {
  const pathname = usePathname();
  const authUser = useAppStore((s) => s.authUser);
  const authReady = useAppStore((s) => s.authReady);
  const setApiDataReady = useAppStore((s) => s.setApiDataReady);
  const bootDoneRef = useRef(false);

  useEffect(() => {
    if (!USE_API || !authReady || !authUser) return;

    let cancelled = false;
    let cancelIdle = () => {};
    const delayMs = isDashboardPath(pathname) ? 1200 : 0;
    const dashboard = isDashboardPath(pathname);

    const runBoot = async () => {
      try {
        if (dashboard) {
          const critical = await fetchModulesPageSafe(DASHBOARD_CRITICAL_BOOT_MODULES);
          if (cancelled) return;
          mergeApiSnapshot(critical);
          setApiDataReady(true);
          bootDoneRef.current = true;
          cancelIdle = scheduleIdle(() => {
            if (cancelled) return;
            void fetchModulesPageSafe(DASHBOARD_DEFERRED_BOOT_MODULES).then((partial) => {
              if (cancelled) return;
              mergeApiSnapshot(partial);
            });
          });
          return;
        }

        const boot = await fetchModulesPageSafe(API_BOOT_MODULES);
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
    };

    const timer = window.setTimeout(() => {
      void runBoot();
    }, delayMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      cancelIdle();
    };
  }, [authReady, authUser, setApiDataReady, pathname]);

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
