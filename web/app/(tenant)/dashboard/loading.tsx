import { DashboardLoadingSkeleton } from '@/components/skeletons/DashboardLoadingSkeleton';
import { DASHBOARD_KPI_LCP_LABELS } from '@/lib/ui/dashboard-kpi';

/** Static English labels so LCP text paints during RSC loading — no API wait. */
export default function DashboardLoading() {
  return <DashboardLoadingSkeleton kpiLabels={[...DASHBOARD_KPI_LCP_LABELS]} />;
}
