'use client';

import { KpiCards, type KpiCardItem } from '@/components/shared/KpiCards';

export function FinancialReportMetrics({ items }: { items: KpiCardItem[] }) {
  return <KpiCards items={items} />;
}
