'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
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
import { isMongoDbBackend, type ApiModule } from '@/lib/config/data-source';
import { fetchDashboardBusinessAlerts } from '@/lib/services/api-resource-service';
import { onApiMutation } from '@/lib/services/api-sync-events';

const ALERT_MUTATION_MODULES = new Set<string>([
  'leads',
  'customers',
  'products',
  'rawMaterials',
  'semiFinishedProducts',
  'finishedGoods',
  'purchaseOrders',
  'productionOrders',
  'invoices',
  'dues',
  'payments',
]);

function emptyResult(role: string, settings: ReturnType<typeof getAlertSettings>) {
  return {
    alerts: [] as BusinessAlert[],
    summaries: [] as AlertSummary[],
    visibleCategories: getVisibleCategories(role, settings),
    totalCount: 0,
    previewAlerts: [] as BusinessAlert[],
    settings,
    role,
    loading: true,
  };
}

export function useBusinessAlerts() {
  const appState = useAppStore((s) => s.appState);
  const deferredState = useDeferredValue(appState);
  const mongo = isMongoDbBackend();
  const [apiAlerts, setApiAlerts] = useState<BusinessAlert[] | null>(null);
  const [apiSummaries, setApiSummaries] = useState<AlertSummary[] | null>(null);
  const [loading, setLoading] = useState(mongo);

  useEffect(() => {
    if (!mongo) return;
    let active = true;

    const load = async () => {
      const payload = await fetchDashboardBusinessAlerts();
      if (!active) return;
      if (!payload) {
        setApiAlerts([]);
        setApiSummaries([]);
        setLoading(false);
        return;
      }
      setApiAlerts(payload.items as BusinessAlert[]);
      setApiSummaries(payload.summaries as AlertSummary[]);
      setLoading(false);
    };

    void load();
    const unsubscribe = onApiMutation((modules) => {
      if (!modules?.some((mod) => ALERT_MUTATION_MODULES.has(mod as ApiModule))) return;
      void load();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [mongo]);

  return useMemo(() => {
    const settings = getAlertSettings(deferredState);
    const role = String(deferredState.currentUser?.role ?? 'admin');
    const visibleCategories = getVisibleCategories(role, settings);

    if (mongo) {
      if (loading || apiAlerts == null || apiSummaries == null) {
        return emptyResult(role, settings);
      }
      const alerts = filterAlertsByRole(apiAlerts, role, settings);
      const summaries = apiSummaries.filter((row) => visibleCategories.includes(row.category as AlertCategory));
      const totalCount = summaries.reduce((sum, row) => sum + row.count, 0);
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
        loading: false,
      };
    }

    const all = buildBusinessAlerts(deferredState, settings);
    const alerts = filterAlertsByRole(all, role, settings);
    const summaries = summarizeAlerts(alerts);
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
      loading: false,
    };
  }, [deferredState, mongo, loading, apiAlerts, apiSummaries]);
}

export type { AlertCategory, AlertSummary, BusinessAlert };
