'use client';

import { useEffect, useState } from 'react';

export function ReportLegendBar({
  pct,
  from,
  to,
  delayMs = 0,
  animateKey = '',
}: {
  pct: number;
  from: string;
  to: string;
  delayMs?: number;
  animateKey?: string;
}) {
  const target = Math.max(0, Math.min(100, pct));
  const [width, setWidth] = useState(0);

  useEffect(() => {
    setWidth(0);
    if (target <= 0) return undefined;
    const timer = window.setTimeout(() => setWidth(target), 60 + delayMs);
    return () => window.clearTimeout(timer);
  }, [target, delayMs, animateKey]);

  return (
    <div
      className="h-1.5 rounded-full overflow-hidden"
      style={{ background: `linear-gradient(90deg, ${from}18, ${to}10)` }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out shadow-sm"
        style={{
          width: `${width}%`,
          minWidth: width > 0 ? '6px' : undefined,
          background: `linear-gradient(90deg, ${from}, ${to})`,
        }}
      />
    </div>
  );
}
