'use client';

import { useEffect } from 'react';
import { readActivityMode } from '@/lib/config/dashboard-activity-mode';
import {
  readPerfCollectEnabled,
  storePerfSample,
  type DashboardPerfSample,
} from '@/lib/config/dashboard-perf-collect';

/** Collects FCP/LCP + dashboard marks when ?perfCollect=1 (A/B/C harness). */
export function DashboardPerfCollector() {
  useEffect(() => {
    if (!readPerfCollectEnabled()) return;

    const sample: DashboardPerfSample = {
      activityMode: readActivityMode(),
      fcpMs: null,
      lcpMs: null,
      lcpElement: '',
      ttfbMs: null,
      chunkEvalMs: null,
      viewMountedMs: null,
      collectedAt: new Date().toISOString(),
    };

    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (nav) sample.ttfbMs = nav.responseStart;

    const fcpObs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') sample.fcpMs = entry.startTime;
      }
    });
    fcpObs.observe({ type: 'paint', buffered: true });

    const lcpObs = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1] as PerformanceEntry & { element?: Element };
      if (!last) return;
      sample.lcpMs = last.startTime;
      sample.lcpElement = last.element
        ? `${last.element.tagName} ${(last.element.textContent ?? '').trim().slice(0, 100)}`
        : '';
    });
    lcpObs.observe({ type: 'largest-contentful-paint', buffered: true });

    const timer = window.setTimeout(() => {
      const chunkMark = performance.getEntriesByName('dashboard-view-chunk-evaluated')[0];
      const mountMark = performance.getEntriesByName('dashboard-view-mounted')[0];
      if (chunkMark) sample.chunkEvalMs = chunkMark.startTime;
      if (mountMark) sample.viewMountedMs = mountMark.startTime;
      storePerfSample(sample);
      fcpObs.disconnect();
      lcpObs.disconnect();
    }, 12000);

    return () => {
      window.clearTimeout(timer);
      fcpObs.disconnect();
      lcpObs.disconnect();
    };
  }, []);

  return null;
}
