import type { AppState } from '@/lib/state/types';

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
  'dueEntries',
];

/** Zero out list fields so KPI math does not read demo-seed data before API hydration. */
export function emptyDashboardShell(base: AppState): AppState {
  const shell = { ...base } as AppState;
  for (const key of EMPTY_LIST_KEYS) {
    (shell as Record<string, unknown>)[key] = [];
  }
  return shell;
}
