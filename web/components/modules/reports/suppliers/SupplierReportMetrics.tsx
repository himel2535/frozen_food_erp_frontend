'use client';

import { KpiCards, type KpiCardItem } from '@/components/shared/KpiCards';

export function SupplierReportMetrics({ items }: { items: KpiCardItem[] }) {
  return <KpiCards items={items} />;
}
