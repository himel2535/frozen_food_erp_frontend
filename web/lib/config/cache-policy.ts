import type { ApiModule } from '@/lib/config/data-source';

/** Rarely-changing master data — long client staleTime. */
export const MASTER_DATA_MODULES = ['categories', 'units', 'warehouses'] as const;

export type MasterDataModule = (typeof MASTER_DATA_MODULES)[number];

/** Report / accounting modules — show cached data, revalidate in background. */
export const REPORT_MODULES = ['balanceSheet', 'trialBalance', 'profitLoss', 'salarySheet'] as const;

/** Stock / POS modules — shorter TTL for near-real-time data. */
export const REALTIME_MODULES = ['stockIn', 'stockOut', 'pos'] as const;

export const MASTER_DATA_TTL_MS = 5 * 60 * 1000;
export const REPORT_TTL_MS = 2 * 60 * 1000;
export const STANDARD_TTL_MS = 60_000;
export const REALTIME_TTL_MS = 15_000;
/** @deprecated Use tier-specific TTLs via cacheTtlForModule */
export const TABLE_TTL_MS = STANDARD_TTL_MS;
export const DEFAULT_CACHE_TTL_MS = 10_000;

const MASTER_DATA_SET = new Set<string>(MASTER_DATA_MODULES);
const REPORT_SET = new Set<string>(REPORT_MODULES);
const REALTIME_SET = new Set<string>(REALTIME_MODULES);

export function isMasterDataModule(mod: ApiModule): mod is MasterDataModule {
  return MASTER_DATA_SET.has(mod);
}

export function isReportModule(mod: ApiModule): boolean {
  return REPORT_SET.has(mod);
}

export function cacheTtlForModule(mod: ApiModule): number {
  if (isMasterDataModule(mod)) return MASTER_DATA_TTL_MS;
  if (isReportModule(mod)) return REPORT_TTL_MS;
  if (REALTIME_SET.has(mod)) return REALTIME_TTL_MS;
  return STANDARD_TTL_MS;
}
