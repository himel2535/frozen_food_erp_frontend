'use client';

import { KpiCards, type KpiCardItem } from '@/components/shared/KpiCards';
import { IR_GRID_4 } from '@/components/modules/reports/inventory/inventory-report-styles';

export function InventoryReportMetrics({ items }: { items: KpiCardItem[] }) {
  return <KpiCards items={items} gridClassName={IR_GRID_4} />;
}
