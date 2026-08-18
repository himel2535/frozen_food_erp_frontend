'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/state/app-store';
import {
  API_RESOURCE_PATHS,
  DASHBOARD_CRITICAL_BOOT_MODULES,
  DASHBOARD_DEFERRED_BOOT_MODULES,
  isMongoDbBackend,
  type ApiModule,
} from '@/lib/config/data-source';
import {
  HYDRATION_CACHE_TTL_MS,
  resolveHydrationModules,
} from '@/lib/config/route-hydration-config';
import { fetchResourcePage } from '@/lib/services/api-resource-service';
import {
  getApiListCache,
  isApiListCacheFresh,
  setApiListCache,
} from '@/lib/services/api-list-cache';
import { applyApiDataToAppState } from '@/lib/services/api-app-state-mapper';
import { onApiMutation } from '@/lib/services/api-sync-events';
import { DEFAULT_LIST_PAGE_SIZE } from '@/lib/services/api-pagination-types';
import { isDashboardPath } from '@/lib/ui/dashboard-kpi';

const USE_API = isMongoDbBackend();

const HYDRATION_QUERY = { page: 1, limit: DEFAULT_LIST_PAGE_SIZE };

/** Session-scoped set of modules loaded or found in fresh cache. */
const sessionLoadedModules = new Set<ApiModule>();

function modulePath(mod: ApiModule): string | undefined {
  return API_RESOURCE_PATHS[mod];
}

function isModuleFresh(mod: ApiModule): boolean {
  const path = modulePath(mod);
  if (!path) return true;
  return isApiListCacheFresh(path, HYDRATION_QUERY, HYDRATION_CACHE_TTL_MS);
}

function readCachedModuleRows(mod: ApiModule): Record<string, unknown>[] | null {
  const path = modulePath(mod);
  if (!path) return null;
  return getApiListCache(path, HYDRATION_QUERY);
}

function filterModulesNeedingFetch(mods: readonly ApiModule[]): ApiModule[] {
  return mods.filter((mod) => modulePath(mod) && !isModuleFresh(mod));
}

function collectSnapshot(mods: readonly ApiModule[]): Partial<Record<ApiModule, Record<string, unknown>[]>> {
  const partial: Partial<Record<ApiModule, Record<string, unknown>[]>> = {};
  for (const mod of mods) {
    const rows = readCachedModuleRows(mod);
    if (rows) partial[mod] = rows;
  }
  return partial;
}

async function fetchModulesPageSafe(mods: readonly ApiModule[]) {
  const toFetch = filterModulesNeedingFetch(mods);
  const partial = collectSnapshot(mods);

  if (toFetch.length === 0) {
    for (const mod of mods) sessionLoadedModules.add(mod);
    return partial;
  }

  const results = await Promise.allSettled(
    toFetch.map(async (mod) => {
      const path = modulePath(mod)!;
      const { rows, meta } = await fetchResourcePage(path, HYDRATION_QUERY);
      setApiListCache(path, rows, HYDRATION_QUERY, meta);
      sessionLoadedModules.add(mod);
      return [mod, rows] as const;
    }),
  );

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

/** Route-aware hydration — fetches only modules required by the current page. */
export function ApiStateHydrator() {
  const pathname = usePathname();
  const authUser = useAppStore((s) => s.authUser);
  const authReady = useAppStore((s) => s.authReady);
  const setApiDataReady = useAppStore((s) => s.setApiDataReady);
  const apiDataReadyRef = useRef(false);

  useEffect(() => {
    if (!USE_API || !authReady || !authUser) return;

    let cancelled = false;
    let cancelIdle = () => {};
    const dashboard = isDashboardPath(pathname);
    const delayMs = dashboard ? 1200 : 0;

    const runHydration = async () => {
      try {
        if (dashboard) {
          const critical = await fetchModulesPageSafe(DASHBOARD_CRITICAL_BOOT_MODULES);
          if (cancelled) return;
          mergeApiSnapshot(critical);
          if (!apiDataReadyRef.current) {
            setApiDataReady(true);
            apiDataReadyRef.current = true;
          }
          cancelIdle = scheduleIdle(() => {
            if (cancelled) return;
            void fetchModulesPageSafe(DASHBOARD_DEFERRED_BOOT_MODULES).then((partial) => {
              if (cancelled) return;
              mergeApiSnapshot(partial);
            });
          });
          return;
        }

        const routeModules = resolveHydrationModules(pathname);
        if (routeModules.length === 0) {
          if (!apiDataReadyRef.current) {
            setApiDataReady(true);
            apiDataReadyRef.current = true;
          }
          return;
        }

        const partial = await fetchModulesPageSafe(routeModules);
        if (cancelled) return;
        mergeApiSnapshot(partial);
        if (!apiDataReadyRef.current) {
          setApiDataReady(true);
          apiDataReadyRef.current = true;
        }
      } catch {
        if (!cancelled && !apiDataReadyRef.current) {
          setApiDataReady(true);
          apiDataReadyRef.current = true;
        }
      }
    };

    const timer = window.setTimeout(() => {
      void runHydration();
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
      const targets = modules.filter(
        (mod): mod is ApiModule =>
          mod in API_RESOURCE_PATHS && sessionLoadedModules.has(mod as ApiModule),
      );
      if (!targets.length) return;
      void fetchModulesPageSafe(targets).then((partial) => mergeApiSnapshot(partial));
    });
  }, [authUser]);

  return null;
}
