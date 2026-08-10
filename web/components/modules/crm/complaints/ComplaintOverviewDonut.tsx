'use client';

const SLICE_META = {
  open: { from: '#3b82f6', to: '#60a5fa', label: 'Open' },
  inProgress: { from: '#f59e0b', to: '#fbbf24', label: 'In Progress' },
  resolved: { from: '#10b981', to: '#34d399', label: 'Resolved' },
  overdue: { from: '#ef4444', to: '#f87171', label: 'Overdue' },
} as const;

type SliceKey = keyof typeof SLICE_META;

const SIZE = 148;
const STROKE = 16;
const CENTER = SIZE / 2;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SEGMENT_GAP = 3;

export function ComplaintOverviewDonut({
  summary,
}: {
  summary: { open: number; inProgress: number; resolved: number; overdue: number; total: number };
}) {
  const counts: Record<SliceKey, number> = {
    open: summary.open,
    inProgress: summary.inProgress,
    resolved: summary.resolved,
    overdue: summary.overdue,
  };
  const total = summary.total;

  const activeSlices = (Object.keys(SLICE_META) as SliceKey[])
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

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="drop-shadow-sm" aria-hidden>
          <defs>
            {(Object.keys(SLICE_META) as SliceKey[]).map((key) => (
              <linearGradient key={key} id={`cmp-slice-${key}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={SLICE_META[key].from} />
                <stop offset="100%" stopColor={SLICE_META[key].to} />
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
              stroke={`url(#cmp-slice-${key})`}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${CENTER} ${CENTER})`}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[76px] h-[76px] rounded-full bg-white/95 border border-slate-100 shadow-sm flex flex-col items-center justify-center">
            <span className="text-xl font-extrabold text-slate-900 tabular-nums leading-none">{total}</span>
            <span className="text-[9px] font-bold text-slate-500 mt-0.5 uppercase tracking-wide">Total</span>
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-2 gap-x-3 gap-y-2">
        {(Object.keys(SLICE_META) as SliceKey[]).map((key) => {
          const count = counts[key];
          const pct = total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
          const meta = SLICE_META[key];
          return (
            <div key={key} className="flex items-center justify-between gap-2 text-[11px] min-w-0">
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: `linear-gradient(135deg, ${meta.from}, ${meta.to})` }}
                />
                <span className="truncate">{meta.label}</span>
              </span>
              <span className="font-bold text-slate-800 tabular-nums shrink-0">
                {count} <span className="text-slate-400 font-semibold">({pct}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
