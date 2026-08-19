'use client';

import dynamic from 'next/dynamic';
import { DashboardLoadingSkeleton } from '@/components/skeletons/DashboardLoadingSkeleton';
import { DASHBOARD_KPI_LCP_LABELS } from '@/lib/ui/dashboard-kpi';
import type { DashboardServerPayload } from '@/lib/server/dashboard-snapshot';

const DashboardView = dynamic(
  () =>
    import('@/components/modules/DashboardView').then((m) => {
      if (typeof performance !== 'undefined') {
        performance.mark('dashboard-view-chunk-evaluated');
      }
      return m.DashboardView;
    }),
  {
    loading: () => <DashboardLoadingSkeleton kpiLabels={[...DASHBOARD_KPI_LCP_LABELS]} />,
  },
);

type DashboardViewLazyProps = {
  serverPayload?: DashboardServerPayload | null;
};

export function DashboardViewLazy({ serverPayload = null }: DashboardViewLazyProps) {
  return <DashboardView serverPayload={serverPayload} />;
}
