import { SkeletonBlock } from '@/components/shared/SkeletonBlock';
import { SkeletonText } from '@/components/skeletons/SkeletonText';

export const DASHBOARD_KPI_COUNT = 6;

const CHART_BAR_HEIGHTS = [42, 68, 55, 82, 61, 74, 48, 70, 58, 65, 52, 78];

function DashboardKpiCardSkeleton({ label }: { label?: string }) {
  return (
    <div
      className="premium-card premium-shadow px-4 py-2.5 flex items-center justify-between gap-3 min-h-[84px]"
      aria-hidden={label ? undefined : true}
    >
      <div className="flex flex-col justify-center gap-0.5 min-w-0 flex-1">
        {label ? (
          <span className="text-xs font-bold text-slate-500 tracking-wide leading-tight block">{label}</span>
        ) : (
          <SkeletonText className="h-3 w-[72px] max-w-[85%]" />
        )}
        <SkeletonText className="h-5 md:h-6 w-[88px] max-w-[90%] mt-0.5" />
        <SkeletonText className="h-2.5 w-[96px] max-w-[95%]" />
      </div>
      <SkeletonBlock className="w-[38px] h-[38px] rounded-xl shrink-0" />
    </div>
  );
}

function DashboardPanelHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
      <div className="flex items-center gap-2 min-w-0">
        <SkeletonBlock className="w-[22px] h-[22px] rounded-md shrink-0" />
        <SkeletonText className="h-4 w-28" />
      </div>
      <SkeletonText className="h-3 w-12 shrink-0" />
    </div>
  );
}

function DashboardChartHeaderSkeleton() {
  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <SkeletonBlock className="w-[26px] h-[26px] rounded-md shrink-0" />
          <SkeletonText className="h-4 w-36" />
        </div>
        <SkeletonText className="h-2.5 w-44 max-w-full" />
      </div>
      <SkeletonBlock className="h-8 w-[72px] rounded-lg shrink-0" />
    </div>
  );
}

function DashboardSubKpiRowSkeleton({ tint = 'default' }: { tint?: 'blue' | 'violet' | 'default' }) {
  const boxClass =
    tint === 'blue'
      ? 'rounded-xl bg-blue-50/80 border border-blue-100'
      : tint === 'violet'
        ? 'rounded-xl bg-violet-50/80 border border-violet-100'
        : 'rounded-xl bg-slate-50 border border-slate-100';

  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={`sub-kpi-${index}`} className={`${boxClass} px-3 py-2 space-y-1.5 min-w-0`}>
          <SkeletonText className="h-2 w-14" />
          <SkeletonText className="h-4 w-20 max-w-full" />
        </div>
      ))}
    </div>
  );
}

