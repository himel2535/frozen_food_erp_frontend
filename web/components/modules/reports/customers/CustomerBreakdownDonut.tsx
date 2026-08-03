'use client';

import { Icon } from '@iconify/react';
import { formatCurrency } from '@/lib/services/domain-service';
import { CR_CARD } from '@/components/modules/reports/customers/customer-report-styles';
import { ReportSectionHeader } from '@/components/modules/reports/shared/ReportSectionHeader';
import { donutGradientId } from '@/components/modules/reports/shared/donut-chart-utils';
import type { CustomerBreakdownSlice } from '@/components/modules/reports/customers/customer-report-utils';
import { getSliceColors } from '@/components/modules/reports/customers/customer-report-utils';

const SIZE = 120;
const STROKE = 12;
const CENTER = SIZE / 2;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SEGMENT_GAP = 3;

export function CustomerBreakdownDonut({
  title,
  icon,
  slices,
  totalAmount,
  colorMap,
  onPrint,
  printLabel,
  totalLabel,
  formatCenter,
  prefix = 'cr',
}: {
  title: string;
  icon: string;
  slices: CustomerBreakdownSlice[];
  totalAmount: number;
  colorMap: Record<string, { from: string; to: string }>;
  onPrint?: () => void;
  printLabel?: string;
  totalLabel: string;
  formatCenter?: (amount: number) => string;
  prefix?: string;
}) {
  const activeSlices = slices.filter((s) => s.amount > 0);
  const gapTotal = activeSlices.length > 1 ? activeSlices.length * SEGMENT_GAP : 0;
  const usable = CIRCUMFERENCE - gapTotal;

  let runningOffset = 0;
  const arcs = activeSlices.map((slice, idx) => {
    const length = totalAmount > 0 ? (slice.amount / totalAmount) * usable : 0;
    const arc = { key: slice.key, length, offset: runningOffset, idx };
    runningOffset += length + (activeSlices.length > 1 ? SEGMENT_GAP : 0);
    return arc;
  });

  const centerText = formatCenter ? formatCenter(totalAmount) : formatCurrency(totalAmount);

  return (
    <div className={`${CR_CARD} flex flex-col`}>
      <ReportSectionHeader
        icon={<Icon icon={icon} width={24} height={24} className="shrink-0" />}
        title={title}
        onPrint={onPrint}
        printLabel={printLabel}
      />

      <div className="flex flex-col items-center gap-2.5 flex-1">
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} className="drop-shadow-sm" aria-hidden>
            <defs>
              {activeSlices.map((slice, idx) => {
                const colors = getSliceColors(colorMap, slice.key, idx);
                return (
                  <linearGradient key={slice.key} id={donutGradientId(prefix, idx)} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={colors.from} />
                    <stop offset="100%" stopColor={colors.to} />
                  </linearGradient>
                );
              })}
            </defs>
            <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="#f1f5f9" strokeWidth={STROKE} />
            {arcs.map(({ key, length, offset, idx }) => {
              const slice = activeSlices[idx];
              if (!slice) return null;
              return (
                <circle
                  key={key}
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS}
                  fill="none"
                  stroke={`url(#${donutGradientId(prefix, idx)})`}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
                  strokeDashoffset={-offset}
                  transform={`rotate(-90 ${CENTER} ${CENTER})`}
                />
              );
            })}
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

        {activeSlices.length ? (
          <div className="w-full space-y-2">
            {activeSlices.map((slice, idx) => {
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
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${slice.pct}%`,
                        background: `linear-gradient(90deg, ${colors.from}, ${colors.to})`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
