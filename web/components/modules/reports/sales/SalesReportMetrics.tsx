'use client';

import { KpiCards, type KpiCardItem } from '@/components/shared/KpiCards';
import { SR_GRID_5 } from '@/components/modules/reports/sales/sales-report-styles';

export function SalesReportMetrics({ items }: { items: KpiCardItem[] }) {
  return <KpiCards items={items} gridClassName={SR_GRID_5} />;
}
