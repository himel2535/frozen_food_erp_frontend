'use client';

import type { DealPerformerItem } from '@/lib/services/deals-pipeline-service';
import { PERFORMER_TROPHY } from '@/components/modules/crm/deals/deal-display-utils';

export function DealTopPerformersPanel({
  items,
  formatMoney,
}: {
  items: DealPerformerItem[];
  formatMoney: (n: number) => string;
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white/80 px-3 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">{PERFORMER_TROPHY[item.rank - 1] ?? '🏅'}</span>
            <span className="text-xs font-bold text-slate-800 truncate">{item.name}</span>
          </div>
          <span className="text-xs font-extrabold text-blue-600 tabular-nums shrink-0">{formatMoney(item.value)}</span>
        </div>
      ))}
      {items.length === 0 ? <p className="text-[11px] text-slate-400 text-center py-4">No won deals yet.</p> : null}
      <button type="button" className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer">
        View Leaderboard →
      </button>
    </div>
  );
}
