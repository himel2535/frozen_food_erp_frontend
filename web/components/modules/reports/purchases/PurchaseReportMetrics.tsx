'use client';

import { ModuleKpiSection } from '@/components/shared/ModuleKpiSection';
import type { KpiCardItem } from '@/components/shared/KpiCards';

export function PurchaseReportMetrics({ items }: { items: KpiCardItem[] }) {
  return <ModuleKpiSection items={items} />;
}
