import { SkeletonBlock } from '@/components/shared/SkeletonBlock';

export type ModuleTableSkeletonProps = {
  columns?: number;
  rows?: number;
  hasActions?: boolean;
  className?: string;
};

/** List-page table placeholder — same app-table shell, skeleton header + rows (reports-style). */
export function ModuleTableSkeleton({
  columns = 5,
  rows = 6,
  hasActions = true,
  className = '',
}: ModuleTableSkeletonProps) {
  const colSpan = columns + (hasActions ? 1 : 0);

  return (
    <div
      className={`app-table min-h-[280px] ${className}`.trim()}
      aria-busy="true"
      aria-label="Loading table"
    >
      <div className="app-table-scroll">
        <table className="app-table-element">
          <thead className="app-table-head">
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={`sk-head-${index}`} className="app-table-th app-table-align-left">
                  <SkeletonBlock className="h-3.5 w-16 rounded-md" />
                </th>
              ))}
              {hasActions ? (
                <th className="app-table-th app-table-th-actions app-table-align-center">
                  <SkeletonBlock className="h-3.5 w-12 mx-auto rounded-md" />
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={`sk-row-${rowIndex}`} className="app-table-tr">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={`sk-cell-${rowIndex}-${colIndex}`} className="app-table-td app-table-align-left">
                    <div className="app-table-cell-inner app-table-cell-inner--left">
                      <div className="app-table-skeleton" />
                    </div>
                  </td>
                ))}
                {hasActions ? (
                  <td className="app-table-td app-table-td-actions app-table-align-center">
                    <div className="app-table-cell-inner app-table-cell-inner--center">
                      <div className="app-table-skeleton w-16 mx-auto" />
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
            {rows === 0 ? (
              <tr className="app-table-tr">
                <td colSpan={colSpan} className="app-table-empty">
                  <SkeletonBlock className="h-4 w-32 mx-auto rounded-md" />
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
