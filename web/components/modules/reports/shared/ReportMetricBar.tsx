'use client';

import { ReportLegendBar } from '@/components/modules/reports/shared/ReportLegendBar';

export function ReportMetricBar({
  value,
  max,
  from,
  to,
  delayMs = 0,
  animateKey = '',
}: {
  value: number;
  max: number;
  from: string;
  to: string;
  delayMs?: number;
  animateKey?: string;
}) {
  const pct = max > 0 ? Math.min(100, (Math.abs(value) / max) * 100) : value !== 0 ? 8 : 0;

  return (
    <ReportLegendBar
      pct={pct}
      from={from}
      to={to}
      delayMs={delayMs}
      animateKey={animateKey}
    />
  );
}
