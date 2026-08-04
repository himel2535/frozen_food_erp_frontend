import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { SkeletonBlock } from '@/components/shared/SkeletonBlock';

const TABLE_COLUMNS = 5;
const TABLE_ROWS = 5;
const KPI_COUNT = 2;

function ModuleHeaderSkeleton() {
  return (
    <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <SkeletonBlock className="w-8 h-8 rounded-lg shrink-0" />
        <div className="space-y-1 min-h-[44px] min-w-0 flex-1">
          <SkeletonBlock className="h-7 w-48 max-w-full rounded-lg" />
          <SkeletonBlock className="h-4 w-72 max-w-full rounded-md" />
        </div>
      </div>
      <div className="flex gap-2 shrink-0 self-start min-w-0 xl:min-w-[120px]">
        <SkeletonBlock className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  );
}

function ModuleSearchCardSkeleton() {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/80 premium-shadow space-y-4">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
        <SkeletonBlock className="h-10 flex-1 max-w-md rounded-xl" />
        <div className="flex items-center gap-2 flex-wrap">
          <SkeletonBlock className="h-9 w-16 rounded-xl" />
          <SkeletonBlock className="h-9 w-20 rounded-xl" />
          <SkeletonBlock className="h-9 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function ModuleKpiSkeleton() {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {Array.from({ length: KPI_COUNT }).map((_, index) => (
        <div
          key={`kpi-${index}`}
          className="premium-card premium-shadow p-3.5 flex items-center justify-between gap-3 min-h-[72px]"
        >
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <SkeletonBlock className="h-3 w-20 rounded-md" />
            <SkeletonBlock className="h-6 w-24 rounded-md" />
          </div>
          <SkeletonBlock className="h-10 w-10 rounded-xl shrink-0" />
        </div>
      ))}
    </section>
  );
}

function ModuleTableSkeleton() {
  return (
    <div className="app-table flex-1 min-h-[280px]">
      <div className="app-table-scroll">
        <table className="app-table-element">
          <thead>
            <tr>
              {Array.from({ length: TABLE_COLUMNS }).map((_, index) => (
                <th key={`head-${index}`} className="app-table-th app-table-align-left">
                  <SkeletonBlock className="h-3.5 w-16 rounded-md" />
                </th>
              ))}
              <th className="app-table-th app-table-th-actions app-table-align-center">
                <SkeletonBlock className="h-3.5 w-12 mx-auto rounded-md" />
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: TABLE_ROWS }).map((_, rowIndex) => (
              <tr key={`row-${rowIndex}`} className="app-table-tr">
                {Array.from({ length: TABLE_COLUMNS }).map((_, colIndex) => (
                  <td key={`cell-${rowIndex}-${colIndex}`} className="app-table-td app-table-align-left">
                    <div className="app-table-skeleton app-skeleton" />
                  </td>
                ))}
                <td className="app-table-td app-table-td-actions app-table-align-center">
                  <div className="app-table-skeleton app-skeleton w-16 mx-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Matches ListToolbar + DedicatedModule order: header → search card → KPIs → table. */
export function ModuleListSkeleton() {
  return (
    <div className={MODULE_LIST_SHELL} aria-busy="true" aria-label="Loading module">
      <ModuleHeaderSkeleton />
      <ModuleSearchCardSkeleton />
      <ModuleKpiSkeleton />
      <ModuleTableSkeleton />
    </div>
  );
}
