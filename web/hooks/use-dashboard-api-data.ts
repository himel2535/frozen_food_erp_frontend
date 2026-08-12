'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/state/app-store';
import { isMongoDbBackend } from '@/lib/config/data-source';
import type { AppState } from '@/lib/state/types';
import { emptyDashboardShell } from '@/lib/services/dashboard-state';
import { useDashboardStateOverride } from '@/components/providers/DashboardStateProvider';

export { DashboardStateProvider } from '@/components/providers/DashboardStateProvider';

/** Dashboard reads MongoDB data only after global hydrator finishes — avoids demo-seed flicker. */
export function useDashboardReady(): boolean {
  return useAppStore((s) => s.apiDataReady);
}

/** Single source of truth for dashboard widgets — hydrated Zustand appState only. */
export function useDashboardAppState(): AppState {
  const override = useDashboardStateOverride();
  const appState = useAppStore((s) => s.appState);
  const ready = useDashboardReady();

  return useMemo(() => {
    if (ready) return appState;
    if (override) return override;
    if (isMongoDbBackend()) {
      return emptyDashboardShell(appState);
    }
    return appState;
  }, [appState, ready, override]);
}

export { emptyDashboardShell };
