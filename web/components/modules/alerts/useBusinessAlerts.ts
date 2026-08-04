'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/state/app-store';
import {
  buildBusinessAlerts,
  filterAlertsByRole,
  getAlertSettings,
  getVisibleCategories,
  summarizeAlerts,
  type AlertCategory,
  type AlertSummary,
  type BusinessAlert,
} from '@/lib/services/business-alert-service';

export function useBusinessAlerts() {
  const appState = useAppStore((s) => s.appState);

  return useMemo(() => {
    const settings = getAlertSettings(appState);
    const role = String(appState.currentUser?.role ?? 'admin');
    const all = buildBusinessAlerts(appState, settings);
    const alerts = filterAlertsByRole(all, role, settings);
    const summaries = summarizeAlerts(alerts);
    const visibleCategories = getVisibleCategories(role, settings);
    const totalCount = alerts.length;

    const previewAlerts = [...alerts]
      .sort((a, b) => {
        const rank = { critical: 3, warning: 2, info: 1 };
        const pd = rank[b.priority] - rank[a.priority];
        if (pd !== 0) return pd;
        return b.sortKey - a.sortKey;
      })
      .slice(0, 6);

    return {
      alerts,
      summaries,
      visibleCategories,
      totalCount,
      previewAlerts,
      settings,
      role,
    };
  }, [appState]);
}

export type { AlertCategory, AlertSummary, BusinessAlert };
