'use client';

import { useLayoutEffect, useRef } from 'react';
import { useAppStore } from '@/lib/state/app-store';
import {
  API_RESOURCE_PATHS,
  type ApiModule,
} from '@/lib/config/data-source';
import { applyApiDataToAppState } from '@/lib/services/api-app-state-mapper';
import { setApiListCache } from '@/lib/services/api-list-cache';
import type { ApiModuleSnapshot } from '@/lib/server/fetch-modules';

/** Seeds client cache + Zustand from a server-fetched API snapshot (no duplicate initial fetch). */
export function ServerSnapshotHydrator({ snapshot }: { snapshot: ApiModuleSnapshot | null }) {
  const appliedRef = useRef(false);

  useLayoutEffect(() => {
    if (!snapshot || appliedRef.current) return;
    
    const { replaceAppState, appState, apiDataReady } = useAppStore.getState();
    
    // Do not overwrite client state or cache with server snapshot if client has already fetched its own data.
    // This prevents empty SSR payloads (due to lack of auth token on server) from wiping out the real data.
    if (apiDataReady) return;
    
    appliedRef.current = true;

    for (const [mod, docs] of Object.entries(snapshot) as [ApiModule, Record<string, unknown>[]][]) {
      const path = API_RESOURCE_PATHS[mod];
      if (path && docs) {
        setApiListCache(path, docs);
      }
    }

    replaceAppState(applyApiDataToAppState(appState, snapshot));
  }, [snapshot]);

  return null;
}
