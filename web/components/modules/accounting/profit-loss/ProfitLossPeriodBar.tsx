'use client';

import { CalendarRange, Download } from 'lucide-react';
import { ModuleFilterBar } from '@/components/shared/ModuleFilterBar';
import { formatPeriodLabel } from '@/lib/services/profit-loss-service';
import { DateInput } from '@/components/shared/DateInput';
import { MODULE_FILTER_INPUT, MODULE_SECONDARY_BTN } from '@/lib/ui/module-chrome-styles';
import type { ProfitLossPeriodState } from './profit-loss-types';

export function ProfitLossPeriodBar({
  period,
  onPeriodChange,
  onExport,
}: {
  period: ProfitLossPeriodState;
  onPeriodChange: (next: ProfitLossPeriodState) => void;
  onExport: () => void;
}) {
  const periodLabel = formatPeriodLabel(period.dateFrom, period.dateTo);

  return (
    <ModuleFilterBar
      filters={
        <>
          <DateInput
            id="pl-date-from"
            value={period.dateFrom}
            onChange={(dateFrom) => onPeriodChange({ ...period, dateFrom })}
            className={MODULE_FILTER_INPUT}
            aria-label="From Date"
          />
          <DateInput
            id="pl-date-to"
            value={period.dateTo}
            onChange={(dateTo) => onPeriodChange({ ...period, dateTo })}
            className={MODULE_FILTER_INPUT}
            aria-label="To Date"
          />
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white/45 border border-blue-100/70 rounded-xl px-3 py-2 min-h-[2.625rem] shrink-0">
            <CalendarRange className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{periodLabel || 'Select period'}</span>
          </div>
        </>
      }
      actions={
        <button type="button" onClick={onExport} className={MODULE_SECONDARY_BTN}>
          <Download className="w-4 h-4" />
          Export
        </button>
      }
    />
  );
}
