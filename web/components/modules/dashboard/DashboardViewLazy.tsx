'use client';

import dynamic from 'next/dynamic';
import { DashboardLoadingSkeleton } from '@/components/skeletons/DashboardLoadingSkeleton';

const KPI_LCP_LABELS = [
  'Total Revenue',
  'Customer Due',
  'Low Stock Alert',
  'Pending Sales',
  'Open Leads',
  'Pending Production',
];

const DashboardView = dynamic(
  () => import('@/components/modules/DashboardView').then((m) => m.DashboardView),
  {
    ssr: false,
    loading: () => <DashboardLoadingSkeleton kpiLabels={KPI_LCP_LABELS} />,
  },
);

export function DashboardViewLazy() {
  return <DashboardView />;
}
