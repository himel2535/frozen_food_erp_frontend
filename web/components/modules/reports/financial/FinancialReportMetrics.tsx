'use client';

import { KpiCards, type KpiCardItem } from '@/components/shared/KpiCards';
import { FR_GRID_3 } from '@/components/modules/reports/financial/financial-report-styles';

export function FinancialReportMetrics({ items }: { items: KpiCardItem[] }) {
  return <KpiCards items={items} gridClassName={FR_GRID_3} />;
}
