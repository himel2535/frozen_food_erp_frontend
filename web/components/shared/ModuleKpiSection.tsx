'use client';

import { KpiCards, type KpiCardItem } from '@/components/shared/KpiCards';
import { MODULE_KPI_SECTION } from '@/lib/ui/module-chrome-styles';

export function ModuleKpiSection({
  items,
  gridClassName,
  loading = false,
  className = '',
}: {
  items: KpiCardItem[];
  gridClassName?: string;
  loading?: boolean;
  className?: string;
}) {
  if (!loading && items.length === 0) return null;

  return (
    <div className={`${MODULE_KPI_SECTION} ${className}`.trim()}>
      <KpiCards items={items} gridClassName={gridClassName} loading={loading} />
    </div>
  );
}
