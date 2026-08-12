'use client';

import { useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { useAppStore } from '@/lib/state/app-store';
import { useDashboardAppState } from '@/hooks/use-dashboard-api-data';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import {
  getRevenueSeries,
  niceChartAxisMax,
  type SalesTrendRange,
} from '@/lib/services/dashboard-service';

const RANGE_OPTIONS: SalesTrendRange[] = ['day', 'week', 'month', 'quarter', 'year'];

const RANGE_LABEL_KEYS: Record<SalesTrendRange, string> = {
  day: 'dashboard.filter_day',
  week: 'dashboard.filter_week',
  month: 'dashboard.filter_month',
  quarter: 'dashboard.last_quarter',
  year: 'dashboard.filter_year',
};

export function RevenueAnalyticsChart() {
  const appState = useDashboardAppState();
  const t = useAppStore((s) => s.t);
  const { formatMoney, formatCompactMoney } = useLocaleFormat();
  const [range, setRange] = useState<SalesTrendRange>('month');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const series = useMemo(() => getRevenueSeries(appState, range), [appState, range]);
  const total = useMemo(() => series.reduce((s, p) => s + p.value, 0), [series]);
  const average = useMemo(() => (series.length ? total / series.length : 0), [series, total]);
  const maxValue = useMemo(() => niceChartAxisMax(Math.max(...series.map((p) => p.value), 1)), [series]);

  const peakIdx = useMemo(() => {
    if (!series.length) return 0;
    let best = 0;
    series.forEach((p, i) => {
      if (p.value >= series[best].value) best = i;
    });
    return best;
  }, [series]);

  const activeIdx = hoverIdx ?? peakIdx;
  const activePoint = series[activeIdx];

  const yTicks = useMemo(() => {
    const step = maxValue / 4;
    return [maxValue, step * 3, step * 2, step, 0];
  }, [maxValue]);

  return (
    <div className="premium-card p-3 premium-shadow lg:col-span-1 flex flex-col h-full min-h-0">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Icon icon="fluent-color:chart-multiple-24" width={22} height={22} className="shrink-0" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">{t('dashboard.revenue_analytics')}</h3>
          </div>
        </div>
        <select
          value={range}
          onChange={(e) => {
            setRange(e.target.value as SalesTrendRange);
            setHoverIdx(null);
          }}
          className="bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-600 rounded-lg px-2 py-1 cursor-pointer shrink-0"
        >
          {RANGE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {t(RANGE_LABEL_KEYS[option])}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-1.5 mb-2">
        <div className="rounded-lg bg-violet-50/80 border border-violet-100 px-2 py-1.5 min-w-0">
          <p className="text-[9px] font-bold text-violet-600 uppercase tracking-wide truncate">{t('dashboard.revenue_total')}</p>
          <p className="text-xs font-extrabold text-slate-900 tabular-nums mt-0.5 truncate">{formatMoney(total)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-100 px-2 py-1.5 min-w-0">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide truncate">{t('dashboard.revenue_avg')}</p>
          <p className="text-xs font-extrabold text-slate-900 tabular-nums mt-0.5 truncate">{formatMoney(average)}</p>
        </div>
        <div className="rounded-lg bg-emerald-50/80 border border-emerald-100 px-2 py-1.5 min-w-0">
          <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide truncate">{t('dashboard.sales_trend_peak')}</p>
          <p className="text-xs font-extrabold text-slate-900 tabular-nums mt-0.5 truncate">
            {activePoint && activePoint.value > 0
              ? `${activePoint.label} · ${formatCompactMoney(activePoint.value)}`
              : '—'}
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-[9.5rem] flex gap-2">
        <div className="flex flex-col justify-between text-[9px] font-bold text-slate-400 pb-6 shrink-0 w-10 text-right">
          {yTicks.map((tick) => (
            <span key={tick} className="tabular-nums leading-none">
              {formatCompactMoney(tick)}
            </span>
          ))}
        </div>

        <div className="flex-1 relative min-w-0">
          <div className="absolute inset-0 bottom-6 flex flex-col justify-between pointer-events-none">
            {yTicks.slice(0, -1).map((tick) => (
              <div key={tick} className="border-t border-dashed border-slate-100 w-full" />
            ))}
          </div>

          <div className="absolute inset-0 bottom-6 flex items-end justify-between gap-1.5">
            {series.map((point, idx) => {
              const heightPct = point.value > 0 ? Math.max(6, (point.value / maxValue) * 100) : 3;
              const isActive = idx === activeIdx;
              return (
                <div
                  key={point.key}
                  className="flex-1 flex flex-col items-center justify-end h-full min-w-0 group"
                  onMouseEnter={() => setHoverIdx(idx)}
                  onMouseLeave={() => setHoverIdx(null)}
                >
                  <span
                    className={`text-[9px] font-extrabold mb-1 tabular-nums transition-opacity ${
                      isActive ? 'text-violet-600 opacity-100' : 'text-slate-500 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {point.value > 0 ? formatCompactMoney(point.value) : ''}
                  </span>
                  <div
                    className={`w-full max-w-12 rounded-t-lg transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-t from-violet-700 to-violet-500 shadow-md shadow-violet-200/60'
                        : 'bg-gradient-to-t from-violet-400/70 to-violet-300/50 group-hover:from-violet-600 group-hover:to-violet-400'
                    }`}
                    style={{ height: `${heightPct}%` }}
                    title={`${point.label}: ${formatMoney(point.value)}`}
                  />
                </div>
              );
            })}
          </div>

          <div className="absolute bottom-0 left-0 w-full flex justify-between border-t border-slate-100 pt-2">
            {series.map((point) => (
              <span
                key={`${point.key}-lbl`}
                className={`flex-1 text-center font-bold text-slate-500 truncate px-0.5 ${series.length > 14 ? 'text-[8px]' : 'text-[10px]'}`}
              >
                {point.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
