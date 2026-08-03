'use client';

import { KpiCards, type KpiCardItem } from '@/components/shared/KpiCards';
import { PR_GRID_5 } from '@/components/modules/reports/purchases/purchase-report-styles';

export function PurchaseReportMetrics({ items }: { items: KpiCardItem[] }) {
  return <KpiCards items={items} gridClassName={PR_GRID_5} />;
}
