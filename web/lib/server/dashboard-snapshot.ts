import type { ApiModuleSnapshot } from '@/lib/server/fetch-modules';
import { fetchServerDashboardSummary } from '@/lib/server/fetch-resource-list';
import type { DashboardSummary } from '@/lib/services/api-resource-service';

export type DashboardServerPayload = {
  summary: DashboardSummary | null;
  modules: ApiModuleSnapshot;
};

/** KPI only — chart modules load on the client so login → dashboard is not blocked on 6 list fetches. */
export async function fetchDashboardSnapshot(revalidateSeconds = 30): Promise<DashboardServerPayload> {
  const summary = await fetchServerDashboardSummary(revalidateSeconds);
  return { summary, modules: {} };
}
