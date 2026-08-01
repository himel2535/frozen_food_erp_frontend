'use client';

import { Download } from 'lucide-react';
import { formatPeriodLabel } from '@/lib/services/profit-loss-service';
import type { ProfitLossPeriodState } from './profit-loss-types';

const INPUT_CLS =
  'rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200';

export function ProfitLossPeriodBar({
  period,
  onPeriodChange,
  onExport,
}: {
  period: ProfitLossPeriodState;
  onPeriodChange: (next: ProfitLossPeriodState) => void;
  onExport: () => void;
}) {
  return (
    <div className="premium-card premium-shadow p-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div>
          <span className="text-[11px] font-bold text-slate-500 block mb-1">Period</span>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={period.dateFrom}
              onChange={(e) => onPeriodChange({ ...period, dateFrom: e.target.value })}
              className={INPUT_CLS}
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={period.dateTo}
              onChange={(e) => onPeriodChange({ ...period, dateTo: e.target.value })}
              className={INPUT_CLS}
            />
          </div>
        </div>
        <div className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          {formatPeriodLabel(period.dateFrom, period.dateTo)}
        </div>
      </div>
      <button
        type="button"
        onClick={onExport}
        className="inline-flex items-center gap-2 self-start lg:self-auto rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
      >
        <Download className="w-4 h-4" />
        Export
      </button>
    </div>
  );
}
