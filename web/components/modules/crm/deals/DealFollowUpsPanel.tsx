'use client';

import { CalendarDays } from 'lucide-react';
import type { DealFollowUpItem } from '@/lib/services/deals-pipeline-service';
import { FOLLOWUP_TONE } from '@/components/modules/crm/deals/deal-display-utils';

export function DealFollowUpsPanel({ items }: { items: DealFollowUpItem[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-white/80 p-2.5">
          <span className={`inline-flex w-8 h-8 rounded-lg border items-center justify-center shrink-0 ${FOLLOWUP_TONE[item.tone]}`}>
            <CalendarDays className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">{item.dealTitle}</p>
            <p className="text-[10px] text-slate-500 truncate">{item.company}</p>
            <p className="text-[10px] font-semibold text-slate-600 mt-1">{item.date} · {item.time}</p>
          </div>
        </div>
      ))}
      {items.length === 0 ? <p className="text-[11px] text-slate-400 text-center py-4">No upcoming follow-ups.</p> : null}
      <button type="button" className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer">
        View All →
      </button>
    </div>
  );
}