function DashboardChartBarsSkeleton() {
  return (
    <div className="flex-1 min-h-[9.5rem] flex gap-2 shrink-0">
      <div className="flex flex-col justify-between pb-6 shrink-0 w-10">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonText key={`y-${index}`} className="h-2 w-8 ml-auto" />
        ))}
      </div>
      <div className="flex-1 relative min-w-0">
        <div className="absolute inset-0 bottom-6 flex flex-col justify-between pointer-events-none">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`grid-${index}`} className="border-t border-dashed border-slate-100 w-full" />
          ))}
        </div>
        <div className="absolute inset-0 bottom-6 flex items-end justify-between gap-1.5">
          {CHART_BAR_HEIGHTS.map((height, index) => (
            <div
              key={`bar-${index}`}
              className={`app-skeleton flex-1 max-w-12 rounded-t-lg min-w-0 ${height >= 70 ? 'opacity-100' : 'opacity-80'}`}
              style={{ height: `${height}%` }}
              aria-hidden="true"
            />
          ))}
        </div>
        <div className="absolute bottom-0 left-0 w-full flex justify-between border-t border-slate-100 pt-2 gap-0.5">
          {CHART_BAR_HEIGHTS.map((_, index) => (
            <SkeletonText key={`x-${index}`} className="flex-1 h-2 max-w-6 mx-auto" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardKpiGridSkeleton({ labels }: { labels?: string[] }) {
  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1 shrink-0">
      {Array.from({ length: DASHBOARD_KPI_COUNT }).map((_, index) => (
        <DashboardKpiCardSkeleton key={`dashboard-kpi-${index}`} label={labels?.[index]} />
      ))}
    </section>
  );
}

export function DashboardSalesTrendChartSkeleton() {
  return (
    <div className="premium-card p-3 premium-shadow lg:col-span-2 flex flex-col h-full min-h-0">
      <DashboardChartHeaderSkeleton />
      <DashboardSubKpiRowSkeleton tint="blue" />
      <div className="flex-1 min-h-[9.5rem]">
        <DashboardChartBarsSkeleton />
      </div>
    </div>
  );
}

export function DashboardRevenueChartSkeleton() {
  return (
    <div className="premium-card p-3 premium-shadow lg:col-span-1 flex flex-col h-full min-h-0">
      <DashboardChartHeaderSkeleton />
      <DashboardSubKpiRowSkeleton tint="violet" />
      <div className="flex-1 min-h-[9.5rem]">
        <DashboardChartBarsSkeleton />
      </div>
    </div>
  );
}

export function DashboardBusinessAlertsSkeleton() {
  return (
    <div className="premium-card p-3 premium-shadow flex flex-col h-full min-h-0">
      <DashboardPanelHeaderSkeleton />
      <div className="flex flex-col gap-1 justify-start overflow-hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={`alert-${index}`} className="flex items-center gap-3 rounded-xl px-2 py-1.5 min-h-[2rem]">
            <SkeletonBlock className="w-2.5 h-2.5 rounded-full shrink-0" />
            <SkeletonText className="h-3.5 flex-1 max-w-[220px]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardProductRowSkeleton() {
  return (
    <div className="flex items-center justify-between text-xs min-h-[2.75rem] gap-3">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <SkeletonBlock className="h-6 w-6 rounded-md shrink-0" />
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <SkeletonText className="h-3.5 w-28 max-w-full" />
          <SkeletonText className="h-2.5 w-36 max-w-full" />
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <SkeletonText className="h-3.5 w-14" />
        <SkeletonText className="h-4 w-8 rounded-md" />
      </div>
    </div>
  );
}

function DashboardInvoiceRowSkeleton() {
  return (
    <div className="flex items-center justify-between text-xs min-h-[2.75rem] gap-3">
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <SkeletonText className="h-3.5 w-20" />
        <SkeletonText className="h-2.5 w-40 max-w-full" />
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <SkeletonText className="h-3.5 w-14" />
        <SkeletonText className="h-4 w-14 rounded-md" />
      </div>
    </div>
  );
}

function DashboardActivityRowSkeleton() {
  return (
    <div className="flex items-center gap-3 min-h-[2.75rem]">
      <SkeletonBlock className="h-6 w-6 rounded-full shrink-0" />
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <SkeletonText className="h-3.5 w-full max-w-[200px]" />
        <SkeletonText className="h-2.5 w-16" />
      </div>
    </div>
  );
}

export function DashboardTopProductsSkeleton() {
  return (
    <div className="premium-card p-4 premium-shadow lg:col-span-2 flex flex-col h-full min-h-[220px] max-md:h-auto max-md:min-h-0">
      <DashboardPanelHeaderSkeleton />
      <div className="flex-1 flex flex-col justify-between gap-4 min-h-[9.75rem]">
        {Array.from({ length: 3 }).map((_, index) => (
          <DashboardProductRowSkeleton key={`product-${index}`} />
        ))}
      </div>
    </div>
  );
}

export function DashboardRecentInvoicesSkeleton() {
  return (
    <div className="premium-card p-4 premium-shadow lg:col-span-1 flex flex-col h-full min-h-[220px] max-md:h-auto max-md:min-h-0">
      <DashboardPanelHeaderSkeleton />
      <div className="flex-1 flex flex-col justify-between gap-4 min-h-[9.75rem]">
        {Array.from({ length: 3 }).map((_, index) => (
          <DashboardInvoiceRowSkeleton key={`invoice-${index}`} />
        ))}
      </div>
    </div>
  );
}

export function DashboardActivityFeedSkeleton() {
  return (
    <div className="premium-card p-4 premium-shadow flex flex-col h-full min-h-[220px] max-md:h-auto max-md:min-h-0">
      <DashboardPanelHeaderSkeleton />
      <div className="flex-1 flex flex-col justify-between gap-4 min-h-[9.75rem]">
        {Array.from({ length: 3 }).map((_, index) => (
          <DashboardActivityRowSkeleton key={`activity-${index}`} />
        ))}
      </div>
    </div>
  );
}

export function DashboardBottomPanelsSkeleton() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-4 gap-1 flex-1 min-h-0 items-stretch">
      <DashboardTopProductsSkeleton />
      <DashboardRecentInvoicesSkeleton />
      <DashboardActivityFeedSkeleton />
    </section>
  );
}

function DashboardProjectCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-100 bg-white/80 p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="space-y-1.5 min-w-0 flex-1">
          <SkeletonText className="h-3.5 w-40 max-w-full" />
          <SkeletonText className="h-2.5 w-24" />
        </div>
        <SkeletonText className="h-5 w-16 rounded-lg shrink-0" />
      </div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <SkeletonText className="h-2.5 w-28" />
        <SkeletonText className="h-3.5 w-8" />
      </div>
      <SkeletonBlock className="h-2 w-full rounded-full" />
      <SkeletonText className="h-2.5 w-32 mt-2" />
    </div>
  );
}

export function DashboardProjectProgressSkeleton() {
  return (
    <section className="premium-card premium-shadow p-4">
      <DashboardPanelHeaderSkeleton />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <DashboardProjectCardSkeleton />
        <DashboardProjectCardSkeleton />
      </div>
    </section>
  );
}

export function DashboardChartsRowSkeleton() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-4 gap-1 flex-1 min-h-0 items-stretch">
      <DashboardSalesTrendChartSkeleton />
      <DashboardRevenueChartSkeleton />
      <DashboardBusinessAlertsSkeleton />
    </section>
  );
}

/** Full dashboard route shell — matches DashboardView layout exactly. */
export function DashboardLoadingSkeleton({
  label = 'Loading dashboard',
  kpiLabels,
}: {
  label?: string;
  kpiLabels?: string[];
}) {
  return (
    <div className="flex flex-col flex-1 min-h-0 gap-1 max-md:gap-2" aria-busy="true" aria-label={label}>
      <DashboardKpiGridSkeleton labels={kpiLabels} />
      <DashboardChartsRowSkeleton />
      <DashboardBottomPanelsSkeleton />
      <DashboardProjectProgressSkeleton />
    </div>
  );
}
