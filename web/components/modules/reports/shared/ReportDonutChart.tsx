'use client';

import { useRef } from 'react';
import { Icon } from '@iconify/react';
import { formatCurrency } from '@/lib/services/domain-service';
import { ReportSectionHeader } from '@/components/modules/reports/shared/ReportSectionHeader';
import {
  buildDonutArcs,
  DEFAULT_DONUT_COLORS,
  DONUT_CENTER,
  DONUT_CIRCUMFERENCE,
  DONUT_RADIUS,
  DONUT_SIZE,
  DONUT_STROKE,
  donutGradientId,
  pickLegendSlices,
  type DonutArcSlice,
  type DonutColorPair,
} from '@/components/modules/reports/shared/donut-chart-utils';
import { buildMotionKey, useDonutChartMotion } from '@/components/modules/reports/shared/useReportChartIntro';
import { ReportLegendBar } from '@/components/modules/reports/shared/ReportLegendBar';

export function ReportDonutChart({
  title,
  icon,
  slices,
  totalAmount,
  colorMap,
  cardClass,
  onPrint,
  printLabel,
  totalLabel,
  formatCenter,
  prefix = 'donut',
  getSliceColors,
  legendLimit = 6,
}: {
  title: string;
  icon: string;
  slices: DonutArcSlice[];
  totalAmount: number;
  colorMap: Record<string, DonutColorPair>;
  cardClass: string;
  onPrint?: () => void;
  printLabel?: string;
  totalLabel: string;
  formatCenter?: (amount: number) => string;
  prefix?: string;
  getSliceColors: (colorMap: Record<string, DonutColorPair>, key: string, idx: number) => DonutColorPair;
  legendLimit?: number;
}) {
  const arcs = buildDonutArcs(slices, totalAmount);
  const legendSlices = pickLegendSlices(slices, legendLimit);
  const hasChartData = arcs.length > 0 && totalAmount > 0;
  const placeholderColors = legendSlices.length
    ? getSliceColors(colorMap, legendSlices[0].key, 0)
    : DEFAULT_DONUT_COLORS;

  const centerText = formatCenter ? formatCenter(totalAmount) : formatCurrency(totalAmount);
  const svgRef = useRef<SVGSVGElement>(null);
  const motionKey = buildMotionKey([
    prefix,
    totalAmount,
    ...slices.map((slice) => `${slice.key}:${slice.amount}:${slice.pct}`),
  ]);
  const introDone = useDonutChartMotion(motionKey, hasChartData ? arcs.length : 1, svgRef);

  return (
    <div className={`${cardClass} flex flex-col`}>
      <ReportSectionHeader
        icon={<Icon icon={icon} width={24} height={24} className="shrink-0" />}
        title={title}
        onPrint={onPrint}
        printLabel={printLabel}
      />

      <div className="flex flex-col items-center gap-2.5 flex-1">
        <div className="relative shrink-0" style={{ width: DONUT_SIZE, height: DONUT_SIZE }}>
          <svg ref={svgRef} width={DONUT_SIZE} height={DONUT_SIZE} className="drop-shadow-sm" aria-hidden>
            <defs>
              <linearGradient id={`${prefix}-empty`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={placeholderColors.from} stopOpacity="0.55" />
                <stop offset="100%" stopColor={placeholderColors.to} stopOpacity="0.35" />
              </linearGradient>
              {arcs.map(({ key, idx }) => {
                const colors = getSliceColors(colorMap, key, idx);
                return (
                  <linearGradient key={key} id={donutGradientId(prefix, idx)} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={colors.from} />
                    <stop offset="100%" stopColor={colors.to} />
                  </linearGradient>
                );
              })}
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
                stroke={`url(#${prefix}-empty)`}
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
              arcs.map(({ key, length, offset, idx }) => (
                <circle
                  key={key}
                  data-donut-arc=""
                  data-arc-length={length}
                  data-circumference={DONUT_CIRCUMFERENCE}
                  cx={DONUT_CENTER}
                  cy={DONUT_CENTER}
                  r={DONUT_RADIUS}
                  fill="none"
                  stroke={`url(#${donutGradientId(prefix, idx)})`}
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
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-white/95 border border-slate-100 shadow-sm flex flex-col items-center justify-center px-1">
              <span className="text-[9px] font-bold text-slate-500 leading-none">{totalLabel}</span>
              <span className="text-[10px] font-extrabold text-slate-900 tabular-nums leading-tight mt-0.5 text-center">
                {centerText}
              </span>
            </div>
          </div>
        </div>

        {legendSlices.length ? (
          <div className="w-full space-y-2">
            {legendSlices.map((slice, idx) => {
              const colors = getSliceColors(colorMap, slice.key, idx);
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
                    <span className="font-bold text-slate-800 tabular-nums shrink-0">{slice.pct.toFixed(1)}%</span>
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
        ) : null}
      </div>
    </div>
  );
}
