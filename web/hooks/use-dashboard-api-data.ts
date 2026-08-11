'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/state/app-store';
import { isMongoDbBackend } from '@/lib/config/data-source';
import type { AppState } from '@/lib/state/types';

/** Dashboard reads MongoDB data only after global hydrator finishes — avoids demo-seed flicker. */
export function useDashboardReady(): boolean {
  return useAppStore((s) => s.apiDataReady);
}

const EMPTY_LIST_KEYS: (keyof AppState)[] = [
  'salesOrders',
  'invoices',
  'posReceipts',
  'crmCustomers',
  'leads',
  'inventory',
  'rawMaterials',
  'semiFinishedProducts',
  'finishedGoods',
  'productionOrders',
  'purchases',
  'purchasesSuppliers',
  'projects',
  'deals',
  'quotations',
  'deliveries',
  'payments',
  'purchaseRmOrders',
];

function emptyDashboardShell(base: AppState): AppState {
  const shell = { ...base } as AppState;
  for (const key of EMPTY_LIST_KEYS) {
    (shell as Record<string, unknown>)[key] = [];
  }
  return shell;
}

/** Single source of truth for dashboard widgets — hydrated Zustand appState only. */
export function useDashboardAppState(): AppState {
  const appState = useAppStore((s) => s.appState);
  const ready = useDashboardReady();

  return useMemo(() => {
    if (isMongoDbBackend() && !ready) {
      return emptyDashboardShell(appState);
    }
    return appState;
  }, [appState, ready]);
}
