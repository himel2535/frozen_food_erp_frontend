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
    appliedRef.current = true;

    for (const [mod, docs] of Object.entries(snapshot) as [ApiModule, Record<string, unknown>[]][]) {
      const path = API_RESOURCE_PATHS[mod];
      if (path && docs) {
        setApiListCache(path, docs);
      }
    }

    const { replaceAppState, appState } = useAppStore.getState();
    replaceAppState(applyApiDataToAppState(appState, snapshot));
  }, [snapshot]);

  return null;
}
