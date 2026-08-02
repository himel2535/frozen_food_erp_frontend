import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { SkeletonBlock } from '@/components/shared/SkeletonBlock';

const TABLE_COLUMNS = 5;
const TABLE_ROWS = 5;

export function ModuleListSkeleton() {
  return (
    <div className={MODULE_LIST_SHELL} aria-busy="true" aria-label="Loading module">
      <div className="space-y-1">
        <SkeletonBlock className="h-7 w-48 max-w-full rounded-lg" />
        <SkeletonBlock className="h-4 w-72 max-w-full rounded-md" />
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
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

      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <SkeletonBlock className="h-10 flex-1 max-w-md rounded-xl" />
        <div className="flex items-center gap-2">
          <SkeletonBlock className="h-9 w-24 rounded-xl" />
          <SkeletonBlock className="h-9 w-24 rounded-xl" />
          <SkeletonBlock className="h-9 w-28 rounded-xl" />
        </div>
      </div>

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
    </div>
  );
}
