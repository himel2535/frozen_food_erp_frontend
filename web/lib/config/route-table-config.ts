import type { ApiModule } from '@/lib/config/data-source';
import { ROUTE_PREFETCH_MODULES } from '@/lib/server/route-prefetch-config';
import { DEFAULT_LIST_PAGE_SIZE, type ApiListQuery } from '@/lib/services/api-pagination-types';

function normalizeRoutePath(pathname: string): string {
  return pathname.split('?')[0].split('#')[0].replace(/\/$/, '') || '/dashboard';
}

/** Single source of truth: route + module → default list query for hydrator and page hooks. */
export const ROUTE_MODULE_QUERIES: Partial<Record<string, Partial<Record<ApiModule, ApiListQuery>>>> = {
  '/crm/customers': { customers: { page: 1, limit: 200 } },
  '/crm/leads': { leads: { page: 1, limit: 10 } },
  '/crm/deals': { deals: { page: 1, limit: 25 } },
  '/crm/complaints': { complaints: { page: 1, limit: 8 } },
  '/crm/activities': { crmActivities: { page: 1, limit: 25 } },
  '/sales/orders': { salesOrders: { page: 1, limit: 25 } },
  '/sales/invoices': { invoices: { page: 1, limit: 25 } },
  '/sales/deliveries': { deliveries: { page: 1, limit: 25 } },
  '/sales/dispatch': { dispatch: { page: 1, limit: 25 } },
  '/sales/payments': { payments: { page: 1, limit: 25 } },
  '/sales/returns': { returns: { page: 1, limit: 25 } },
  '/sales/quotations': { quotations: { page: 1, limit: 25 } },
  '/sales/pos': { products: { page: 1, limit: 50 }, pos: { page: 1, limit: 20 } },
  '/sales/wholesale': { wholesaleOrders: { page: 1, limit: 25 } },
  '/purchases/suppliers': { suppliers: { page: 1, limit: 8 } },
  '/purchases/orders': { purchaseOrders: { page: 1, limit: 25 } },
  '/purchases/goods-received': { goodsReceived: { page: 1, limit: 25 } },
  '/purchases/bills': { vendorBills: { page: 1, limit: 25 } },
  '/purchases/payments': { purchasePayments: { page: 1, limit: 25 } },
  '/purchases/returns': { purchaseReturns: { page: 1, limit: 25 } },
  '/purchases/purchase-rm': { purchaseRm: { page: 1, limit: 25 } },
  '/purchases/recipes': { recipes: { page: 1, limit: 25 } },
  '/inventory/products': { products: { page: 1, limit: 10 } },
  '/inventory/categories': { categories: { page: 1, limit: 10 } },
  '/inventory/units': { units: { page: 1, limit: 10 } },
  '/inventory/warehouses': { warehouses: { page: 1, limit: 10 } },
  '/inventory/raw-materials': { rawMaterials: { page: 1, limit: 10 } },
  '/inventory/semi-finished-products': { semiFinishedProducts: { page: 1, limit: 10 } },
  '/inventory/finished-goods': { finishedGoods: { page: 1, limit: 10 } },
  '/inventory/stock-in': { stockIn: { page: 1, limit: 25 } },
  '/inventory/stock-out': { stockOut: { page: 1, limit: 25 } },
  '/inventory/transfers': { stockTransfers: { page: 1, limit: 25 } },
  '/inventory/adjustments': { stockAdjustments: { page: 1, limit: 25 } },
  '/hrm/employees': { employees: { page: 1, limit: 25 } },
  '/hrm/departments': { departments: { page: 1, limit: 25 } },
  '/hrm/designations': { designations: { page: 1, limit: 25 } },
  '/hrm/attendance': { attendance: { page: 1, limit: 25 } },
  '/hrm/leave': { leaveRequests: { page: 1, limit: 25 } },
  '/payroll/structures': { salaryStructures: { page: 1, limit: 25 } },
  '/payroll/runs': { payrollRuns: { page: 1, limit: 25 } },
  '/payroll/slips': { payrollSlips: { page: 1, limit: 25 } },
  '/payroll/salary-sheet': { salarySheet: { page: 1, limit: 500 } },
  '/manufacturing/orders': { productionOrders: { page: 1, limit: 25 } },
  '/manufacturing/machine-maintenance': { machineMaintenance: { page: 1, limit: 25 } },
  '/manufacturing/mold-management': { molds: { page: 1, limit: 25 } },
  '/manufacturing/wastage': { wastage: { page: 1, limit: 25 } },
  '/manufacturing/packing': { packing: { page: 1, limit: 25 } },
  '/projects': { pmProjects: { page: 1, limit: 25 } },
  '/legacy/projects': { projects: { page: 1, limit: 25 } },
  '/asset-management': { assets: { page: 1, limit: 25 } },
  '/workflow-approvals': { workflowApprovals: { page: 1, limit: 25 } },
  '/accounting/journals': { journals: { page: 1, limit: 25 } },
  '/accounting/ledger': { ledger: { page: 1, limit: 25 } },
  '/accounting/dues': { dues: { page: 1, limit: 8 } },
  '/accounting/cashbox': { cashbox: { page: 1, limit: 6 } },
  '/accounting/trial': { trialBalance: { page: 1, limit: 500 } },
  '/accounting/pl': { profitLoss: { page: 1, limit: 500 } },
  '/accounting/balance': { balanceSheet: { page: 1, limit: 500 } },
  '/accounting/receivables': { invoices: { page: 1, limit: 8 } },
  '/accounting/payables': { vendorBills: { page: 1, limit: 8 } },
  '/settings/permissions': { permissions: { page: 1, limit: 25 } },
  '/settings/documents': { documents: { page: 1, limit: 25 } },
  '/settings/company': { companySettings: { page: 1, limit: 25 } },
  '/settings/audit-logs': { auditLogs: { page: 1, limit: 25 } },
};

const ROUTE_KEYS_BY_LENGTH = Object.keys(ROUTE_PREFETCH_MODULES).sort(
  (a, b) => b.length - a.length,
);

function resolveRouteKey(pathname: string): string | null {
  const path = normalizeRoutePath(pathname);
  if (path in ROUTE_PREFETCH_MODULES) return path;
  for (const key of ROUTE_KEYS_BY_LENGTH) {
    if (key === '/dashboard') continue;
    if (path === key || path.startsWith(`${key}/`)) return key;
  }
  return null;
}

/** Default list query for a module on the current route (hydrator + page hooks). */
export function getRouteModuleQuery(pathname: string, module: ApiModule): ApiListQuery {
  const routeKey = resolveRouteKey(pathname);
  const configured = routeKey ? ROUTE_MODULE_QUERIES[routeKey]?.[module] : undefined;
  if (configured) return { ...configured };
  return { page: 1, limit: DEFAULT_LIST_PAGE_SIZE };
}

/** Default page size for a module on the current route. */
export function getRouteModulePageSize(pathname: string, module: ApiModule): number {
  return getRouteModuleQuery(pathname, module).limit ?? DEFAULT_LIST_PAGE_SIZE;
}

/** All routes that declare a query for the given module. */
export function routesForModule(module: ApiModule): string[] {
  return Object.entries(ROUTE_MODULE_QUERIES)
    .filter(([, mods]) => mods?.[module])
    .map(([route]) => route);
}
