import type { ApiModule } from '@/lib/config/data-source';

/** Rarely-changing master data — long client staleTime. */
export const MASTER_DATA_MODULES = ['categories', 'units', 'warehouses'] as const;

export type MasterDataModule = (typeof MASTER_DATA_MODULES)[number];

export const MASTER_DATA_TTL_MS = 5 * 60 * 1000;
export const TABLE_TTL_MS = 15_000;
export const DEFAULT_CACHE_TTL_MS = 10_000;

const MASTER_DATA_SET = new Set<string>(MASTER_DATA_MODULES);

export function isMasterDataModule(mod: ApiModule): mod is MasterDataModule {
  return MASTER_DATA_SET.has(mod);
}

export function cacheTtlForModule(mod: ApiModule): number {
  if (isMasterDataModule(mod)) return MASTER_DATA_TTL_MS;
  return TABLE_TTL_MS;
}
