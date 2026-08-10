'use client';

import type { ComplaintCategorySlice } from '@/lib/services/complaints-service';

const CATEGORY_ICONS: Record<string, string> = {
  'product-quality': '🧸',
  'missing-item': '📦',
  delivery: '🚚',
  'incorrect-info': 'ℹ️',
  refund: '💳',
  packaging: '🎁',
};

export function ComplaintTopCategories({ slices }: { slices: ComplaintCategorySlice[] }) {
  const top = slices.slice(0, 5);
  const max = top[0]?.count ?? 1;

  return (
    <div className="space-y-3">
      {top.map((slice) => (
        <div key={slice.key} className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 min-w-0">
              <span className="text-sm shrink-0">{CATEGORY_ICONS[slice.key] ?? '📋'}</span>
              <span className="truncate">{slice.label}</span>
            </span>
            <span className="font-bold text-slate-800 tabular-nums shrink-0">
              {slice.count} <span className="text-slate-400 font-semibold">({slice.pct}%)</span>
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${max > 0 ? (slice.count / max) * 100 : 0}%`,
                backgroundColor: slice.color,
              }}
            />
          </div>
        </div>
      ))}
      {top.length === 0 ? (
        <p className="text-[11px] text-slate-400 text-center py-4">No category data yet.</p>
      ) : null}
    </div>
  );
}
