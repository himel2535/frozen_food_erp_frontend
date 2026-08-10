'use client';

import type { DealSourceSlice } from '@/lib/services/deals-pipeline-service';

export function DealsBySourceChart({ slices }: { slices: DealSourceSlice[] }) {
  const max = slices[0]?.count ?? 1;

  return (
    <div className="space-y-3">
      {slices.map((slice) => (
        <div key={slice.key} className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="font-semibold text-slate-700">{slice.label}</span>
            <span className="font-bold text-slate-800 tabular-nums">
              {slice.count} <span className="text-slate-400 font-semibold">({slice.pct}%)</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-400 to-blue-500 transition-all"
              style={{ width: `${max > 0 ? (slice.count / max) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
      {slices.length === 0 ? <p className="text-[11px] text-slate-400 text-center py-4">No source data yet.</p> : null}
    </div>
  );
}
