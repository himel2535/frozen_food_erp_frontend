'use client';

import { KpiCards, type KpiCardItem } from '@/components/shared/KpiCards';
import { SR_GRID_5 } from '@/components/modules/reports/suppliers/supplier-report-styles';

export function SupplierReportMetrics({ items }: { items: KpiCardItem[] }) {
  return <KpiCards items={items} gridClassName={SR_GRID_5} />;
}
