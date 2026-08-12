import { MODULE_FILTER_BAR, MODULE_FILTER_BAR_STACKED, MODULE_KPI_SECTION } from '@/lib/ui/module-chrome-styles';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { SkeletonBlock } from '@/components/shared/SkeletonBlock';
import { ModuleTableSkeleton } from '@/components/shared/ModuleTableSkeleton';
import { ModuleKpiSkeleton } from '@/components/shared/ModuleKpiSkeleton';
import { DashboardLoadingSkeleton } from '@/components/skeletons/DashboardLoadingSkeleton';
import { getKpiGridClassName } from '@/lib/ui/kpi-grid';

export type PageSkeletonVariant =
  | 'dashboard'
  | 'module-list'
  | 'module-route'
  | 'sidebar'
  | 'chart'
  | 'form'
  | 'detail'
  | 'generic';

export type PageSkeletonProps = {
  variant?: PageSkeletonVariant;
  className?: string;
  /** Sidebar nav: collapsed rail mode */
  collapsed?: boolean;
  /** Sidebar / generic block count */
  count?: number;
  /** Chart panel layout classes (e.g. lg:col-span-2) */
  chartClassName?: string;
  label?: string;
};

const TABLE_COLUMNS = 5;
const TABLE_ROWS = 5;
const DEFAULT_KPI_COUNT = 2;
const DEFAULT_SIDEBAR_COUNT = 7;
const DEFAULT_GENERIC_COUNT = 4;

function SkeletonModuleHeader() {
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

function SkeletonSearchCard() {
  return (
    <div className={`${MODULE_FILTER_BAR} ${MODULE_FILTER_BAR_STACKED}`}>
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

export function SkeletonKpiGrid({
  count = DEFAULT_KPI_COUNT,
  className,
}: {
  count?: number;
  className?: string;
  cardClassName?: string;
}) {
  return (
    <ModuleKpiSkeleton
      count={count}
      gridClassName={className ?? getKpiGridClassName(count)}
    />
  );
}

export function SkeletonChartPanel({ className = '' }: { className?: string }) {
  return (
    <SkeletonBlock
      className={`premium-card premium-shadow h-72 rounded-[1.25rem] ${className}`.trim()}
    />
  );
}

function SkeletonModuleTable() {
  return <ModuleTableSkeleton columns={TABLE_COLUMNS} rows={TABLE_ROWS} />;
}

function SkeletonDashboard({ label }: { label: string }) {
  return <DashboardLoadingSkeleton label={label} />;
}

function SkeletonModuleList({ label }: { label: string }) {
  return (
    <div className={MODULE_LIST_SHELL} aria-busy="true" aria-label={label}>
      <SkeletonModuleHeader />
      <SkeletonKpiGrid />
      <SkeletonSearchCard />
      <SkeletonModuleTable />
    </div>
  );
}

/** Inside ModuleShell — KPI + table only; filter chrome is page-local and renders immediately. */
function SkeletonModuleRoute({ label }: { label: string }) {
  return (
    <div className="flex-1 min-h-[360px] space-y-1 flex flex-col" aria-busy="true" aria-label={label}>
      <ModuleKpiSkeleton count={4} gridClassName={getKpiGridClassName(4)} />
      <SkeletonModuleTable />
    </div>
  );
}

function SkeletonSidebar({ collapsed, count }: { collapsed?: boolean; count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonBlock
          key={`sidebar-${index}`}
          className={`h-11 rounded-2xl ${collapsed ? 'mx-auto w-11' : 'w-full'}`}
        />
      ))}
    </>
  );
}

function SkeletonForm({ label }: { label: string }) {
  return (
    <div className={MODULE_LIST_SHELL} aria-busy="true" aria-label={label}>
      <SkeletonModuleHeader />
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 premium-shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={`field-${index}`} className="space-y-2">
              <SkeletonBlock className="h-3 w-24 rounded-md" />
              <SkeletonBlock className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <SkeletonBlock className="h-9 w-20 rounded-xl" />
          <SkeletonBlock className="h-9 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function SkeletonDetail({ label }: { label: string }) {
  return (
    <div className={MODULE_LIST_SHELL} aria-busy="true" aria-label={label}>
      <SkeletonModuleHeader />
      <div className="premium-card premium-shadow rounded-xl border border-slate-200/80 bg-white p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={`detail-${index}`} className="space-y-2">
              <SkeletonBlock className="h-3 w-20 rounded-md" />
              <SkeletonBlock className="h-5 w-full max-w-[180px] rounded-md" />
            </div>
          ))}
        </div>
        <SkeletonBlock className="h-32 w-full rounded-xl" />
      </div>
    </div>
  );
}

function SkeletonGeneric({ count, className }: { count: number; className: string }) {
  return (
    <div className={className} aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonBlock key={`block-${index}`} className="h-12 w-full rounded-xl" />
      ))}
    </div>
  );
}

/** Shared skeleton loader — use across pages while data or chunks are loading. */
export function PageSkeleton({
  variant = 'generic',
  className = '',
  collapsed,
  count,
  chartClassName = '',
  label = 'Loading',
}: PageSkeletonProps) {
  switch (variant) {
    case 'dashboard':
      return <SkeletonDashboard label={label} />;
    case 'module-list':
      return <SkeletonModuleList label={label} />;
    case 'module-route':
      return <SkeletonModuleRoute label={label} />;
    case 'sidebar':
      return (
        <SkeletonSidebar collapsed={collapsed} count={count ?? DEFAULT_SIDEBAR_COUNT} />
      );
    case 'chart':
      return <SkeletonChartPanel className={chartClassName} />;
    case 'form':
      return <SkeletonForm label={label} />;
    case 'detail':
      return <SkeletonDetail label={label} />;
    default:
      return (
        <SkeletonGeneric
          count={count ?? DEFAULT_GENERIC_COUNT}
          className={`flex-1 p-4 space-y-2 ${className}`.trim()}
        />
      );
  }
}

/** next/dynamic loading callback helper */
export function pageSkeletonLoader(
  variant: PageSkeletonVariant = 'generic',
  props?: Omit<PageSkeletonProps, 'variant'>,
) {
  return () => <PageSkeleton variant={variant} {...props} />;
}
