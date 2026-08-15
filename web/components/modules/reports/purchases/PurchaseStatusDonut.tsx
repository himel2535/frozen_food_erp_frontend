'use client';

import { useRef } from 'react';
import { Icon } from '@iconify/react';
import { useAppStore } from '@/lib/state/app-store';
import { formatCurrency } from '@/lib/services/domain-service';
import { PR_CARD, PR_STATUS_SLICE } from '@/components/modules/reports/purchases/purchase-report-styles';
import { ReportSectionHeader } from '@/components/modules/reports/shared/ReportSectionHeader';
import {
  buildDonutArcs,
  DEFAULT_DONUT_COLORS,
  DONUT_CENTER,
  DONUT_CIRCUMFERENCE,
  DONUT_RADIUS,
  DONUT_SIZE,
  DONUT_STROKE,
  type DonutArcSlice,
} from '@/components/modules/reports/shared/donut-chart-utils';
import { buildMotionKey, useDonutChartMotion } from '@/components/modules/reports/shared/useReportChartIntro';
import { ReportLegendBar } from '@/components/modules/reports/shared/ReportLegendBar';
import type { PurchaseStatusSummary } from '@/components/modules/reports/purchases/purchase-report-utils';

const SLICE_KEYS = ['received', 'pending', 'cancelled'] as const;
type SliceKey = (typeof SLICE_KEYS)[number];

export function PurchaseStatusDonut({
  summary,
  onPrint,
}: {
  summary: PurchaseStatusSummary;
  onPrint?: () => void;
}) {
  const t = useAppStore((s) => s.t);

  const amounts: Record<SliceKey, number> = {
    received: summary.received,
    pending: summary.pending,
    cancelled: summary.cancelled,
  };
  const totalAmount = summary.totalAmount;

  const slices: DonutArcSlice[] = SLICE_KEYS.map((key) => ({
    key,
    label: t(`reports.purchases_status_${key}`),
    amount: amounts[key],
    pct: totalAmount > 0 ? (amounts[key] / totalAmount) * 100 : 0,
  }));

  const arcs = buildDonutArcs(slices, totalAmount);
  const hasChartData = arcs.length > 0 && totalAmount > 0;
  const svgRef = useRef<SVGSVGElement>(null);
  const motionKey = buildMotionKey([totalAmount, ...SLICE_KEYS.map((key) => `${key}:${amounts[key]}`)]);
  const introDone = useDonutChartMotion(motionKey, hasChartData ? arcs.length : 1, svgRef);

  return (
    <div className={`${PR_CARD} flex flex-col`}>
      <ReportSectionHeader
        icon={<Icon icon="fluent-color:pie-single-24" width={24} height={24} className="shrink-0" />}
        title={t('reports.purchases_by_status')}
        onPrint={onPrint}
        printLabel={t('reports.print_section')}
      />

      <div className="flex flex-col items-center gap-2.5 flex-1">
        <div className="relative shrink-0" style={{ width: DONUT_SIZE, height: DONUT_SIZE }}>
          <svg ref={svgRef} width={DONUT_SIZE} height={DONUT_SIZE} className="drop-shadow-sm" aria-hidden>
            <defs>
              <linearGradient id="pr-status-empty" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={DEFAULT_DONUT_COLORS.from} stopOpacity="0.55" />
                <stop offset="100%" stopColor={DEFAULT_DONUT_COLORS.to} stopOpacity="0.35" />
              </linearGradient>
              {SLICE_KEYS.map((key) => (
                <linearGradient key={key} id={`pr-slice-${key}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={PR_STATUS_SLICE[key].from} />
                  <stop offset="100%" stopColor={PR_STATUS_SLICE[key].to} />
                </linearGradient>
              ))}
            </defs>
            <circle cx={DONUT_CENTER} cy={DONUT_CENTER} r={DONUT_RADIUS} fill="none" stroke="#eef2f7" strokeWidth={DONUT_STROKE} />
            {!hasChartData ? (
              <circle
                data-donut-arc=""
                data-arc-length={DONUT_CIRCUMFERENCE * 0.96}
                data-circumference={DONUT_CIRCUMFERENCE}
                cx={DONUT_CENTER}
                cy={DONUT_CENTER}
                r={DONUT_RADIUS}
                fill="none"
                stroke="url(#pr-status-empty)"
                strokeWidth={DONUT_STROKE}
                strokeLinecap="round"
                strokeDasharray={
                  introDone
                    ? `${DONUT_CIRCUMFERENCE * 0.96} ${DONUT_CIRCUMFERENCE * 0.04}`
                    : `0 ${DONUT_CIRCUMFERENCE}`
                }
                transform={`rotate(-90 ${DONUT_CENTER} ${DONUT_CENTER})`}
              />
            ) : (
              arcs.map(({ key, length, offset }) => (
                <circle
                  key={key}
                  data-donut-arc=""
                  data-arc-length={length}
                  data-circumference={DONUT_CIRCUMFERENCE}
                  cx={DONUT_CENTER}
                  cy={DONUT_CENTER}
                  r={DONUT_RADIUS}
                  fill="none"
                  stroke={`url(#pr-slice-${key})`}
                  strokeWidth={DONUT_STROKE}
                  strokeLinecap="round"
                  strokeDasharray={
                    introDone
                      ? `${length} ${DONUT_CIRCUMFERENCE - length}`
                      : `0 ${DONUT_CIRCUMFERENCE}`
                  }
                  strokeDashoffset={-offset}
                  transform={`rotate(-90 ${DONUT_CENTER} ${DONUT_CENTER})`}
                />
              ))
            )}
          </svg>
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ padding: DONUT_STROKE }}
          >
            <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white/95 text-center px-2">
              <span className="text-[10px] font-bold text-slate-500 leading-tight">{t('reports.purchases_total_label')}</span>
              <span className="text-xs font-extrabold text-slate-900 tabular-nums leading-tight mt-0.5 break-words max-w-full">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full space-y-2">
          {slices.map((slice, idx) => {
            const colors = PR_STATUS_SLICE[slice.key as SliceKey];
            return (
              <div key={slice.key} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }}
                    />
                    <span className="truncate">{slice.label}</span>
                  </span>
                  <span className="font-bold text-slate-800 tabular-nums shrink-0">{formatCurrency(amounts[slice.key as SliceKey])}</span>
                </div>
                <ReportLegendBar
                  pct={slice.pct}
                  from={colors.from}
                  to={colors.to}
                  delayMs={idx * 80}
                  animateKey={motionKey}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
