'use client';

import { useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { useAppStore } from '@/lib/state/app-store';
import { useDashboardAppState } from '@/hooks/use-dashboard-api-data';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { getSalesTrendSeries, niceChartAxisMax, type SalesTrendRange } from '@/lib/services/dashboard-service';

const RANGE_OPTIONS: SalesTrendRange[] = ['day', 'week', 'month', 'quarter', 'year'];

const RANGE_LABEL_KEYS: Record<SalesTrendRange, string> = {
  day: 'dashboard.filter_day',
  week: 'dashboard.filter_week',
  month: 'dashboard.filter_month',
  quarter: 'dashboard.last_quarter',
  year: 'dashboard.filter_year',
};

const RANGE_HINT_KEYS: Record<SalesTrendRange, string> = {
  day: 'dashboard.sales_trend_day_hint',
  week: 'dashboard.sales_trend_week_hint',
  month: 'dashboard.sales_trend_month_hint',
  quarter: 'dashboard.sales_trend_quarter_hint',
  year: 'dashboard.sales_trend_year_hint',
};

export function SalesTrendChart() {
  const appState = useDashboardAppState();
  const t = useAppStore((s) => s.t);
  const { formatMoney, formatCompactMoney } = useLocaleFormat();
  const [range, setRange] = useState<SalesTrendRange>('month');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const series = useMemo(() => getSalesTrendSeries(appState, range), [appState, range]);
  const total = useMemo(() => series.reduce((s, p) => s + p.value, 0), [series]);
  const average = useMemo(() => (series.length ? total / series.length : 0), [series, total]);
  const maxValue = useMemo(() => niceChartAxisMax(Math.max(...series.map((p) => p.value), 1)), [series]);

  const peakIdx = useMemo(() => {
    let best = 0;
    series.forEach((p, i) => {
      if (p.value > series[best].value) best = i;
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
    <div className="premium-card p-4 premium-shadow lg:col-span-2 flex flex-col h-full">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Icon icon="fluent-color:data-trending-24" width={26} height={26} className="shrink-0" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">{t('dashboard.sales_trend')}</h3>
          </div>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">{t(RANGE_HINT_KEYS[range])}</p>
        </div>
        <select
          value={range}
          onChange={(e) => {
            setRange(e.target.value as SalesTrendRange);
            setHoverIdx(null);
          }}
          className="bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-600 rounded-lg px-2.5 py-1.5 cursor-pointer shrink-0"
        >
          {RANGE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {t(RANGE_LABEL_KEYS[option])}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl bg-blue-50/80 border border-blue-100 px-3 py-2">
          <p className="text-[9px] font-bold text-blue-600 uppercase tracking-wide">{t('dashboard.sales_trend_total')}</p>
          <p className="text-sm font-extrabold text-slate-900 tabular-nums mt-0.5">{formatMoney(total)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">{t('dashboard.sales_trend_avg')}</p>
          <p className="text-sm font-extrabold text-slate-900 tabular-nums mt-0.5">{formatMoney(average)}</p>
        </div>
        <div className="rounded-xl bg-emerald-50/80 border border-emerald-100 px-3 py-2">
          <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide">{t('dashboard.sales_trend_peak')}</p>
          <p className="text-sm font-extrabold text-slate-900 tabular-nums mt-0.5 truncate">
            {activePoint ? `${activePoint.label} · ${formatCompactMoney(activePoint.value)}` : '—'}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-end min-h-0">
      <div className="h-52 flex gap-2 shrink-0">
        <div className="flex flex-col justify-between text-[9px] font-bold text-slate-400 pb-6 shrink-0 w-10 text-right">
          {yTicks.map((tick) => (
            <span key={tick} className="tabular-nums leading-none">
              {formatCompactMoney(tick)}
            </span>
          ))}
        </div>

        <div className="flex-1 relative">
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
                      isActive ? 'text-blue-600 opacity-100' : 'text-slate-500 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {formatCompactMoney(point.value)}
                  </span>
                  <div
                    className={`w-full max-w-12 rounded-t-lg transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-t from-blue-700 to-blue-500 shadow-md shadow-blue-200/60'
                        : 'bg-gradient-to-t from-blue-400/70 to-blue-300/50 group-hover:from-blue-600 group-hover:to-blue-400'
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

      {activePoint ? (
        <p className="text-[10px] text-slate-400 font-medium mt-2 text-center shrink-0">
          {activePoint.label}
          {' · '}
          {t('dashboard.sales_trend_period_amount', { amount: formatMoney(activePoint.value) })}
        </p>
      ) : null}
      </div>
    </div>
  );
}
