import { SkeletonCard } from '@/components/skeletons/SkeletonCard';
import { SkeletonText } from '@/components/skeletons/SkeletonText';

const KPI_COUNT = 15;

export function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-2 flex flex-col flex-1" aria-busy="true" aria-label="Loading dashboard">
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {Array.from({ length: KPI_COUNT }).map((_, index) => (
          <SkeletonCard key={`dashboard-kpi-${index}`} />
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-4 gap-2 items-stretch">
        <SkeletonText className="premium-card premium-shadow h-72 rounded-[1.25rem] lg:col-span-2" />
        <SkeletonText className="premium-card premium-shadow h-72 rounded-[1.25rem]" />
        <SkeletonText className="premium-card premium-shadow h-72 rounded-[1.25rem]" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonText key={`dashboard-panel-${index}`} className="premium-card premium-shadow min-h-[220px] rounded-[1.25rem] lg:col-span-1" />
        ))}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <SkeletonText key={`dashboard-progress-${index}`} className="premium-card premium-shadow min-h-[160px] rounded-[1.25rem]" />
        ))}
      </section>
    </div>
  );
}
