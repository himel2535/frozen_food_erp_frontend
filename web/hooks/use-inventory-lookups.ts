'use client';

import { useApiResourceStore } from '@/hooks/use-api-resource-store';
import {
  isModuleApiMode,
  type ApiModule,
} from '@/lib/config/data-source';
import { LOOKUP_LIST_PAGE_SIZE } from '@/lib/services/api-pagination-types';
import {
  mapApiCategoryRow,
  mapApiUnitRow,
  mapApiWarehouseRow,
} from '@/lib/services/inventory-api-mappers';
import { useCallback } from 'react';

const LOOKUP_LIMIT = LOOKUP_LIST_PAGE_SIZE;

/** Lightweight master-data lookups (categories, units, warehouses only). */
export function useInventoryLookups() {
  const categoriesStore = useApiResourceStore('categories', mapApiCategoryRow, {
    pageOnly: true,
    lookupLimit: LOOKUP_LIMIT,
    cacheOnly: true,
  });
  const unitsStore = useApiResourceStore('units', mapApiUnitRow, {
    pageOnly: true,
    lookupLimit: LOOKUP_LIMIT,
    cacheOnly: true,
  });
  const warehousesStore = useApiResourceStore('warehouses', mapApiWarehouseRow, {
    pageOnly: true,
    lookupLimit: LOOKUP_LIMIT,
    cacheOnly: true,
  });

  const apiMode =
    isModuleApiMode('categories')
    || isModuleApiMode('units')
    || isModuleApiMode('warehouses');

  const loading =
    categoriesStore.loading
    || unitsStore.loading
    || warehousesStore.loading;

  const error =
    categoriesStore.error
    || unitsStore.error
    || warehousesStore.error;

  const reload = useCallback(async () => {
    await Promise.all([
      categoriesStore.reload(),
      unitsStore.reload(),
      warehousesStore.reload(),
    ]);
  }, [
    categoriesStore.reload,
    unitsStore.reload,
    warehousesStore.reload,
  ]);

  return {
    apiMode,
    loading,
    error,
    reload,
    categories: categoriesStore.rows,
    units: unitsStore.rows,
    warehouses: warehousesStore.rows,
  };
}

export function useInventoryModuleStore(
  module: ApiModule,
  mapRow: (doc: Record<string, unknown>) => Record<string, unknown>,
) {
  return useApiResourceStore(module, mapRow);
}

/** Resolve warehouse name from API or legacy id string. */
export function resolveWarehouseName(
  warehouses: Record<string, unknown>[],
  id: string,
): string {
  const wh = warehouses.find((w) => String(w.id) === id || String(w.legacyId) === id);
  return wh ? String(wh.name) : id;
}

/** Resolve product name from API rows. */
export function resolveProductName(
  products: Record<string, unknown>[],
  id: string,
): string {
  const p = products.find((row) => String(row.id) === id || String(row.legacyId) === id);
  return p ? String(p.name) : id;
}

/** Resolve any inventory item name from a pool of rows. */
export function resolveInventoryItemName(
  pools: Record<string, unknown>[][],
  id: string,
): string {
  for (const pool of pools) {
    const hit = pool.find((row) => String(row.id) === id || String(row.legacyId) === id);
    if (hit) return String(hit.name);
  }
  return id;
}
