import { DashboardLoadingSkeleton } from '@/components/skeletons/DashboardLoadingSkeleton';

/** Static English labels so LCP text paints during RSC loading — no API wait. */
const KPI_LCP_LABELS = [
  'Total Revenue',
  'Customer Due',
  'Low Stock Alert',
  'Pending Sales',
  'Open Leads',
  'Pending Production',
];

export default function DashboardLoading() {
  return <DashboardLoadingSkeleton kpiLabels={KPI_LCP_LABELS} />;
}
