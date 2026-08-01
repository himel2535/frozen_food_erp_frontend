export interface SidebarItem {
  label: string;
  href: string;
  view?: string;
  imageIcon?: string;
  iconifyIcon?: string;
}

export interface SidebarSection {
  id: string;
  label: string;
  href: string;
  imageIcon?: string;
  iconifyIcon?: string;
  color?: string;
  items: SidebarItem[];
}

export const TENANT_SIDEBAR_SECTIONS: SidebarSection[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', iconifyIcon: 'fluent-color:apps-24', color: 'text-slate-600', items: [] },
  {
    id: 'sales-crm', label: 'Sales & CRM', href: '/crm/leads', imageIcon: '/images/sidebar/sales-crm.png', iconifyIcon: 'fluent-color:people-interwoven-24', color: 'text-emerald-600',
    items: [
      { label: 'Customers', href: '/crm/customers', view: 'customers', imageIcon: '/images/sidebar/sales-crm/customers.png', iconifyIcon: 'fluent-color:people-24' },
      { label: 'Leads', href: '/crm/leads', view: 'leads', imageIcon: '/images/sidebar/sales-crm/leads.png', iconifyIcon: 'fluent-color:person-add-24' },
      { label: 'Deals & Pipeline', href: '/crm/deals', view: 'deals', imageIcon: '/images/sidebar/sales-crm/deals.png', iconifyIcon: 'fluent-color:arrow-trending-lines-24' },
      { label: 'Quotations', href: '/sales/quotations', view: 'quotations', imageIcon: '/images/sidebar/sales-crm/quotations.png', iconifyIcon: 'fluent-color:document-text-24' },
      { label: 'Sales Orders', href: '/sales/orders', view: 'orders', imageIcon: '/images/sidebar/sales-crm/orders.png', iconifyIcon: 'fluent-color:clipboard-task-24' },
      { label: 'Delivery Challan', href: '/sales/deliveries', view: 'deliveries', imageIcon: '/images/sidebar/sales-crm/deliveries.png', iconifyIcon: 'flat-color-icons:shipped' },
      { label: 'Dispatch', href: '/sales/dispatch', view: 'dispatch', imageIcon: '/images/sidebar/sales-crm/dispatch.png', iconifyIcon: 'fluent-color:send-24' },
      { label: 'Invoices', href: '/sales/invoices', view: 'invoices', imageIcon: '/images/sidebar/sales-crm/invoices.png', iconifyIcon: 'fluent-color:receipt-24' },
      { label: 'Payments', href: '/sales/payments', view: 'payments', imageIcon: '/images/sidebar/sales-crm/payments.png', iconifyIcon: 'fluent-color:gift-card-24' },
      { label: 'Sales Returns', href: '/sales/returns', view: 'returns', imageIcon: '/images/sidebar/sales-crm/returns.png', iconifyIcon: 'fluent-color:arrow-clockwise-dashes-24' },
      { label: 'POS', href: '/sales/pos', view: 'pos', imageIcon: '/images/sidebar/sales-crm/pos.png', iconifyIcon: 'fluent-color:apps-list-24' },
      { label: 'Complaints', href: '/crm/complaints', view: 'complaints', imageIcon: '/images/sidebar/sales-crm/complaints.png', iconifyIcon: 'fluent-color:megaphone-loud-24' },
    ],
  },
  {
    id: 'inventory', label: 'Inventory', href: '/inventory/products', imageIcon: '/images/sidebar/inventory.png', iconifyIcon: 'flat-color-icons:package', color: 'text-blue-600',
    items: [
      { label: 'Products', href: '/inventory/products', view: 'products', imageIcon: '/images/sidebar/inventory/products.png', iconifyIcon: 'flat-color-icons:filing-cabinet' },
      { label: 'Raw Materials', href: '/inventory/raw-materials', view: 'raw-materials', imageIcon: '/images/sidebar/inventory/products.png', iconifyIcon: 'flat-color-icons:tree-structure' },
      { label: 'Stock In', href: '/inventory/stock-in', view: 'stock-in', imageIcon: '/images/sidebar/inventory/stock-in.png', iconifyIcon: 'flat-color-icons:download' },
      { label: 'Stock Out', href: '/inventory/stock-out', view: 'stock-out', imageIcon: '/images/sidebar/inventory/stock-out.png', iconifyIcon: 'flat-color-icons:upload' },
      { label: 'Stock Transfers', href: '/inventory/transfers', view: 'transfers', imageIcon: '/images/sidebar/inventory/transfers.png', iconifyIcon: 'flat-color-icons:synchronize' },
      { label: 'Stock Correction', href: '/inventory/adjustments', view: 'adjustments', imageIcon: '/images/sidebar/inventory/adjustments.png', iconifyIcon: 'flat-color-icons:data-configuration' },
      { label: 'Warehouse', href: '/inventory/warehouses', view: 'warehouses', imageIcon: '/images/sidebar/inventory/warehouses.png', iconifyIcon: 'fluent-color:building-24' },
      { label: 'Categories', href: '/inventory/categories', view: 'categories', imageIcon: '/images/sidebar/inventory/categories.png', iconifyIcon: 'fluent-color:bookmark-24' },
      { label: 'Units', href: '/inventory/units', view: 'units', imageIcon: '/images/sidebar/inventory/units.png', iconifyIcon: 'flat-color-icons:ruler' },
    ],
  },
  {
    id: 'purchases', label: 'Purchases', href: '/purchases/suppliers', imageIcon: '/images/sidebar/purchases.png', iconifyIcon: 'flat-color-icons:shop', color: 'text-amber-600',
    items: [
      { label: 'Suppliers', href: '/purchases/suppliers', view: 'suppliers', imageIcon: '/images/sidebar/purchases/suppliers.png', iconifyIcon: 'fluent-color:building-store-24' },
      { label: 'Purchase Orders', href: '/purchases/orders', view: 'orders', imageIcon: '/images/sidebar/purchases/orders.png', iconifyIcon: 'fluent-color:document-add-24' },
      { label: 'Purchase RM', href: '/purchases/purchase-rm', view: 'purchase-rm', imageIcon: '/images/sidebar/inventory/products.png', iconifyIcon: 'flat-color-icons:tree-structure' },
      { label: 'Goods Received', href: '/purchases/goods-received', view: 'goods-received', imageIcon: '/images/sidebar/purchases/goods-received.png', iconifyIcon: 'fluent-color:arrow-square-down-24' },
      { label: 'Vendor Bills', href: '/purchases/bills', view: 'bills', imageIcon: '/images/sidebar/purchases/bills.png', iconifyIcon: 'fluent-color:notebook-24' },
      { label: 'Payments', href: '/purchases/payments', view: 'payments', imageIcon: '/images/sidebar/purchases/payments.png', iconifyIcon: 'flat-color-icons:paid' },
      { label: 'Purchase Returns', href: '/purchases/returns', view: 'returns', imageIcon: '/images/sidebar/purchases/returns.png', iconifyIcon: 'flat-color-icons:undo' },
      { label: 'Recipes (BOM)', href: '/purchases/recipes', view: 'recipes', imageIcon: '/images/sidebar/inventory/products.png', iconifyIcon: 'fluent-color:puzzle-piece-24' },
    ],
  },
  {
    id: 'factory', label: 'Factory', href: '/manufacturing/orders', imageIcon: '/images/sidebar/factory.png', iconifyIcon: 'flat-color-icons:factory', color: 'text-rose-600',
    items: [
      { label: 'Production', href: '/manufacturing/orders', view: 'orders', imageIcon: '/images/sidebar/factory/orders.png', iconifyIcon: 'flat-color-icons:serial-tasks' },
      { label: 'Raw Materials BOM', href: '/manufacturing/bom', view: 'bom', imageIcon: '/images/sidebar/factory/bom.png', iconifyIcon: 'flat-color-icons:tree-structure' },
      { label: 'Machine Maintenance', href: '/manufacturing/machine-maintenance', view: 'machine-maintenance', imageIcon: '/images/sidebar/factory/machine-maintenance.png', iconifyIcon: 'fluent-color:wrench-24' },
      { label: 'Mold Management', href: '/manufacturing/mold-management', view: 'mold-management', imageIcon: '/images/sidebar/factory/mold-management.png', iconifyIcon: 'fluent-color:puzzle-piece-24' },
      { label: 'Wastage', href: '/manufacturing/wastage', view: 'wastage', imageIcon: '/images/sidebar/factory/wastage.png', iconifyIcon: 'flat-color-icons:full-trash' },
      { label: 'Packing', href: '/manufacturing/packing', view: 'packing', imageIcon: '/images/sidebar/factory/packing.png', iconifyIcon: 'fluent-color:gift-24' },
    ],
  },
  {
    id: 'accounts', label: 'Accounts', href: '/accounting/receivables', imageIcon: '/images/sidebar/accounts.png', iconifyIcon: 'flat-color-icons:money-transfer', color: 'text-indigo-600',
    items: [
      { label: 'Cashbox', href: '/accounting/cashbox', view: 'cashbox', imageIcon: '/images/sidebar/accounts/cashbox.png', iconifyIcon: 'flat-color-icons:safe' },
      { label: 'Due Management', href: '/accounting/dues', view: 'dues', imageIcon: '/images/sidebar/accounts/dues.png', iconifyIcon: 'fluent-color:alert-badge-24' },
      { label: 'Customer Due (Cash)', href: '/accounting/receivables', view: 'receivables', imageIcon: '/images/sidebar/accounts/receivables.png', iconifyIcon: 'flat-color-icons:positive-dynamic' },
      { label: 'Supplier Due (Bank)', href: '/accounting/payables', view: 'payables', imageIcon: '/images/sidebar/accounts/payables.png', iconifyIcon: 'flat-color-icons:negative-dynamic' },
      { label: 'Journal Entries', href: '/accounting/journals', view: 'journals', imageIcon: '/images/sidebar/accounts/journals.png', iconifyIcon: 'fluent-color:book-open-24' },
      { label: 'General Ledger', href: '/accounting/ledger', view: 'ledger', imageIcon: '/images/sidebar/accounts/ledger.png', iconifyIcon: 'fluent-color:book-24' },
      { label: 'Trial Balance', href: '/accounting/trial', view: 'trial', imageIcon: '/images/sidebar/accounts/trial.png', iconifyIcon: 'flat-color-icons:calculator' },
      { label: 'Profit & Loss', href: '/accounting/pl', view: 'pl', imageIcon: '/images/sidebar/accounts/pl.png', iconifyIcon: 'fluent-color:data-trending-24' },
      { label: 'Balance Sheet', href: '/accounting/balance', view: 'balance', imageIcon: '/images/sidebar/accounts/balance.png', iconifyIcon: 'fluent-color:building-government-24' },
    ],
  },
  {
    id: 'hrm', label: 'HR', href: '/hrm/employees', imageIcon: '/images/sidebar/hr.png', iconifyIcon: 'fluent-color:contact-card-24', color: 'text-teal-600',
    items: [
      { label: 'Employees', href: '/hrm/employees', view: 'employees', imageIcon: '/images/sidebar/hr/employees.png', iconifyIcon: 'fluent-color:person-24' },
      { label: 'Departments', href: '/hrm/departments', view: 'departments', imageIcon: '/images/sidebar/hr/departments.png', iconifyIcon: 'fluent-color:org-24' },
      { label: 'Designations', href: '/hrm/designations', view: 'designations', imageIcon: '/images/sidebar/hr/designations.png', iconifyIcon: 'fluent-color:ribbon-24' },
      { label: 'Attendance', href: '/hrm/attendance', view: 'attendance', imageIcon: '/images/sidebar/hr/attendance.png', iconifyIcon: 'fluent-color:clock-24' },
      { label: 'Leave Management', href: '/hrm/leave', view: 'leave', imageIcon: '/images/sidebar/hr/leave.png', iconifyIcon: 'fluent-color:calendar-cancel-24' },
    ],
  },
  {
    id: 'payroll', label: 'Payroll', href: '/payroll/structures', imageIcon: '/images/sidebar/payroll.png', iconifyIcon: 'fluent-color:coin-multiple-24', color: 'text-cyan-600',
    items: [
      { label: 'Salary Structures', href: '/payroll/structures', view: 'structures', imageIcon: '/images/sidebar/payroll/structures.png', iconifyIcon: 'fluent-color:table-24' },
      { label: 'Payroll Runs', href: '/payroll/runs', view: 'runs', imageIcon: '/images/sidebar/payroll/runs.png', iconifyIcon: 'flat-color-icons:start' },
      { label: 'Payslips', href: '/payroll/slips', view: 'slips', imageIcon: '/images/sidebar/payroll/slips.png', iconifyIcon: 'flat-color-icons:print' },
    ],
  },
  { id: 'projects', label: 'Projects', href: '/projects', iconifyIcon: 'fluent-color:document-folder-24', color: 'text-orange-500', items: [] },
  { id: 'assets', label: 'Assets', href: '/asset-management', imageIcon: '/images/sidebar/assets.png', iconifyIcon: 'fluent-color:toolbox-24', color: 'text-fuchsia-600', items: [] },
  { id: 'approvals', label: 'Approvals', href: '/workflow-approvals', iconifyIcon: 'fluent-color:approvals-app-24', color: 'text-rose-500', items: [] },
  {
    id: 'reports', label: 'Reports', href: '/reports/sales', imageIcon: '/images/sidebar/reports.png', iconifyIcon: 'fluent-color:chart-multiple-24', color: 'text-slate-600',
    items: [
      { label: 'Sales Reports', href: '/reports/sales', view: 'sales', iconifyIcon: 'fluent-color:data-bar-vertical-ascending-24' },
      { label: 'Purchase Reports', href: '/reports/purchases', view: 'purchases', iconifyIcon: 'fluent-color:data-pie-24' },
      { label: 'Inventory Reports', href: '/reports/inventory', view: 'inventory', iconifyIcon: 'flat-color-icons:bar-chart' },
      { label: 'Customer Reports', href: '/reports/customers', view: 'customers', iconifyIcon: 'fluent-color:scan-person-24' },
      { label: 'Supplier Reports', href: '/reports/suppliers', view: 'suppliers', iconifyIcon: 'fluent-color:briefcase-24' },
      { label: 'Financial Reports', href: '/reports/financial', view: 'financial', iconifyIcon: 'flat-color-icons:combo-chart' },
      { label: 'HR Reports', href: '/reports/hr', view: 'hr', iconifyIcon: 'fluent-color:people-community-24' },
    ],
  },
  {
    id: 'settings', label: 'Administration', href: '/settings/users', imageIcon: '/images/sidebar/administration.png', iconifyIcon: 'fluent-color:shield-24', color: 'text-slate-500',
    items: [
      { label: 'Users', href: '/settings/users', view: 'users', iconifyIcon: 'fluent-color:people-team-24' },
      { label: 'Roles', href: '/settings/roles', view: 'roles', iconifyIcon: 'fluent-color:person-key-24' },
      { label: 'Permissions', href: '/settings/permissions', view: 'permissions', iconifyIcon: 'fluent-color:checkmark-circle-24' },
      { label: 'Documents', href: '/settings/documents', view: 'documents', iconifyIcon: 'fluent-color:document-lock-24' },
      { label: 'Company Settings', href: '/settings/company', view: 'company', iconifyIcon: 'fluent-color:building-home-24' },
      { label: 'Audit Logs', href: '/settings/audit-logs', view: 'audit-logs', iconifyIcon: 'fluent-color:history-24' },
    ],
  },
];

