'use client';

import { pmProgressBarClass } from '@/lib/services/pm-service';

export function PmProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="flex items-center gap-2 min-w-[88px]">
      <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${pmProgressBarClass(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] font-bold text-slate-700 tabular-nums shrink-0">{pct}%</span>
    </div>
  );
}
