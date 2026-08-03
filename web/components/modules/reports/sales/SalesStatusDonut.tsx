'use client';

import { useAppStore } from '@/lib/state/app-store';
import { SR_CARD, SR_STATUS_SLICE } from '@/components/modules/reports/sales/sales-report-styles';
import { ReportSectionHeader } from '@/components/modules/reports/shared/ReportSectionHeader';
import type { SalesStatusSummary } from '@/components/modules/reports/sales/sales-report-utils';
import { Icon } from '@iconify/react';

const SLICE_KEYS = ['paid', 'unpaid', 'partial', 'cancelled'] as const;
type SliceKey = (typeof SLICE_KEYS)[number];

const SIZE = 120;
const STROKE = 12;
const CENTER = SIZE / 2;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SEGMENT_GAP = 3;

export function SalesStatusDonut({
  summary,
  onPrint,
}: {
  summary: SalesStatusSummary;
  onPrint?: () => void;
}) {
  const t = useAppStore((s) => s.t);

  const counts: Record<SliceKey, number> = {
    paid: summary.paid,
    unpaid: summary.unpaid,
    partial: summary.partial,
    cancelled: summary.cancelled,
  };
  const total = summary.total;
  const paidPct = total > 0 ? Math.round((summary.paid / total) * 100) : 0;

  const activeSlices = SLICE_KEYS
    .map((key) => ({ key, count: counts[key] }))
    .filter((slice) => slice.count > 0);

  const gapTotal = activeSlices.length > 1 ? activeSlices.length * SEGMENT_GAP : 0;
  const usable = CIRCUMFERENCE - gapTotal;

  let runningOffset = 0;
  const arcs = activeSlices.map(({ key, count }) => {
    const length = total > 0 ? (count / total) * usable : 0;
    const arc = { key, length, offset: runningOffset };
    runningOffset += length + (activeSlices.length > 1 ? SEGMENT_GAP : 0);
    return arc;
  });

  const legendSlices = SLICE_KEYS.filter((key) => counts[key] > 0);

  return (
    <div className={`${SR_CARD} flex flex-col`}>
      <ReportSectionHeader
        icon={<Icon icon="fluent-color:pie-single-24" width={24} height={24} className="shrink-0" />}
        title={t('reports.sales_by_status')}
        onPrint={onPrint}
        printLabel={t('reports.print_section')}
      />

      <div className="flex flex-col items-center gap-2.5 flex-1">
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} className="drop-shadow-sm" aria-hidden>
            <defs>
              {SLICE_KEYS.map((key) => (
                <linearGradient key={key} id={`sr-slice-${key}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={SR_STATUS_SLICE[key].from} />
                  <stop offset="100%" stopColor={SR_STATUS_SLICE[key].to} />
                </linearGradient>
              ))}
            </defs>
            <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="#f1f5f9" strokeWidth={STROKE} />
            {arcs.map(({ key, length, offset }) => (
              <circle
                key={key}
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke={`url(#sr-slice-${key})`}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${CENTER} ${CENTER})`}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-white/95 border border-slate-100 shadow-sm flex flex-col items-center justify-center">
              <span className="text-lg font-extrabold text-emerald-600 tabular-nums leading-none">{paidPct}%</span>
              <span className="text-[9px] font-bold text-slate-500 mt-0.5">{t('reports.sales_paid_label')}</span>
            </div>
          </div>
        </div>

        {legendSlices.length ? (
          <div className="w-full space-y-2">
            {legendSlices.map((key) => {
              const count = counts[key];
              const pct = total > 0 ? (count / total) * 100 : 0;
              const colors = SR_STATUS_SLICE[key];
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }}
                      />
                      <span className="truncate">{t(`reports.sales_status_${key}`)}</span>
                    </span>
                    <span className="font-bold text-slate-800 tabular-nums shrink-0">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${colors.from}, ${colors.to})`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[11px] font-medium text-slate-400 w-full text-center">{t('reports.sales_no_status_data')}</p>
        )}
      </div>
    </div>
  );
}
