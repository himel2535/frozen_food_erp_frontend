'use client';

import { Icon } from '@iconify/react';
import { useAppStore } from '@/lib/state/app-store';
import { formatCurrency } from '@/lib/services/domain-service';
import { PR_CARD, PR_STATUS_SLICE } from '@/components/modules/reports/purchases/purchase-report-styles';
import { ReportSectionHeader } from '@/components/modules/reports/shared/ReportSectionHeader';
import type { PurchaseStatusSummary } from '@/components/modules/reports/purchases/purchase-report-utils';

const SLICE_KEYS = ['received', 'pending', 'cancelled'] as const;
type SliceKey = (typeof SLICE_KEYS)[number];

const SIZE = 120;
const STROKE = 12;
const CENTER = SIZE / 2;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SEGMENT_GAP = 3;

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

  const activeSlices = SLICE_KEYS
    .map((key) => ({ key, amount: amounts[key] }))
    .filter((slice) => slice.amount > 0);

  const gapTotal = activeSlices.length > 1 ? activeSlices.length * SEGMENT_GAP : 0;
  const usable = CIRCUMFERENCE - gapTotal;

  let runningOffset = 0;
  const arcs = activeSlices.map(({ key, amount }) => {
    const length = totalAmount > 0 ? (amount / totalAmount) * usable : 0;
    const arc = { key, length, offset: runningOffset };
    runningOffset += length + (activeSlices.length > 1 ? SEGMENT_GAP : 0);
    return arc;
  });

  const legendSlices = SLICE_KEYS.filter((key) => amounts[key] > 0);

  return (
    <div className={`${PR_CARD} flex flex-col`}>
      <ReportSectionHeader
        icon={<Icon icon="fluent-color:pie-single-24" width={24} height={24} className="shrink-0" />}
        title={t('reports.purchases_by_status')}
        onPrint={onPrint}
        printLabel={t('reports.print_section')}
      />

      <div className="flex flex-col items-center gap-2.5 flex-1">
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} className="drop-shadow-sm" aria-hidden>
            <defs>
              {SLICE_KEYS.map((key) => (
                <linearGradient key={key} id={`pr-slice-${key}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={PR_STATUS_SLICE[key].from} />
                  <stop offset="100%" stopColor={PR_STATUS_SLICE[key].to} />
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
                stroke={`url(#pr-slice-${key})`}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${CENTER} ${CENTER})`}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-white/95 border border-slate-100 shadow-sm flex flex-col items-center justify-center px-1">
              <span className="text-[9px] font-bold text-slate-500 leading-none">{t('reports.purchases_total_label')}</span>
              <span className="text-[10px] font-extrabold text-slate-900 tabular-nums leading-tight mt-0.5 text-center">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {legendSlices.length ? (
          <div className="w-full space-y-2">
            {legendSlices.map((key) => {
              const amount = amounts[key];
              const pct = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
              const colors = PR_STATUS_SLICE[key];
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }}
                      />
                      <span className="truncate">{t(`reports.purchases_status_${key}`)}</span>
                    </span>
                    <span className="font-bold text-slate-800 tabular-nums shrink-0">{formatCurrency(amount)}</span>
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
          <p className="text-[11px] font-medium text-slate-400 w-full text-center">{t('reports.purchases_no_status_data')}</p>
        )}
      </div>
    </div>
  );
}
