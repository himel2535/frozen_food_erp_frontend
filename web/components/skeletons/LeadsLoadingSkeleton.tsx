import { MODULE_FILTER_BAR, MODULE_FILTER_BAR_STACKED } from '@/lib/ui/module-chrome-styles';
import { SkeletonCard } from '@/components/skeletons/SkeletonCard';
import { SkeletonTableRow } from '@/components/skeletons/SkeletonTableRow';
import { SkeletonText } from '@/components/skeletons/SkeletonText';

const KPI_COUNT = 5;
const TABLE_COLUMNS = 8;
const TABLE_ROWS = 8;

export function LeadsLoadingSkeleton() {
  return (
    <div className="flex-1 min-h-[360px] space-y-2 flex flex-col" aria-busy="true" aria-label="Loading leads">
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {Array.from({ length: KPI_COUNT }).map((_, index) => (
          <SkeletonCard key={`leads-kpi-${index}`} />
        ))}
      </section>

      <div className="premium-card premium-shadow rounded-xl border border-slate-200/80 p-4 space-y-3">
        <SkeletonText className="h-4 w-32" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonText key={`funnel-${index}`} className="h-8 flex-1 min-w-[80px] rounded-lg" />
          ))}
        </div>
      </div>

      <div className={`${MODULE_FILTER_BAR} ${MODULE_FILTER_BAR_STACKED}`}>
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
          <SkeletonText className="h-10 flex-1 max-w-md rounded-xl" />
          <div className="flex items-center gap-2 flex-wrap">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonText key={`filter-${index}`} className="h-9 w-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      <div className="premium-card premium-shadow rounded-xl border border-slate-200/80 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/80">
              {Array.from({ length: TABLE_COLUMNS }).map((_, index) => (
                <th key={`head-${index}`} className="px-3 py-3">
                  <SkeletonText className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: TABLE_ROWS }).map((_, index) => (
              <SkeletonTableRow key={`row-${index}`} columns={TABLE_COLUMNS} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
