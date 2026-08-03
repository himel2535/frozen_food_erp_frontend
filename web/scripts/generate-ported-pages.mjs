import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, '..');
const appRoot = path.join(webRoot, 'app', '(tenant)');
const portedRoot = path.join(webRoot, 'components', 'modules', 'ported');

/** All module IDs from module-metadata.ts — must stay in sync */
const MODULE_LIST = [
  'crm-customers',
  'crm-deals',
  'crm-complaints',
  'crm-activities',
  'sales-quotations',
  'sales-orders',
  'sales-deliveries',
  'sales-dispatch',
  'sales-invoices',
  'sales-payments',
  'sales-returns',
  'sales-pos',
  'sales-wholesale',
  'inventory-products',
  'inventory-raw-materials',
  'inventory-stock-in',
  'inventory-stock-out',
  'inventory-transfers',
  'inventory-adjustments',
  'inventory-warehouses',
  'inventory-categories',
  'inventory-units',
  'purchases-suppliers',
  'purchases-orders',
  'purchases-goods-received',
  'purchases-bills',
  'purchases-payments',
  'purchases-returns',
  'purchases-recipes',
  'manufacturing-machine-maintenance',
  'manufacturing-mold-management',
  'manufacturing-wastage',
  'manufacturing-packing',
  'accounting-cashbox',
  'accounting-dues',
  'accounting-receivables',
  'accounting-payables',
  'accounting-journals',
  'accounting-ledger',
  'accounting-trial',
  'accounting-pl',
  'accounting-balance',
  'hrm-employees',
  'hrm-departments',
  'hrm-designations',
  'hrm-attendance',
  'hrm-leave',
  'payroll-structures',
  'payroll-runs',
  'payroll-slips',
  'reports-sales',
  'reports-purchases',
  'reports-inventory',
  'reports-customers',
  'reports-suppliers',
  'reports-financial',
  'reports-hr',
  'settings-users',
  'settings-roles',
  'settings-permissions',
  'settings-documents',
  'settings-company',
  'settings-audit-logs',
  'settings-profile',
  'settings-signatures',
  'projects',
  'asset-management',
  'workflow-approvals',
  'notifications',
  'super-admin',
  'design-system',
];

const MODULE_TO_ROUTE = {
  'crm-customers': '/crm/customers',
  'crm-deals': '/crm/deals',
  'crm-complaints': '/crm/complaints',
  'crm-activities': '/crm/activities',
  'sales-quotations': '/sales/quotations',
  'sales-orders': '/sales/orders',
  'sales-deliveries': '/sales/deliveries',
  'sales-dispatch': '/sales/dispatch',
  'sales-invoices': '/sales/invoices',
  'sales-payments': '/sales/payments',
  'sales-returns': '/sales/returns',
  'sales-pos': '/sales/pos',
  'sales-wholesale': '/sales/wholesale',
  'inventory-products': '/inventory/products',
  'inventory-raw-materials': '/inventory/raw-materials',
  'inventory-stock-in': '/inventory/stock-in',
  'inventory-stock-out': '/inventory/stock-out',
  'inventory-transfers': '/inventory/transfers',
  'inventory-adjustments': '/inventory/adjustments',
  'inventory-warehouses': '/inventory/warehouses',
  'inventory-categories': '/inventory/categories',
  'inventory-units': '/inventory/units',
  'purchases-suppliers': '/purchases/suppliers',
  'purchases-orders': '/purchases/orders',
  'purchases-goods-received': '/purchases/goods-received',
  'purchases-bills': '/purchases/bills',
  'purchases-payments': '/purchases/payments',
  'purchases-returns': '/purchases/returns',
  'purchases-recipes': '/purchases/recipes',
  'manufacturing-machine-maintenance': '/manufacturing/machine-maintenance',
  'manufacturing-mold-management': '/manufacturing/mold-management',
  'manufacturing-wastage': '/manufacturing/wastage',
  'manufacturing-packing': '/manufacturing/packing',
  'accounting-cashbox': '/accounting/cashbox',
  'accounting-dues': '/accounting/dues',
  'accounting-receivables': '/accounting/receivables',
  'accounting-payables': '/accounting/payables',
  'accounting-journals': '/accounting/journals',
  'accounting-ledger': '/accounting/ledger',
  'accounting-trial': '/accounting/trial',
  'accounting-pl': '/accounting/pl',
  'accounting-balance': '/accounting/balance',
  'hrm-employees': '/hrm/employees',
  'hrm-departments': '/hrm/departments',
  'hrm-designations': '/hrm/designations',
  'hrm-attendance': '/hrm/attendance',
  'hrm-leave': '/hrm/leave',
  'payroll-structures': '/payroll/structures',
  'payroll-runs': '/payroll/runs',
  'payroll-slips': '/payroll/slips',
  'reports-sales': '/reports/sales',
  'reports-purchases': '/reports/purchases',
  'reports-inventory': '/reports/inventory',
  'reports-customers': '/reports/customers',
  'reports-suppliers': '/reports/suppliers',
  'reports-financial': '/reports/financial',
  'reports-hr': '/reports/hr',
  'settings-users': '/settings/users',
  'settings-roles': '/settings/roles',
  'settings-permissions': '/settings/permissions',
  'settings-documents': '/settings/documents',
  'settings-company': '/settings/company',
  'settings-audit-logs': '/settings/audit-logs',
  'settings-profile': '/settings/profile',
  'settings-signatures': '/settings/signatures',
  projects: '/projects',
  'asset-management': '/asset-management',
  'workflow-approvals': '/workflow-approvals',
  notifications: '/notifications',
  'super-admin': '/super-admin',
  'design-system': '/design-system',
};

