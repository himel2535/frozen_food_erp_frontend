'use client';

import { KpiCards, type KpiCardItem } from '@/components/shared/KpiCards';
import { CR_GRID_5 } from '@/components/modules/reports/customers/customer-report-styles';

export function CustomerReportMetrics({ items }: { items: KpiCardItem[] }) {
  return <KpiCards items={items} gridClassName={CR_GRID_5} />;
}
