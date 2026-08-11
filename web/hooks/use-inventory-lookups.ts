'use client';

import { useApiResourceStore } from '@/hooks/use-api-resource-store';
import {
  isModuleApiMode,
  type ApiModule,
} from '@/lib/config/data-source';
import {
  mapApiCategoryRow,
  mapApiRawMaterialRow,
  mapApiSemiFinishedRow,
  mapApiFinishedGoodRow,
  mapApiUnitRow,
  mapApiWarehouseRow,
} from '@/lib/services/inventory-api-mappers';
import { mapApiProductRow } from '@/lib/services/entity-api-mappers';
import { useCallback } from 'react';

/** Shared inventory master data from MongoDB (categories, units, warehouses, products, RM/Semi/FG). */
export function useInventoryLookups() {
  const categoriesStore = useApiResourceStore('categories', mapApiCategoryRow);
  const unitsStore = useApiResourceStore('units', mapApiUnitRow);
  const warehousesStore = useApiResourceStore('warehouses', mapApiWarehouseRow);
  const productsStore = useApiResourceStore('products', mapApiProductRow);
  const rawMaterialsStore = useApiResourceStore('rawMaterials', mapApiRawMaterialRow);
  const semiFinishedStore = useApiResourceStore('semiFinishedProducts', mapApiSemiFinishedRow);
  const finishedGoodsStore = useApiResourceStore('finishedGoods', mapApiFinishedGoodRow);

  const apiMode =
    isModuleApiMode('categories')
    || isModuleApiMode('units')
    || isModuleApiMode('warehouses')
    || isModuleApiMode('products')
    || isModuleApiMode('rawMaterials')
    || isModuleApiMode('semiFinishedProducts')
    || isModuleApiMode('finishedGoods');

  const loading =
    categoriesStore.loading
    || unitsStore.loading
    || warehousesStore.loading
    || productsStore.loading
    || rawMaterialsStore.loading
    || semiFinishedStore.loading
    || finishedGoodsStore.loading;

  const error =
    categoriesStore.error
    || unitsStore.error
    || warehousesStore.error
    || productsStore.error
    || rawMaterialsStore.error
    || semiFinishedStore.error
    || finishedGoodsStore.error;

  const reload = useCallback(async () => {
    await Promise.all([
      categoriesStore.reload(),
      unitsStore.reload(),
      warehousesStore.reload(),
      productsStore.reload(),
      rawMaterialsStore.reload(),
      semiFinishedStore.reload(),
      finishedGoodsStore.reload(),
    ]);
  }, [
    categoriesStore.reload,
    unitsStore.reload,
    warehousesStore.reload,
    productsStore.reload,
    rawMaterialsStore.reload,
    semiFinishedStore.reload,
    finishedGoodsStore.reload,
  ]);

  return {
    apiMode,
    loading,
    error,
    reload,
    categories: categoriesStore.rows,
    units: unitsStore.rows,
    warehouses: warehousesStore.rows,
    products: productsStore.rows,
    rawMaterials: rawMaterialsStore.rows,
    semiFinishedProducts: semiFinishedStore.rows,
    finishedGoods: finishedGoodsStore.rows,
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

/** Resolve any inventory item name (product, RM, semi, FG). */
export function resolveInventoryItemName(
  lookups: ReturnType<typeof useInventoryLookups>,
  id: string,
): string {
  const pools = [
    lookups.products,
    lookups.rawMaterials,
    lookups.semiFinishedProducts,
    lookups.finishedGoods,
  ];
  for (const pool of pools) {
    const hit = pool.find((row) => String(row.id) === id || String(row.legacyId) === id);
    if (hit) return String(hit.name);
  }
  return id;
}
