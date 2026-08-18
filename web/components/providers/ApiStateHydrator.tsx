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
  resolveHydrationModules,
  resolveHydrationQuery,
} from '@/lib/config/route-hydration-config';
import { cacheTtlForModule } from '@/lib/config/cache-policy';
import { fetchResourcePage } from '@/lib/services/api-resource-service';
import {
  findCompatibleListCache,
  isLookupCacheFresh,
  getLookupCache,
  setApiListCache,
  setLookupCache,
} from '@/lib/services/api-list-cache';
import { applyApiDataToAppState } from '@/lib/services/api-app-state-mapper';
import { DEFAULT_LIST_PAGE_SIZE, type ApiListQuery } from '@/lib/services/api-pagination-types';
import { isDashboardPath } from '@/lib/ui/dashboard-kpi';

const USE_API = isMongoDbBackend();

const DASHBOARD_HYDRATION_QUERY: ApiListQuery = { page: 1, limit: DEFAULT_LIST_PAGE_SIZE };

function modulePath(mod: ApiModule): string | undefined {
  return API_RESOURCE_PATHS[mod];
}

function readCachedModuleRows(mod: ApiModule, query: ApiListQuery): Record<string, unknown>[] | null {
  const path = modulePath(mod);
  if (!path) return null;
  const ttl = cacheTtlForModule(mod);
  const hit = findCompatibleListCache(path, query, ttl);
  if (hit) return hit.docs;
  if ((query.page ?? 1) === 1 && isLookupCacheFresh(path, ttl)) {
    const lookup = getLookupCache(path);
    if (lookup) {
      const limit = query.limit ?? DEFAULT_LIST_PAGE_SIZE;
      return lookup.slice(0, limit);
    }
  }
  return null;
}

function isModuleFresh(mod: ApiModule, query: ApiListQuery): boolean {
  return readCachedModuleRows(mod, query) !== null;
}

function filterModulesNeedingFetch(
  mods: readonly ApiModule[],
  pathname: string,
): Array<{ mod: ApiModule; query: ApiListQuery }> {
  return mods
    .map((mod) => ({ mod, query: resolveHydrationQuery(mod, pathname) }))
    .filter(({ mod, query }) => modulePath(mod) && !isModuleFresh(mod, query));
}

function collectSnapshot(
  mods: readonly ApiModule[],
  pathname: string,
): Partial<Record<ApiModule, Record<string, unknown>[]>> {
  const partial: Partial<Record<ApiModule, Record<string, unknown>[]>> = {};
  for (const mod of mods) {
    const query = resolveHydrationQuery(mod, pathname);
    const rows = readCachedModuleRows(mod, query);
    if (rows) partial[mod] = rows;
  }
  return partial;
}

async function fetchModulesPageSafe(mods: readonly ApiModule[], pathname: string) {
  const toFetch = filterModulesNeedingFetch(mods, pathname);
  const partial = collectSnapshot(mods, pathname);

  if (toFetch.length === 0) {
    return partial;
  }

  const results = await Promise.allSettled(
    toFetch.map(async ({ mod, query }) => {
      const path = modulePath(mod)!;
      const { rows, meta } = await fetchResourcePage(path, query);
      setApiListCache(path, rows, query, meta);
      if (query.limit && query.limit >= 100) {
        setLookupCache(path, rows, meta);
      }
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

async function fetchDashboardModules(mods: readonly ApiModule[]) {
  const partial: Partial<Record<ApiModule, Record<string, unknown>[]>> = {};
  const toFetch: ApiModule[] = [];

  for (const mod of mods) {
    const path = modulePath(mod);
    if (!path) continue;
    const ttl = cacheTtlForModule(mod);
    const hit = findCompatibleListCache(path, DASHBOARD_HYDRATION_QUERY, ttl);
    if (hit) {
      partial[mod] = hit.docs;
    } else {
      toFetch.push(mod);
    }
  }

  if (toFetch.length === 0) return partial;

  const results = await Promise.allSettled(
    toFetch.map(async (mod) => {
      const path = modulePath(mod)!;
      const { rows, meta } = await fetchResourcePage(path, DASHBOARD_HYDRATION_QUERY);
      setApiListCache(path, rows, DASHBOARD_HYDRATION_QUERY, meta);
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

    const runHydration = async () => {
      try {
        if (dashboard) {
          const critical = await fetchDashboardModules(DASHBOARD_CRITICAL_BOOT_MODULES);
          if (cancelled) return;
          mergeApiSnapshot(critical);
          if (!apiDataReadyRef.current) {
            setApiDataReady(true);
            apiDataReadyRef.current = true;
          }
          cancelIdle = scheduleIdle(() => {
            if (cancelled) return;
            void fetchDashboardModules(DASHBOARD_DEFERRED_BOOT_MODULES).then((partial) => {
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

        const partial = await fetchModulesPageSafe(routeModules, pathname);
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

    void runHydration();

    return () => {
      cancelled = true;
      cancelIdle();
    };
  }, [authReady, authUser, setApiDataReady, pathname]);

  return null;
}
