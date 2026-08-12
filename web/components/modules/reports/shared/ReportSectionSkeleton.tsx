import type { ReactNode } from 'react';
import { SkeletonBlock } from '@/components/shared/SkeletonBlock';

const CARD = 'premium-card premium-shadow p-4';

function ReportCardShell({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={`${CARD} flex flex-col ${className}`.trim()}>{children}</div>;
}

function ReportCardHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between gap-2 mb-4">
      <div className="flex items-center gap-2 min-w-0">
        <SkeletonBlock className="w-6 h-6 rounded-lg shrink-0" />
        <SkeletonBlock className="h-4 w-32 rounded-md" />
      </div>
      <SkeletonBlock className="h-7 w-16 rounded-lg shrink-0" />
    </div>
  );
}

export function ReportLineChartSkeleton({ className = '' }: { className?: string }) {
  return (
    <ReportCardShell className={`${className} lg:col-span-2`}>
      <ReportCardHeaderSkeleton />
      <div className="flex gap-4 mb-3">
        <SkeletonBlock className="h-3 w-20 rounded-md" />
        <SkeletonBlock className="h-3 w-24 rounded-md" />
      </div>
      <SkeletonBlock className="h-56 w-full rounded-xl" />
      <div className="flex justify-between mt-3 pt-2 border-t border-slate-100">
        {Array.from({ length: 7 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-2.5 w-6 rounded-md" />
        ))}
      </div>
    </ReportCardShell>
  );
}

export function ReportDonutSkeleton({ className = '' }: { className?: string }) {
  return (
    <ReportCardShell className={className}>
      <ReportCardHeaderSkeleton />
      <div className="flex flex-col items-center gap-4 flex-1">
        <SkeletonBlock className="w-[120px] h-[120px] rounded-full" />
        <div className="w-full space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between gap-2">
                <SkeletonBlock className="h-3 w-24 rounded-md" />
                <SkeletonBlock className="h-3 w-10 rounded-md" />
              </div>
              <SkeletonBlock className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </ReportCardShell>
  );
}

export function ReportTopListSkeleton({ className = '', rows = 5 }: { className?: string; rows?: number }) {
  return (
    <ReportCardShell className={className}>
      <ReportCardHeaderSkeleton />
      <div className="space-y-2 flex-1">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <SkeletonBlock className="w-9 h-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5 min-w-0">
              <SkeletonBlock className="h-3 w-28 rounded-md" />
              <SkeletonBlock className="h-2.5 w-16 rounded-md" />
            </div>
            <SkeletonBlock className="h-3 w-14 rounded-md shrink-0" />
          </div>
        ))}
      </div>
    </ReportCardShell>
  );
}

export function ReportTableSkeleton({ className = '', columns = 6, rows = 6 }: { className?: string; columns?: number; rows?: number }) {
  return (
    <ReportCardShell className={className}>
      <ReportCardHeaderSkeleton />
      <div className="overflow-hidden rounded-xl border border-slate-100">
        <div className="grid gap-px bg-slate-100" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <div key={`h-${i}`} className="bg-slate-50 px-3 py-2.5">
              <SkeletonBlock className="h-3 w-16 rounded-md" />
            </div>
          ))}
        </div>
        {Array.from({ length: rows }).map((_, row) => (
          <div
            key={`r-${row}`}
            className="grid gap-px bg-slate-100 border-t border-slate-100"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((_, col) => (
              <div key={`c-${row}-${col}`} className="bg-white px-3 py-3">
                <SkeletonBlock className="h-3.5 w-full max-w-[120px] rounded-md" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </ReportCardShell>
  );
}

export function ReportPanelSkeleton({ className = '', lines = 4 }: { className?: string; lines?: number }) {
  return (
    <ReportCardShell className={className}>
      <ReportCardHeaderSkeleton />
      <div className="space-y-3 flex-1">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <SkeletonBlock className="h-3 w-28 rounded-md" />
            <SkeletonBlock className="h-3 w-16 rounded-md" />
          </div>
        ))}
      </div>
    </ReportCardShell>
  );
}

export function ReportBarChartSkeleton({ className = '' }: { className?: string }) {
  return (
    <section className={`space-y-2 ${className}`.trim()}>
      <div className="flex items-center gap-2 mb-1">
        <SkeletonBlock className="w-5 h-5 rounded-lg" />
        <SkeletonBlock className="h-4 w-36 rounded-md" />
      </div>
      <ReportCardShell>
        <div className="flex gap-4 mb-3">
          <SkeletonBlock className="h-3 w-16 rounded-md" />
          <SkeletonBlock className="h-3 w-14 rounded-md" />
        </div>
        <SkeletonBlock className="h-56 w-full rounded-xl" />
      </ReportCardShell>
    </section>
  );
}

export function ReportKeyMetricsSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-2 ${className}`.trim()}>
      {Array.from({ length: 4 }).map((_, i) => (
        <ReportCardShell key={i}>
          <SkeletonBlock className="h-3 w-20 rounded-md mb-2" />
          <SkeletonBlock className="h-6 w-16 rounded-md" />
        </ReportCardShell>
      ))}
    </div>
  );
}
