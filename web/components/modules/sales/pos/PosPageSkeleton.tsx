'use client';

import { SkeletonBlock } from '@/components/shared/SkeletonBlock';

function SkeletonPosHeader() {
  return (
    <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-2 mb-2 shrink-0 min-h-[3.5rem]">
      <div className="flex items-start gap-3 min-w-0">
        <SkeletonBlock className="w-8 h-8 rounded-lg shrink-0" />
        <div className="space-y-1 min-h-[36px]">
          <SkeletonBlock className="h-6 w-36 rounded-lg" />
          <SkeletonBlock className="h-3.5 w-52 max-w-full rounded-md" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 shrink-0 self-start">
        <SkeletonBlock className="h-9 w-24 rounded-xl" />
        <SkeletonBlock className="h-9 w-28 rounded-xl" />
        <SkeletonBlock className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  );
}

function SkeletonProductPanel() {
  return (
    <div className="flex flex-col min-h-0 flex-1 gap-3">
      <SkeletonBlock className="h-10 w-full rounded-xl shrink-0" />
      <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 7 }).map((_, index) => (
            <SkeletonBlock key={`cat-${index}`} className="h-8 w-16 rounded-lg" />
          ))}
        </div>
        <div className="flex gap-1">
          <SkeletonBlock className="h-8 w-16 rounded-lg" />
          <SkeletonBlock className="h-8 w-16 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 flex-1 min-h-[280px] auto-rows-max content-start">
        {Array.from({ length: 8 }).map((_, index) => (
          <SkeletonBlock key={`product-${index}`} className="h-36 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function SkeletonCartPanel() {
  return (
    <aside className="premium-card premium-shadow bg-white/90 p-4 flex flex-col min-h-0 h-full gap-3">
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-24 rounded-md" />
          <SkeletonBlock className="h-5 w-16 rounded-full" />
        </div>
        <SkeletonBlock className="h-8 w-8 rounded-full shrink-0" />
      </div>
      <SkeletonBlock className="h-10 w-full rounded-xl shrink-0" />
      <div className="flex-1 space-y-2 min-h-[120px]">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonBlock key={`line-${index}`} className="h-14 w-full rounded-xl" />
        ))}
      </div>
      <div className="space-y-2 shrink-0 pt-1">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={`total-${index}`} className="flex items-center justify-between gap-2">
            <SkeletonBlock className="h-3 w-16 rounded-md" />
            <SkeletonBlock className="h-3 w-14 rounded-md" />
          </div>
        ))}
        <SkeletonBlock className="h-11 w-full rounded-xl mt-2" />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <SkeletonBlock className="h-9 w-full rounded-xl" />
          <SkeletonBlock className="h-9 w-full rounded-xl" />
        </div>
      </div>
    </aside>
  );
}

export function PosPageSkeleton({ label = 'Loading POS' }: { label?: string }) {
  return (
    <div className="flex flex-col flex-1 min-h-0" aria-busy="true" aria-label={label}>
      <SkeletonPosHeader />
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-3 flex-1 min-h-0">
        <SkeletonProductPanel />
        <SkeletonCartPanel />
      </div>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2 shrink-0">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonBlock key={`action-${index}`} className="h-12 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
