'use client';

import { useMemo } from 'react';
import { Icon } from '@iconify/react';
import { useAppStore } from '@/lib/state/app-store';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

const BAR_VALUES = [340000, 420000, 390000, 520000, 820650, 480000, 590000, 470000, 620000, 680000];
const BAR_HEIGHTS = ['38%', '48%', '42%', '60%', '82%', '54%', '65%', '52%', '70%', '72%'];
const MONTH_INDICES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function RevenueAnalyticsChart() {
  const t = useAppStore((s) => s.t);
  const { formatCompactMoney, formatMonthShort } = useLocaleFormat();

  const bars = useMemo(
    () =>
      BAR_VALUES.map((value, idx) => ({
        value,
        height: BAR_HEIGHTS[idx],
        label: formatCompactMoney(value),
        active: idx === 4,
      })),
    [formatCompactMoney],
  );

  const monthLabels = useMemo(
    () => MONTH_INDICES.map((monthIndex) => formatMonthShort(monthIndex)),
    [formatMonthShort],
  );

  return (
    <div className="premium-card p-4 premium-shadow lg:col-span-1 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon icon="fluent-color:chart-multiple-24" width={26} height={26} className="shrink-0" />
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">{t('dashboard.revenue_analytics')}</h3>
        </div>
        <select className="bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-600 rounded-lg px-2.5 py-1 cursor-pointer">
          <option>{t('dashboard.this_year')}</option>
          <option>{t('dashboard.last_3_years')}</option>
        </select>
      </div>
      <div className="h-56 flex items-end justify-between gap-1.5 relative pt-4 pb-6">
        {bars.map((bar, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
            <div
              className={`${bar.active ? 'bg-blue-600/20 group-hover:bg-blue-600' : 'bg-blue-600/10 group-hover:bg-blue-600'} w-full rounded-md transition-all cursor-pointer relative`}
              style={{ height: bar.height }}
            >
              <span
                className={`${bar.active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold py-1 px-1.5 rounded whitespace-nowrap z-40 transition-opacity`}
              >
                {bar.label}
              </span>
            </div>
          </div>
        ))}
        <div className="absolute bottom-0 left-0 w-full flex justify-between text-[9px] font-bold text-slate-400/80 pt-2 border-t border-slate-100">
          {monthLabels.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
