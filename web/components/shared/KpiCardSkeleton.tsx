import { SkeletonBlock } from '@/components/shared/SkeletonBlock';

/** One KPI card placeholder — matches KpiCards loaded card layout (label, value, sub, icon). */
export function KpiCardSkeleton() {
  return (
    <div className="premium-card premium-shadow p-3.5 flex items-center justify-between gap-3 min-h-[72px]">
      <div className="flex flex-col justify-center gap-0.5 min-w-0 flex-1">
        <SkeletonBlock className="h-3 w-20 rounded-md" />
        <SkeletonBlock className="h-6 w-12 rounded-md mt-0.5" />
        <SkeletonBlock className="h-3 w-24 rounded-md mt-1" />
      </div>
      <SkeletonBlock className="h-10 w-10 rounded-xl shrink-0" />
    </div>
  );
}
