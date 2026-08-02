'use client';

import {
  PD_CHART_SLICE,
  PD_STATUS_LABEL,
} from '@/components/modules/payroll/payments-due/payments-due-styles';

const SLICE_KEYS = ['paid', 'partial', 'unpaid', 'notProcessed'] as const;
type SliceKey = (typeof SLICE_KEYS)[number];

const SIZE = 140;
const STROKE = 14;
const CENTER = SIZE / 2;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SEGMENT_GAP = 4;

export function PaymentStatusDonut({
  summary,
}: {
  summary: { paid: number; partial: number; unpaid: number; notProcessed: number; total: number };
}) {
  const counts: Record<SliceKey, number> = {
    paid: summary.paid,
    partial: summary.partial,
    unpaid: summary.unpaid,
    notProcessed: summary.notProcessed,
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
    <div className="flex flex-col items-center gap-2.5 w-full">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="drop-shadow-sm" aria-hidden>
          <defs>
            {SLICE_KEYS.map((key) => (
              <linearGradient key={key} id={`pd-slice-${key}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={PD_CHART_SLICE[key].from} />
                <stop offset="100%" stopColor={PD_CHART_SLICE[key].to} />
              </linearGradient>
            ))}
          </defs>
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={STROKE}
          />
          {arcs.map(({ key, length, offset }) => (
            <circle
              key={key}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={`url(#pd-slice-${key})`}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${CENTER} ${CENTER})`}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[72px] h-[72px] rounded-full bg-white/95 border border-slate-100 shadow-sm flex flex-col items-center justify-center">
            <span className="text-xl font-extrabold text-emerald-600 tabular-nums leading-none">{paidPct}%</span>
            <span className="text-[10px] font-bold text-slate-500 mt-0.5">Paid</span>
            <span className="text-[9px] font-semibold text-slate-400 mt-0.5">{total} total</span>
          </div>
        </div>
      </div>

      {legendSlices.length ? (
        <div className="w-full space-y-2">
          {legendSlices.map((key) => {
            const count = counts[key];
            const pct = total > 0 ? (count / total) * 100 : 0;
            const colors = PD_CHART_SLICE[key];
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }}
                    />
                    <span className="truncate">{PD_STATUS_LABEL[key]}</span>
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
        <p className="text-[11px] font-medium text-slate-400 w-full text-center">No status data yet.</p>
      )}
    </div>
  );
}
