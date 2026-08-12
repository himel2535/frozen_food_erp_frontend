export function donutGradientId(prefix: string, index: number): string {
  return `${prefix}-grad-${index}`;
}

export const DONUT_SIZE = 120;
export const DONUT_STROKE = 12;
export const DONUT_CENTER = DONUT_SIZE / 2;
export const DONUT_RADIUS = (DONUT_SIZE - DONUT_STROKE) / 2;
export const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;
export const DONUT_SEGMENT_GAP = 3;

export type DonutArcSlice = {
  key: string;
  label: string;
  amount: number;
  pct: number;
};

export type DonutColorPair = { from: string; to: string };

export function buildDonutArcs(
  slices: DonutArcSlice[],
  totalAmount: number,
): { key: string; length: number; offset: number; idx: number }[] {
  const activeSlices = slices.filter((slice) => slice.amount > 0);
  const gapTotal = activeSlices.length > 1 ? activeSlices.length * DONUT_SEGMENT_GAP : 0;
  const usable = DONUT_CIRCUMFERENCE - gapTotal;

  let runningOffset = 0;
  return activeSlices.map((slice, idx) => {
    const length = totalAmount > 0 ? (slice.amount / totalAmount) * usable : 0;
    const arc = { key: slice.key, length, offset: runningOffset, idx };
    runningOffset += length + (activeSlices.length > 1 ? DONUT_SEGMENT_GAP : 0);
    return arc;
  });
}

export function pickLegendSlices(slices: DonutArcSlice[], limit = 6): DonutArcSlice[] {
  if (!slices.length) return [];
  const sorted = [...slices].sort((a, b) => b.pct - a.pct || b.amount - a.amount);
  return sorted.slice(0, limit);
}

export const DEFAULT_DONUT_COLORS: DonutColorPair = { from: '#3b82f6', to: '#2563eb' };
