'use client';

import type { DealStageSlice } from '@/lib/services/deals-pipeline-service';

const SIZE = 148;
const STROKE = 16;
const CENTER = SIZE / 2;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SEGMENT_GAP = 3;

export function DealPipelineDonut({
  slices,
  totalValue,
  formatMoney,
}: {
  slices: DealStageSlice[];
  totalValue: number;
  formatMoney: (n: number) => string;
}) {
  const active = slices.filter((s) => s.value > 0);
  const gapTotal = active.length > 1 ? active.length * SEGMENT_GAP : 0;
  const usable = CIRCUMFERENCE - gapTotal;
  let offset = 0;

  const arcs = active.map((slice) => {
    const length = totalValue > 0 ? (slice.value / totalValue) * usable : 0;
    const arc = { slice, length, offset };
    offset += length + (active.length > 1 ? SEGMENT_GAP : 0);
    return arc;
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} aria-hidden>
          <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="#f1f5f9" strokeWidth={STROKE} />
          {arcs.map(({ slice, length, offset: arcOffset }) => (
            <circle
              key={slice.key}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={slice.color}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
              strokeDashoffset={-arcOffset}
              transform={`rotate(-90 ${CENTER} ${CENTER})`}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[76px] h-[76px] rounded-full bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center px-1">
            <span className="text-[11px] font-extrabold text-slate-900 tabular-nums leading-tight text-center">{formatMoney(totalValue)}</span>
            <span className="text-[9px] font-bold text-slate-500 mt-0.5">Total Pipeline</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full space-y-2">
        {slices.map((slice) => (
          <div key={slice.key} className="flex items-center justify-between gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600 min-w-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
              <span className="truncate">{slice.label}</span>
            </span>
            <span className="font-bold text-slate-800 tabular-nums shrink-0">
              {formatMoney(slice.value)} <span className="text-slate-400 font-semibold">({slice.pct}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
