'use client';

import { KpiCards, type KpiCardItem } from '@/components/shared/KpiCards';
import { HR_GRID_2 } from '@/components/modules/reports/hr/hr-report-styles';

export function HrReportMetrics({ items }: { items: KpiCardItem[] }) {
  return <KpiCards items={items} gridClassName={HR_GRID_2} />;
}
