export interface DashboardPerfSample {
  activityMode: string;
  fcpMs: number | null;
  lcpMs: number | null;
  lcpElement: string;
  ttfbMs: number | null;
  chunkEvalMs: number | null;
  viewMountedMs: number | null;
  collectedAt: string;
}

declare global {
  interface Window {
    __dashboardPerfSample?: DashboardPerfSample;
    __dashboardPerfHistory?: DashboardPerfSample[];
  }
}

export function readPerfCollectEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (sessionStorage.getItem('dashboard:perfCollect') === '1') return true;
    return new URLSearchParams(window.location.search).get('perfCollect') === '1';
  } catch {
    return false;
  }
}

export function storePerfSample(sample: DashboardPerfSample) {
  if (typeof window === 'undefined') return;
  window.__dashboardPerfSample = sample;
  const history = window.__dashboardPerfHistory ?? [];
  history.push(sample);
  window.__dashboardPerfHistory = history;
  try {
    sessionStorage.setItem('dashboard:lastPerfSample', JSON.stringify(sample));
  } catch {
    // ignore quota errors
  }
}
