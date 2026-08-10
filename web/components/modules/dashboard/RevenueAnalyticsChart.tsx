'use client';

import { useMemo } from 'react';
import { Icon } from '@iconify/react';
import { useAppStore } from '@/lib/state/app-store';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { getRevenueByMonth } from '@/lib/services/dashboard-service';

export function RevenueAnalyticsChart() {
  const appState = useAppStore((s) => s.appState);
  const t = useAppStore((s) => s.t);
  const { formatCompactMoney, formatMonthShort } = useLocaleFormat();

  const monthly = useMemo(() => getRevenueByMonth(appState), [appState]);
  const maxValue = useMemo(() => Math.max(...monthly.map((m) => m.value), 1), [monthly]);
  const activeIdx = useMemo(() => {
    let best = 0;
    monthly.forEach((m, i) => {
      if (m.value > monthly[best].value) best = i;
    });
    return best;
  }, [monthly]);

  const bars = useMemo(
    () =>
      monthly.map((m, idx) => ({
        value: m.value,
        height: m.value > 0 ? `${Math.max(8, Math.round((m.value / maxValue) * 82))}%` : '8%',
        label: formatCompactMoney(m.value),
        active: idx === activeIdx,
      })),
    [monthly, maxValue, activeIdx, formatCompactMoney],
  );

  const monthLabels = useMemo(
    () => monthly.map((m) => formatMonthShort(m.month)),
    [monthly, formatMonthShort],
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
          {monthLabels.map((m, idx) => (
            <span key={`${m}-${idx}`}>{m}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
