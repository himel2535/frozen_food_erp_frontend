'use client';

import { useMemo } from 'react';
import { type ApiModule, isModuleApiMode } from '@/lib/config/data-source';
import { usePaginatedApiResource } from '@/hooks/use-paginated-api-resource';
import { isModuleBootLoading, pickApiListRows } from '@/lib/ui/kpi-loading';

/** Standard list-page API hook — server pagination + empty rows until initialized. */
export function useModuleApiList<T extends Record<string, unknown>>(
  module: ApiModule,
  mapRow: (doc: Record<string, unknown>) => Record<string, unknown>,
  localRows: T[],
  pageSize = 25,
) {
  const apiMode = isModuleApiMode(module);
  const store = usePaginatedApiResource(module, mapRow, { pageSize });
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
