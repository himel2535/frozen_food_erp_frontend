'use client';

import { useEffect, useState, type RefObject } from 'react';
import { runDonutArcMotion } from '@/components/modules/reports/shared/chart-motion';

export function buildMotionKey(parts: Array<string | number>): string {
  return parts.join('|');
}

/** Runs intro animation once per motionKey; keeps final state after introDone. */
export function useReportChartIntro(motionKey: string, durationMs: number, extraDelayMs = 0) {
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    setIntroDone(false);
    const timer = window.setTimeout(() => setIntroDone(true), durationMs + extraDelayMs);
    return () => window.clearTimeout(timer);
  }, [motionKey, durationMs, extraDelayMs]);

  return introDone;
}

export function useDonutChartMotion(
  motionKey: string,
  arcCount: number,
  svgRef: RefObject<SVGSVGElement | null>,
) {
  const introDone = useReportChartIntro(motionKey, 850, arcCount * 70);

  useEffect(() => {
    if (introDone) return;
    const frame = requestAnimationFrame(() => {
      runDonutArcMotion(svgRef.current, '[data-donut-arc]');
    });
    return () => cancelAnimationFrame(frame);
  }, [motionKey, introDone, svgRef]);

  return introDone;
}
