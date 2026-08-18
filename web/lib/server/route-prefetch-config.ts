import type { ApiModule } from '@/lib/config/data-source';

/** App route path → API module(s) to prefetch on the server before first paint. */
export const ROUTE_PREFETCH_MODULES: Record<string, ApiModule | ApiModule[]> = {
  '/dashboard': [],
  '/crm/customers': 'customers',
  '/crm/leads': 'leads',
  '/crm/deals': 'deals',
  '/crm/complaints': 'complaints',
  '/crm/activities': 'crmActivities',
  '/sales/orders': 'salesOrders',
  '/sales/invoices': 'invoices',
  '/sales/deliveries': 'deliveries',
  '/sales/dispatch': 'dispatch',
  '/sales/payments': 'payments',
  '/sales/returns': 'returns',
  '/sales/quotations': 'quotations',
  '/sales/pos': ['products', 'pos'],
  '/sales/wholesale': 'wholesaleOrders',
  '/purchases/suppliers': 'suppliers',
  '/purchases/orders': 'purchaseOrders',
  '/purchases/goods-received': 'goodsReceived',
  '/purchases/bills': 'vendorBills',
  '/purchases/payments': 'purchasePayments',
  '/purchases/returns': 'purchaseReturns',
  '/purchases/purchase-rm': 'purchaseRm',
  '/purchases/recipes': 'recipes',
  '/inventory/products': 'products',
  '/inventory/categories': 'categories',
  '/inventory/units': 'units',
  '/inventory/warehouses': 'warehouses',
  '/inventory/raw-materials': 'rawMaterials',
  '/inventory/semi-finished-products': 'semiFinishedProducts',
  '/inventory/finished-goods': 'finishedGoods',
  '/inventory/stock-in': 'stockIn',
  '/inventory/stock-out': 'stockOut',
  '/inventory/transfers': 'stockTransfers',
  '/inventory/adjustments': 'stockAdjustments',
  '/hrm/employees': 'employees',
  '/hrm/departments': 'departments',
  '/hrm/designations': 'designations',
  '/hrm/attendance': 'attendance',
  '/hrm/leave': 'leaveRequests',
  '/payroll/structures': 'salaryStructures',
  '/payroll/runs': 'payrollRuns',
  '/payroll/slips': 'payrollSlips',
  '/payroll/salary-sheet': 'salarySheet',
  '/manufacturing/orders': 'productionOrders',
  '/manufacturing/machine-maintenance': 'machineMaintenance',
  '/manufacturing/mold-management': 'molds',
  '/manufacturing/wastage': 'wastage',
  '/manufacturing/packing': 'packing',
  '/projects': 'pmProjects',
  '/legacy/projects': 'projects',
  '/asset-management': 'assets',
  '/workflow-approvals': 'workflowApprovals',
  '/accounting/journals': 'journals',
  '/accounting/ledger': 'ledger',
  '/accounting/dues': 'dues',
  '/accounting/cashbox': 'cashbox',
  '/accounting/trial': 'trialBalance',
  '/accounting/pl': 'profitLoss',
  '/accounting/balance': 'balanceSheet',
  '/accounting/receivables': 'invoices',
  '/accounting/payables': 'vendorBills',
  '/settings/users': 'users',
  '/settings/roles': 'roles',
  '/settings/permissions': 'permissions',
  '/settings/documents': 'documents',
  '/settings/company': 'companySettings',
  '/settings/audit-logs': 'auditLogs',
};

export function routePathFromPageFile(relativePath: string): string {
  const normalized = relativePath
    .replace(/\\/g, '/')
    .replace(/^web\/app\/\(tenant\)/, '')
    .replace(/\/page\.tsx$/, '')
    .replace(/\/page\.jsx$/, '');
  return normalized || '/dashboard';
}

export function shouldSkipPrefetch(route: string): boolean {
  if (route.includes('[')) return true;
  if (route.endsWith('/new')) return true;
  if (route === '/inventory') return true;
  if (route.startsWith('/reports/')) return false;
  if (route === '/design-system' || route === '/super-admin') return true;
  if (route === '/messages' || route === '/alerts') return true;
  if (route === '/inventory/low-stock-alerts') return true;
  return false;
}