/** Dedicated components — skip ported wrapper generation */
const DEDICATED_PAGES = {
  'crm-customers': { importPath: '@/components/modules/crm/CustomersPage', componentName: 'CustomersPage' },
  'crm-leads': { importPath: '@/components/modules/crm/LeadsPage', componentName: 'LeadsPage' },
  'crm-deals': { importPath: '@/components/modules/crm/DealsPage', componentName: 'DealsPage' },
  'crm-complaints': { importPath: '@/components/modules/crm/ComplaintsPage', componentName: 'ComplaintsPage' },
  'crm-activities': { importPath: '@/lib/modules/settings-pages', componentName: 'CrmActivitiesPage' },
  'sales-quotations': { importPath: '@/components/modules/sales/QuotationsPage', componentName: 'QuotationsPage' },
  'sales-orders': { importPath: '@/components/modules/sales/OrdersPage', componentName: 'OrdersPage' },
  'sales-deliveries': { importPath: '@/components/modules/sales/DeliveriesPage', componentName: 'DeliveriesPage' },
  'sales-dispatch': { importPath: '@/components/modules/sales/DispatchPage', componentName: 'DispatchPage' },
  'sales-invoices': { importPath: '@/components/modules/sales/InvoicesPage', componentName: 'InvoicesPage' },
  'sales-payments': { importPath: '@/components/modules/sales/PaymentsPage', componentName: 'PaymentsPage' },
  'sales-returns': { importPath: '@/components/modules/sales/ReturnsPage', componentName: 'ReturnsPage' },
  'sales-pos': { importPath: '@/components/modules/sales/PosPage', componentName: 'PosPage' },
  'sales-wholesale': { importPath: '@/lib/modules/settings-pages', componentName: 'SalesWholesalePage' },
  'inventory-products': { importPath: '@/components/modules/inventory/ProductsPage', componentName: 'ProductsPage' },
  'inventory-raw-materials': { importPath: '@/lib/modules/inventory-configs', componentName: 'RawMaterialsPage' },
  'inventory-stock-in': { importPath: '@/lib/modules/inventory-configs', componentName: 'StockInPage' },
  'inventory-stock-out': { importPath: '@/lib/modules/inventory-configs', componentName: 'StockOutPage' },
  'inventory-transfers': { importPath: '@/lib/modules/inventory-configs', componentName: 'TransfersPage' },
  'inventory-adjustments': { importPath: '@/lib/modules/inventory-configs', componentName: 'AdjustmentsPage' },
  'inventory-warehouses': { importPath: '@/lib/modules/inventory-configs', componentName: 'WarehousesPage' },
  'inventory-categories': { importPath: '@/lib/modules/inventory-configs', componentName: 'CategoriesPage' },
  'inventory-units': { importPath: '@/lib/modules/inventory-configs', componentName: 'UnitsPage' },
  'purchases-suppliers': { importPath: '@/lib/modules/purchases-pages', componentName: 'SuppliersPage' },
  'purchases-orders': { importPath: '@/lib/modules/purchases-pages', componentName: 'PurchaseOrdersPage' },
  'purchases-goods-received': { importPath: '@/lib/modules/purchases-pages', componentName: 'GoodsReceivedPage' },
  'purchases-bills': { importPath: '@/lib/modules/purchases-pages', componentName: 'BillsPage' },
  'purchases-payments': { importPath: '@/lib/modules/purchases-pages', componentName: 'PurchasePaymentsPage' },
  'purchases-returns': { importPath: '@/lib/modules/purchases-pages', componentName: 'PurchaseReturnsPage' },
  'purchases-recipes': { importPath: '@/lib/modules/purchases-pages', componentName: 'RecipesPage' },
  'manufacturing-machine-maintenance': { importPath: '@/lib/modules/manufacturing-pages', componentName: 'MachineMaintenancePage' },
  'manufacturing-mold-management': { importPath: '@/lib/modules/manufacturing-pages', componentName: 'MoldManagementPage' },
  'manufacturing-wastage': { importPath: '@/lib/modules/manufacturing-pages', componentName: 'WastagePage' },
  'manufacturing-packing': { importPath: '@/lib/modules/manufacturing-pages', componentName: 'PackingPage' },
  'accounting-cashbox': { importPath: '@/lib/modules/accounting-pages', componentName: 'CashboxPage' },
  'accounting-dues': { importPath: '@/lib/modules/accounting-pages', componentName: 'DuesPage' },
  'accounting-receivables': { importPath: '@/lib/modules/accounting-pages', componentName: 'ReceivablesPage' },
  'accounting-payables': { importPath: '@/lib/modules/accounting-pages', componentName: 'PayablesPage' },
  'accounting-journals': { importPath: '@/lib/modules/accounting-pages', componentName: 'JournalsPage' },
  'accounting-ledger': { importPath: '@/lib/modules/accounting-pages', componentName: 'LedgerPage' },
  'accounting-trial': { importPath: '@/lib/modules/accounting-pages', componentName: 'TrialPage' },
  'accounting-pl': { importPath: '@/lib/modules/accounting-pages', componentName: 'PlPage' },
  'accounting-balance': { importPath: '@/lib/modules/accounting-pages', componentName: 'BalancePage' },
  'hrm-employees': { importPath: '@/lib/modules/hrm-pages', componentName: 'EmployeesPage' },
  'hrm-departments': { importPath: '@/lib/modules/hrm-pages', componentName: 'DepartmentsPage' },
  'hrm-designations': { importPath: '@/lib/modules/hrm-pages', componentName: 'DesignationsPage' },
  'hrm-attendance': { importPath: '@/lib/modules/hrm-pages', componentName: 'AttendancePage' },
  'hrm-leave': { importPath: '@/lib/modules/hrm-pages', componentName: 'LeavePage' },
  'payroll-structures': { importPath: '@/lib/modules/hrm-pages', componentName: 'PayrollStructuresPage' },
  'payroll-runs': { importPath: '@/lib/modules/hrm-pages', componentName: 'PayrollRunsPage' },
  'payroll-slips': { importPath: '@/lib/modules/hrm-pages', componentName: 'PayrollSlipsPage' },
  'reports-sales': { importPath: '@/lib/modules/reports-pages', componentName: 'ReportsSalesPage' },
  'reports-purchases': { importPath: '@/lib/modules/reports-pages', componentName: 'ReportsPurchasesPage' },
  'reports-inventory': { importPath: '@/lib/modules/reports-pages', componentName: 'ReportsInventoryPage' },
  'reports-customers': { importPath: '@/lib/modules/reports-pages', componentName: 'ReportsCustomersPage' },
  'reports-suppliers': { importPath: '@/lib/modules/reports-pages', componentName: 'ReportsSuppliersPage' },
  'reports-financial': { importPath: '@/lib/modules/reports-pages', componentName: 'ReportsFinancialPage' },
  'reports-hr': { importPath: '@/lib/modules/reports-pages', componentName: 'ReportsHrPage' },
  'settings-users': { importPath: '@/lib/modules/settings-pages', componentName: 'SettingsUsersPage' },
  'settings-roles': { importPath: '@/lib/modules/settings-pages', componentName: 'SettingsRolesPage' },
  'settings-permissions': { importPath: '@/lib/modules/settings-pages', componentName: 'SettingsPermissionsPage' },
  'settings-documents': { importPath: '@/lib/modules/settings-pages', componentName: 'SettingsDocumentsPage' },
  'settings-company': { importPath: '@/lib/modules/settings-pages', componentName: 'SettingsCompanyPage' },
  'settings-audit-logs': { importPath: '@/lib/modules/settings-pages', componentName: 'SettingsAuditLogsPage' },
  'settings-profile': { importPath: '@/lib/modules/settings-pages', componentName: 'SettingsProfilePage' },
  'settings-signatures': { importPath: '@/lib/modules/settings-pages', componentName: 'SettingsSignaturesPage' },
  projects: { importPath: '@/lib/modules/settings-pages', componentName: 'ProjectsPage' },
  'asset-management': { importPath: '@/lib/modules/settings-pages', componentName: 'AssetManagementPage' },
  'workflow-approvals': { importPath: '@/lib/modules/settings-pages', componentName: 'WorkflowApprovalsPage' },
  notifications: { importPath: '@/lib/modules/misc-pages', componentName: 'NotificationsPage' },
  'super-admin': { importPath: '@/lib/modules/misc-pages', componentName: 'SuperAdminPage' },
  'design-system': { importPath: '@/lib/modules/misc-pages', componentName: 'DesignSystemPage' },
};

