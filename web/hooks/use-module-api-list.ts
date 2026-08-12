'use client';

import { useMemo } from 'react';
import { type ApiModule, isModuleApiMode } from '@/lib/config/data-source';
import { useApiResourceStore } from '@/hooks/use-api-resource-store';
import { isModuleBootLoading, pickApiListRows } from '@/lib/ui/kpi-loading';

/** Standard list-page API hook — reports-style boot gate + empty rows until initialized. */
export function useModuleApiList<T extends Record<string, unknown>>(
  module: ApiModule,
  mapRow: (doc: Record<string, unknown>) => Record<string, unknown>,
  localRows: T[],
) {
  const apiMode = isModuleApiMode(module);
  const store = useApiResourceStore(module, mapRow);
  const bootLoading = isModuleBootLoading(apiMode, store.initialized);
  const rows = useMemo(
    () => pickApiListRows(apiMode, store.initialized, store.rows as T[], localRows),
    [apiMode, store.initialized, store.rows, localRows],
  );

  return {
    ...store,
    apiMode,
    bootLoading,
    rows,
  };
}
