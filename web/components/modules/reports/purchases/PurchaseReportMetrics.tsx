'use client';

import { ModuleKpiSection } from '@/components/shared/ModuleKpiSection';
import type { KpiCardItem } from '@/components/shared/KpiCards';

export function PurchaseReportMetrics({ items, loading = false }: { items: KpiCardItem[]; loading?: boolean }) {
  return <ModuleKpiSection items={items} loading={loading} />;
}
