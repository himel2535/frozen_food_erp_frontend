'use client';

import dynamic from 'next/dynamic';
import { DashboardLoadingSkeleton } from '@/components/skeletons/DashboardLoadingSkeleton';
import { DASHBOARD_KPI_LCP_LABELS } from '@/lib/ui/dashboard-kpi';

const DashboardView = dynamic(
  () =>
    import('@/components/modules/DashboardView').then((m) => {
      if (typeof performance !== 'undefined') {
        performance.mark('dashboard-view-chunk-evaluated');
      }
      return m.DashboardView;
    }),
  {
    ssr: false,
    loading: () => <DashboardLoadingSkeleton kpiLabels={[...DASHBOARD_KPI_LCP_LABELS]} />,
  },
);

export function DashboardViewLazy() {
  return <DashboardView />;
}
