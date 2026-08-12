import type { ApiModule } from '@/lib/config/data-source';
import { fetchModulesSnapshot, type ApiModuleSnapshot } from '@/lib/server/fetch-modules';

/** Modules required to compute dashboard KPI cards and charts on first paint. */
export const DASHBOARD_API_MODULES: readonly ApiModule[] = [
  'customers',
  'suppliers',
  'salesOrders',
  'invoices',
  'leads',
  'rawMaterials',
  'semiFinishedProducts',
  'finishedGoods',
  'productionOrders',
  'purchaseOrders',
  'projects',
] as const;

export async function fetchDashboardSnapshot(revalidateSeconds = 30): Promise<ApiModuleSnapshot> {
  return fetchModulesSnapshot(DASHBOARD_API_MODULES, revalidateSeconds);
}
