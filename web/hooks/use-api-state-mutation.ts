'use client';

import { useCallback } from 'react';
import type { ApiModule } from '@/lib/config/data-source';
import { isModuleApiMode } from '@/lib/config/data-source';
import { useApiResourceStore } from '@/hooks/use-api-resource-store';
import { mapGenericApiRow, mapGenericPayloadToApi } from '@/lib/services/generic-api-mapper';
import type { AppState } from '@/lib/state/types';

type MutatorResult = { ok: boolean; error?: string };

/**
 * Run a legacy service mutator on a cloned AppState backed by live API rows,
 * then push the changed entity back to MongoDB.
 */
export function useApiStateMutation(module: ApiModule, stateKey: keyof AppState) {
  const enabled = isModuleApiMode(module);
  const store = useApiResourceStore(module, mapGenericApiRow);

  const run = useCallback(
    async (
      base: AppState,
      entityId: string,
      mutator: (state: AppState) => MutatorResult,
    ): Promise<MutatorResult> => {
      if (!enabled) return { ok: false, error: 'API mode off' };
      const rows = store.rows.map((r) => ({ ...r }));
      const pseudo = { ...base, [stateKey]: rows } as AppState;
      const result = mutator(pseudo);
      if (!result.ok) return result;
      const updated = (pseudo[stateKey] as Record<string, unknown>[]).find(
        (r) => String(r.id) === entityId,
      );
      if (!updated) return { ok: false, error: 'Updated record not found' };
      const sync = await store.update(entityId, mapGenericPayloadToApi(updated));
      if (!sync.ok) return { ok: false, error: 'error' in sync ? String(sync.error) : 'Sync failed' };
      return { ok: true };
    },
    [enabled, store, stateKey],
  );

  const create = useCallback(
    async (body: Record<string, unknown>) => {
      if (!enabled) return { ok: false as const, error: 'API mode off' };
      return store.create(mapGenericPayloadToApi(body));
    },
    [enabled, store],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!enabled) return { ok: false as const, error: 'API mode off' };
      return store.remove(id);
    },
    [enabled, store],
  );

  return { enabled, store, run, create, remove };
}
