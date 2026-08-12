'use client';

import { KpiCards, type KpiCardItem } from '@/components/shared/KpiCards';
import { MODULE_KPI_SECTION } from '@/lib/ui/module-chrome-styles';
import { resolveKpiSlotCount } from '@/lib/ui/module-kpi-layout';

export function ModuleKpiSection({
  items,
  gridClassName,
  loading = false,
  kpiCount,
  className = '',
}: {
  items: KpiCardItem[];
  gridClassName?: string;
  loading?: boolean;
  kpiCount?: number;
  className?: string;
}) {
  const slots = resolveKpiSlotCount(loading, items.length, kpiCount);
  if (!loading && items.length === 0) return null;

  return (
    <div
      className={`${MODULE_KPI_SECTION} min-h-[4.5rem] ${loading ? 'module-kpi-section--loading' : ''} ${className}`.trim()}
      aria-busy={loading || undefined}
    >
      <KpiCards
        items={items}
        gridClassName={gridClassName}
        loading={loading}
        kpiCount={kpiCount ?? (slots > 0 ? slots : undefined)}
      />
    </div>
  );
}