function toPascalCase(moduleId) {
  return moduleId
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function routeToPagePath(route) {
  const parts = route.split('/').filter(Boolean);
  return path.join(appRoot, ...parts, 'page.tsx');
}

function generatePortedPage(moduleId) {
  const componentName = `${toPascalCase(moduleId)}Page`;
  const filePath = path.join(portedRoot, `${componentName}.tsx`);
  const content = `'use client';

import { EnhancedCrudModule } from '@/components/modules/EnhancedCrudModule';
import { PORT_CONFIGS } from '@/lib/modules/port-configs';

export function ${componentName}() {
  return <EnhancedCrudModule config={PORT_CONFIGS['${moduleId}']} />;
}
`;
  fs.mkdirSync(portedRoot, { recursive: true });
  fs.writeFileSync(filePath, content);
  console.log('Created', filePath);
  return { componentName, importPath: `@/components/modules/ported/${componentName}` };
}

function updateRoutePage(moduleId, importPath, componentName) {
  const route = MODULE_TO_ROUTE[moduleId];
  if (!route) {
    console.warn('No route for', moduleId);
    return;
  }
  const pagePath = routeToPagePath(route);
  fs.mkdirSync(path.dirname(pagePath), { recursive: true });
  const content = `import { ${componentName} } from '${importPath}';

export default function Page() {
  return <${componentName} />;
}
`;
  fs.writeFileSync(pagePath, content);
  console.log('Updated', pagePath);
}

fs.mkdirSync(portedRoot, { recursive: true });

let created = 0;
let updated = 0;
let skipped = 0;

for (const moduleId of MODULE_LIST) {
  const dedicated = DEDICATED_PAGES[moduleId];
  if (dedicated) {
    updateRoutePage(moduleId, dedicated.importPath, dedicated.componentName);
    updated++;
    skipped++;
    continue;
  }

  const { componentName, importPath } = generatePortedPage(moduleId);
  updateRoutePage(moduleId, importPath, componentName);
  created++;
  updated++;
}

console.log(`\nDone: ${created} ported pages created, ${updated} routes updated, ${skipped} dedicated pages skipped.`);
