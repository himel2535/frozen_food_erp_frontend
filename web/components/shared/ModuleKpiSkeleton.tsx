import { MODULE_KPI_SECTION } from '@/lib/ui/module-chrome-styles';
import { KpiCardSkeleton } from '@/components/shared/KpiCardSkeleton';
import { resolveKpiGridClassName, resolveKpiSlotCount } from '@/lib/ui/module-kpi-layout';

export function ModuleKpiSkeleton({
  count,
  gridClassName,
}: {
  count: number;
  gridClassName?: string;
}) {
  const grid = resolveKpiGridClassName(count, gridClassName);
  const slots = resolveKpiSlotCount(true, 0, count);

  return (
    <div className={MODULE_KPI_SECTION} aria-busy="true" aria-label="Loading metrics">
      <section className={grid}>
        {Array.from({ length: slots }).map((_, index) => (
          <KpiCardSkeleton key={`kpi-sk-${index}`} />
        ))}
      </section>
    </div>
  );
}
