import { cookies } from 'next/headers';
import type { ApiModuleSnapshot } from '@/lib/server/fetch-modules';
import { fetchServerDashboardSummary } from '@/lib/server/fetch-resource-list';
import type { DashboardSummary } from '@/lib/services/api-resource-service';

export type DashboardServerPayload = {
  summary: DashboardSummary | null;
  modules: ApiModuleSnapshot;
};

/** Don't block first HTML on a slow/unauthenticated summary fetch. */
const SSR_KPI_BUDGET_MS = 600;

/** KPI only — extra legs and chart modules load on the client. */
export async function fetchDashboardSnapshot(): Promise<DashboardServerPayload> {
  const token = (await cookies()).get('token')?.value;
  if (!token) {
    return { summary: null, modules: {} };
  }

  try {
    const summary = await fetchServerDashboardSummary({
      scope: 'kpi',
      timeoutMs: SSR_KPI_BUDGET_MS,
    });
    return { summary, modules: {} };
  } catch {
    return { summary: null, modules: {} };
  }
}