export function getActiveSidebarModule(pathname: string): string {
  const path = pathname.split('/').filter(Boolean);
  const first = path[0] ?? 'dashboard';
  const map: Record<string, string> = {
    dashboard: 'dashboard',
    crm: 'sales-crm',
    sales: 'sales-crm',
    inventory: 'inventory',
    purchases: 'purchases',
    manufacturing: 'factory',
    accounting: 'accounts',
    hrm: 'hrm',
    payroll: 'payroll',
    projects: 'projects',
    'asset-management': 'assets',
    'workflow-approvals': 'approvals',
    reports: 'reports',
    settings: 'settings',
    notifications: 'dashboard',
  };
  return map[first] ?? first;
}

export function getActiveSidebarView(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length >= 2) return parts[1];
  return null;
}

export const COLOR_MAP: Record<string, { bg: string; ring: string; text: string; border: string }> = {
  emerald: { bg: 'bg-emerald-50/80', ring: 'ring-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200/60' },
  blue: { bg: 'bg-blue-50/80', ring: 'ring-blue-100', text: 'text-blue-700', border: 'border-blue-200/60' },
  amber: { bg: 'bg-amber-50/80', ring: 'ring-amber-100', text: 'text-amber-700', border: 'border-amber-200/60' },
  rose: { bg: 'bg-rose-50/80', ring: 'ring-rose-100', text: 'text-rose-700', border: 'border-rose-200/60' },
  indigo: { bg: 'bg-indigo-50/80', ring: 'ring-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200/60' },
  teal: { bg: 'bg-teal-50/80', ring: 'ring-teal-100', text: 'text-teal-700', border: 'border-teal-200/60' },
  cyan: { bg: 'bg-cyan-50/80', ring: 'ring-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200/60' },
  fuchsia: { bg: 'bg-fuchsia-50/80', ring: 'ring-fuchsia-100', text: 'text-fuchsia-700', border: 'border-fuchsia-200/60' },
  slate: { bg: 'bg-slate-100/80', ring: 'ring-slate-200', text: 'text-slate-800', border: 'border-slate-300/60' },
  orange: { bg: 'bg-orange-50/80', ring: 'ring-orange-100', text: 'text-orange-700', border: 'border-orange-200/60' },
};

export function getSectionColor(section: SidebarSection) {
  const base = section.color?.replace('text-', '').replace('-600', '').replace('-500', '') ?? 'blue';
  return COLOR_MAP[base] ?? COLOR_MAP.blue;
}
