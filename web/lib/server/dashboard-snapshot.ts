import type { ApiModule } from '@/lib/config/data-source';
import { fetchModulesSnapshot, type ApiModuleSnapshot } from '@/lib/server/fetch-modules';
import { fetchServerDashboardSummary } from '@/lib/server/fetch-resource-list';
import type { DashboardSummary } from '@/lib/services/api-resource-service';
import { LOOKUP_LIST_PAGE_SIZE } from '@/lib/services/api-pagination-types';

/** Lightweight modules for charts/panels — not full dashboard bulk load. */
export const DASHBOARD_CHART_MODULES: readonly ApiModule[] = [
  'salesOrders',
  'invoices',
  'products',
  'pos',
  'projects',
  'auditLogs',
] as const;

export type DashboardServerPayload = {
  summary: DashboardSummary | null;
  modules: ApiModuleSnapshot;
};

export async function fetchDashboardSnapshot(revalidateSeconds = 30): Promise<DashboardServerPayload> {
  const [summary, modules] = await Promise.all([
    fetchServerDashboardSummary(revalidateSeconds),
    fetchModulesSnapshot(DASHBOARD_CHART_MODULES, revalidateSeconds, LOOKUP_LIST_PAGE_SIZE),
  ]);
  return { summary, modules };
}
