export interface ModuleColumn {
  key: string;
  label: string;
  render?: (row: Record<string, unknown>) => React.ReactNode;
}

export interface ModuleConfig {
  id: string;
  title: string;
  subtitle: string;
  stateKey?: keyof import('@/lib/state/types').AppState | string;
  columns: ModuleColumn[];
  searchKeys?: string[];
  addLabel?: string;
  staticRows?: Array<Record<string, unknown>>;
}

export const MODULE_REGISTRY: Record<string, ModuleConfig> = {
  'crm-customers': {
    id: 'crm-customers',
    title: 'Customers',
    subtitle: 'Manage customer profiles, credit terms, and sales history.',
    stateKey: 'crmCustomers',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'company', label: 'Company' },
      { key: 'phone', label: 'Phone' },
      { key: 'status', label: 'Status' },
      { key: 'sales', label: 'Sales' },
    ],
    searchKeys: ['name', 'company', 'phone', 'email'],
  },
  'crm-deals': {
    id: 'crm-deals',
    title: 'Deals & Pipeline',
    subtitle: 'Track deal stages, values, and follow-ups.',
    columns: [
      { key: 'name', label: 'Deal' },
      { key: 'company', label: 'Company' },
      { key: 'stage', label: 'Stage' },
      { key: 'value', label: 'Value' },
    ],
    staticRows: [],
  },
  'crm-complaints': {
    id: 'crm-complaints',
    title: 'Complaints',
    subtitle: 'Track customer complaints and resolutions.',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'customer', label: 'Customer' },
      { key: 'subject', label: 'Subject' },
      { key: 'status', label: 'Status' },
    ],
    staticRows: [
      { id: 'CMP-001', customer: 'Bell Labs', subject: 'Late delivery', status: 'Open' },
      { id: 'CMP-002', customer: 'General Electric', subject: 'Quality issue', status: 'Resolved' },
    ],
  },
  'crm-activities': {
    id: 'crm-activities',
    title: 'Activities',
    subtitle: 'Log calls, meetings, and follow-ups.',
    columns: [
      { key: 'type', label: 'Type' },
      { key: 'summary', label: 'Summary' },
      { key: 'date', label: 'Date' },
    ],
    staticRows: [],
  },
  'sales-quotations': { id: 'sales-quotations', title: 'Quotations', subtitle: 'Create and manage sales quotations.', columns: [{ key: 'id', label: 'Quote #' }, { key: 'customer', label: 'Customer' }, { key: 'total', label: 'Total' }, { key: 'status', label: 'Status' }], staticRows: [] },
  'sales-orders': { id: 'sales-orders', title: 'Sales Orders', subtitle: 'Manage confirmed sales orders.', stateKey: 'salesOrders', columns: [{ key: 'id', label: 'Order #' }, { key: 'customer', label: 'Customer' }, { key: 'total', label: 'Total' }, { key: 'status', label: 'Status' }], searchKeys: ['id', 'customer'] },
  'sales-deliveries': { id: 'sales-deliveries', title: 'Delivery Challan', subtitle: 'Track delivery challans and dispatch.', columns: [{ key: 'id', label: 'Challan #' }, { key: 'customer', label: 'Customer' }, { key: 'status', label: 'Status' }], staticRows: [] },
  'sales-dispatch': { id: 'sales-dispatch', title: 'Dispatch', subtitle: 'Manage dispatch operations.', columns: [{ key: 'id', label: 'Dispatch #' }, { key: 'route', label: 'Route' }, { key: 'status', label: 'Status' }], staticRows: [] },
  'sales-invoices': { id: 'sales-invoices', title: 'Invoices', subtitle: 'Manage sales invoices and billing.', stateKey: 'invoices', columns: [{ key: 'id', label: 'Invoice #' }, { key: 'date', label: 'Date' }, { key: 'amount', label: 'Amount' }, { key: 'status', label: 'Status' }], searchKeys: ['id'] },
  'sales-payments': { id: 'sales-payments', title: 'Payments', subtitle: 'Record customer payments.', columns: [{ key: 'id', label: 'Payment #' }, { key: 'customer', label: 'Customer' }, { key: 'amount', label: 'Amount' }], staticRows: [] },
  'sales-returns': { id: 'sales-returns', title: 'Sales Returns', subtitle: 'Process sales returns and credit notes.', columns: [{ key: 'id', label: 'Return #' }, { key: 'customer', label: 'Customer' }, { key: 'status', label: 'Status' }], staticRows: [] },
  'sales-pos': { id: 'sales-pos', title: 'POS', subtitle: 'Point of sale terminal.', columns: [{ key: 'receipt', label: 'Receipt' }, { key: 'amount', label: 'Amount' }], staticRows: [] },
  'sales-wholesale': { id: 'sales-wholesale', title: 'Wholesale', subtitle: 'Wholesale order management.', columns: [{ key: 'id', label: 'Order #' }, { key: 'buyer', label: 'Buyer' }, { key: 'total', label: 'Total' }], staticRows: [] },
  'inventory-products': { id: 'inventory-products', title: 'Products', subtitle: 'Manage finished and semi-finished products.', stateKey: 'inventory', columns: [{ key: 'name', label: 'Product' }, { key: 'sku', label: 'SKU' }, { key: 'stock', label: 'Stock' }, { key: 'price', label: 'Price' }], searchKeys: ['name', 'sku'] },
  'inventory-raw-materials': { id: 'inventory-raw-materials', title: 'Raw Materials', subtitle: 'Manage raw material inventory.', stateKey: 'inventory', columns: [{ key: 'name', label: 'Material' }, { key: 'sku', label: 'SKU' }, { key: 'stock', label: 'Stock' }], searchKeys: ['name', 'sku'] },
  'inventory-stock-in': { id: 'inventory-stock-in', title: 'Stock In', subtitle: 'Record incoming inventory.', columns: [{ key: 'ref', label: 'Reference' }, { key: 'product', label: 'Product' }, { key: 'qty', label: 'Qty' }], staticRows: [] },
  'inventory-stock-out': { id: 'inventory-stock-out', title: 'Stock Out', subtitle: 'Record outgoing inventory.', columns: [{ key: 'ref', label: 'Reference' }, { key: 'product', label: 'Product' }, { key: 'qty', label: 'Qty' }], staticRows: [] },
  'inventory-transfers': { id: 'inventory-transfers', title: 'Stock Transfers', subtitle: 'Transfer stock between warehouses.', columns: [{ key: 'id', label: 'Transfer #' }, { key: 'from', label: 'From' }, { key: 'to', label: 'To' }], staticRows: [] },
  'inventory-adjustments': { id: 'inventory-adjustments', title: 'Stock Correction', subtitle: 'Adjust inventory quantities.', columns: [{ key: 'id', label: 'Adjustment #' }, { key: 'product', label: 'Product' }, { key: 'delta', label: 'Change' }], staticRows: [] },
  'inventory-warehouses': { id: 'inventory-warehouses', title: 'Warehouses', subtitle: 'Manage warehouse locations.', stateKey: 'inventoryWarehouses', columns: [{ key: 'name', label: 'Name' }, { key: 'location', label: 'Location' }, { key: 'status', label: 'Status' }] },
  'inventory-categories': { id: 'inventory-categories', title: 'Categories', subtitle: 'Product category management.', stateKey: 'inventoryCategories', columns: [{ key: 'code', label: 'Code' }, { key: 'name', label: 'Name' }, { key: 'type', label: 'Type' }] },
  'inventory-units': { id: 'inventory-units', title: 'Units', subtitle: 'Unit of measure definitions.', stateKey: 'inventoryUnits', columns: [{ key: 'code', label: 'Code' }, { key: 'name', label: 'Name' }, { key: 'symbol', label: 'Symbol' }] },
  'purchases-suppliers': { id: 'purchases-suppliers', title: 'Suppliers', subtitle: 'Manage vendor profiles.', stateKey: 'purchasesSuppliers', columns: [{ key: 'name', label: 'Supplier' }, { key: 'due', label: 'Due' }, { key: 'status', label: 'Status' }] },
  'purchases-orders': { id: 'purchases-orders', title: 'Purchase Orders', subtitle: 'Create and track purchase orders.', stateKey: 'purchases', columns: [{ key: 'id', label: 'PO #' }, { key: 'supplier', label: 'Supplier' }, { key: 'total', label: 'Total' }, { key: 'status', label: 'Status' }] },
  'purchases-goods-received': { id: 'purchases-goods-received', title: 'Goods Received', subtitle: 'Record goods received notes.', columns: [{ key: 'id', label: 'GRN #' }, { key: 'supplier', label: 'Supplier' }, { key: 'status', label: 'Status' }], staticRows: [] },
  'purchases-bills': { id: 'purchases-bills', title: 'Vendor Bills', subtitle: 'Manage supplier bills.', columns: [{ key: 'id', label: 'Bill #' }, { key: 'supplier', label: 'Supplier' }, { key: 'amount', label: 'Amount' }], staticRows: [] },
  'purchases-payments': { id: 'purchases-payments', title: 'Purchase Payments', subtitle: 'Record supplier payments.', columns: [{ key: 'id', label: 'Payment #' }, { key: 'supplier', label: 'Supplier' }, { key: 'amount', label: 'Amount' }], staticRows: [] },
  'purchases-returns': { id: 'purchases-returns', title: 'Purchase Returns', subtitle: 'Process purchase returns.', columns: [{ key: 'id', label: 'Return #' }, { key: 'supplier', label: 'Supplier' }], staticRows: [] },
  'purchases-recipes': { id: 'purchases-recipes', title: 'Recipes (BOM)', subtitle: 'Bill of materials for purchases.', columns: [{ key: 'id', label: 'Recipe' }, { key: 'product', label: 'Product' }], staticRows: [] },
  'manufacturing-orders': { id: 'manufacturing-orders', title: 'Production', subtitle: 'Production order management.', stateKey: 'productionOrders', columns: [{ key: 'id', label: 'Order #' }, { key: 'product', label: 'Product' }, { key: 'status', label: 'Status' }] },
  'manufacturing-machine-maintenance': { id: 'manufacturing-machine-maintenance', title: 'Machine Maintenance', subtitle: 'Schedule and track machine maintenance.', columns: [{ key: 'machine', label: 'Machine' }, { key: 'status', label: 'Status' }], staticRows: [] },
  'manufacturing-mold-management': { id: 'manufacturing-mold-management', title: 'Mold Management', subtitle: 'Track molds and tooling.', columns: [{ key: 'mold', label: 'Mold' }, { key: 'status', label: 'Status' }], staticRows: [] },
  'manufacturing-wastage': { id: 'manufacturing-wastage', title: 'Wastage', subtitle: 'Record production wastage.', columns: [{ key: 'id', label: 'Record #' }, { key: 'product', label: 'Product' }, { key: 'qty', label: 'Qty' }], staticRows: [] },
  'manufacturing-packing': { id: 'manufacturing-packing', title: 'Packing', subtitle: 'Packing and labeling operations.', columns: [{ key: 'batch', label: 'Batch' }, { key: 'product', label: 'Product' }], staticRows: [] },
  'accounting-dues': { id: 'accounting-dues', title: 'Due Management', subtitle: 'Overview of receivables and payables.', columns: [{ key: 'party', label: 'Party' }, { key: 'type', label: 'Type' }, { key: 'due', label: 'Due' }], staticRows: [] },
  'accounting-receivables': { id: 'accounting-receivables', title: 'Customer Due (Cash)', subtitle: 'Track customer receivables.', stateKey: 'crmCustomers', columns: [{ key: 'name', label: 'Customer' }, { key: 'due', label: 'Due' }, { key: 'status', label: 'Status' }] },
  'accounting-payables': { id: 'accounting-payables', title: 'Supplier Due (Bank)', subtitle: 'Track supplier payables.', stateKey: 'purchasesSuppliers', columns: [{ key: 'name', label: 'Supplier' }, { key: 'due', label: 'Due' }] },
  'accounting-journals': { id: 'accounting-journals', title: 'Journal Entries', subtitle: 'Manual journal entries.', columns: [{ key: 'ref', label: 'Ref' }, { key: 'account', label: 'Account' }, { key: 'debit', label: 'Debit' }, { key: 'credit', label: 'Credit' }], staticRows: [] },
  'accounting-ledger': { id: 'accounting-ledger', title: 'General Ledger', subtitle: 'View general ledger entries.', stateKey: 'accounting', columns: [{ key: 'ref', label: 'Ref' }, { key: 'account', label: 'Account' }, { key: 'desc', label: 'Description' }, { key: 'balance', label: 'Balance' }] },
  'accounting-trial': { id: 'accounting-trial', title: 'Trial Balance', subtitle: 'Trial balance report.', columns: [{ key: 'account', label: 'Account' }, { key: 'debit', label: 'Debit' }, { key: 'credit', label: 'Credit' }], staticRows: [] },
  'accounting-pl': { id: 'accounting-pl', title: 'Profit & Loss', subtitle: 'Profit and loss statement.', columns: [{ key: 'line', label: 'Line Item' }, { key: 'amount', label: 'Amount' }], staticRows: [] },
  'accounting-balance': { id: 'accounting-balance', title: 'Balance Sheet', subtitle: 'Balance sheet report.', columns: [{ key: 'line', label: 'Line Item' }, { key: 'amount', label: 'Amount' }], staticRows: [] },
  'hrm-employees': { id: 'hrm-employees', title: 'Employees', subtitle: 'Employee directory and profiles.', stateKey: 'employees', columns: [{ key: 'name', label: 'Name' }, { key: 'department', label: 'Department' }, { key: 'designation', label: 'Designation' }, { key: 'status', label: 'Status' }], searchKeys: ['name', 'email'] },
  'hrm-departments': { id: 'hrm-departments', title: 'Departments', subtitle: 'Organizational departments.', columns: [{ key: 'name', label: 'Department' }, { key: 'head', label: 'Head' }], staticRows: [{ name: 'IT', head: 'Sarah Connor' }, { name: 'Sales', head: 'Marcus Wright' }, { name: 'HR', head: 'Arthur Dent' }] },
  'hrm-designations': { id: 'hrm-designations', title: 'Designations', subtitle: 'Job titles and designations.', columns: [{ key: 'title', label: 'Title' }, { key: 'department', label: 'Department' }], staticRows: [] },
  'hrm-attendance': { id: 'hrm-attendance', title: 'Attendance', subtitle: 'Daily attendance records.', stateKey: 'attendance', columns: [{ key: 'date', label: 'Date' }, { key: 'employeeId', label: 'Employee' }, { key: 'status', label: 'Status' }, { key: 'workingHours', label: 'Hours' }] },
  'hrm-leave': { id: 'hrm-leave', title: 'Leave Management', subtitle: 'Leave requests and balances.', columns: [{ key: 'employee', label: 'Employee' }, { key: 'type', label: 'Type' }, { key: 'status', label: 'Status' }], staticRows: [] },
  'payroll-structures': { id: 'payroll-structures', title: 'Salary Structures', subtitle: 'Define salary components.', columns: [{ key: 'name', label: 'Structure' }, { key: 'base', label: 'Base' }], staticRows: [] },
  'payroll-runs': { id: 'payroll-runs', title: 'Payroll Runs', subtitle: 'Process payroll batches.', columns: [{ key: 'period', label: 'Period' }, { key: 'status', label: 'Status' }], staticRows: [] },
  'payroll-slips': { id: 'payroll-slips', title: 'Payslips', subtitle: 'Employee payslips.', stateKey: 'payroll', columns: [{ key: 'id', label: 'Payslip #' }, { key: 'name', label: 'Employee' }, { key: 'net', label: 'Net Pay' }, { key: 'status', label: 'Status' }] },
  'reports-sales': { id: 'reports-sales', title: 'Sales Reports', subtitle: 'Sales analytics and reports.', columns: [{ key: 'report', label: 'Report' }, { key: 'period', label: 'Period' }], staticRows: [{ report: 'Monthly Sales', period: 'June 2026' }] },
  'reports-purchases': { id: 'reports-purchases', title: 'Purchase Reports', subtitle: 'Purchase analytics.', columns: [{ key: 'report', label: 'Report' }], staticRows: [] },
  'reports-inventory': { id: 'reports-inventory', title: 'Inventory Reports', subtitle: 'Stock and valuation reports.', columns: [{ key: 'report', label: 'Report' }], staticRows: [] },
  'reports-customers': { id: 'reports-customers', title: 'Customer Reports', subtitle: 'Customer analytics.', columns: [{ key: 'report', label: 'Report' }], staticRows: [] },
  'reports-suppliers': { id: 'reports-suppliers', title: 'Supplier Reports', subtitle: 'Supplier analytics.', columns: [{ key: 'report', label: 'Report' }], staticRows: [] },
  'reports-financial': { id: 'reports-financial', title: 'Financial Reports', subtitle: 'Financial statements and KPIs.', columns: [{ key: 'report', label: 'Report' }], staticRows: [] },
  'reports-hr': { id: 'reports-hr', title: 'HR Reports', subtitle: 'HR and payroll analytics.', columns: [{ key: 'report', label: 'Report' }], staticRows: [] },
  'settings-users': { id: 'settings-users', title: 'Users', subtitle: 'Manage system users.', columns: [{ key: 'name', label: 'User' }, { key: 'role', label: 'Role' }, { key: 'status', label: 'Status' }], staticRows: [{ name: 'John Doe', role: 'Admin', status: 'Active' }] },
  'settings-roles': { id: 'settings-roles', title: 'Roles', subtitle: 'Role definitions.', columns: [{ key: 'name', label: 'Role' }, { key: 'users', label: 'Users' }], staticRows: [{ name: 'Administrator', users: 2 }] },
  'settings-permissions': { id: 'settings-permissions', title: 'Permissions', subtitle: 'Permission matrix.', columns: [{ key: 'module', label: 'Module' }, { key: 'access', label: 'Access' }], staticRows: [] },
  'settings-documents': { id: 'settings-documents', title: 'Documents', subtitle: 'Document templates and settings.', columns: [{ key: 'name', label: 'Document' }, { key: 'type', label: 'Type' }], staticRows: [] },
  'settings-company': { id: 'settings-company', title: 'Company Settings', subtitle: 'Company profile and preferences.', columns: [{ key: 'field', label: 'Field' }, { key: 'value', label: 'Value' }], staticRows: [{ field: 'Company Name', value: 'Toys Factory ERP' }] },
  'settings-audit-logs': {
    id: 'settings-audit-logs',
    title: 'System Audit Logs',
    subtitle: 'Read-only logs tracking all user activity and system events.',
    columns: [
      { key: 'ts', label: 'Timestamp' },
      { key: 'user', label: 'User' },
      { key: 'type', label: 'Event Type' },
      { key: 'module', label: 'Module' },
      { key: 'desc', label: 'Description' },
    ],
    searchKeys: ['user', 'type', 'module', 'desc'],
  },
  'settings-profile': { id: 'settings-profile', title: 'Profile', subtitle: 'Your user profile settings.', columns: [{ key: 'field', label: 'Field' }, { key: 'value', label: 'Value' }], staticRows: [{ field: 'Name', value: 'John Doe' }, { field: 'Email', value: 'admin@toysfactory.com' }] },
  'projects': { id: 'projects', title: 'Projects', subtitle: 'Project tracking and milestones.', stateKey: 'projects', columns: [{ key: 'name', label: 'Project' }, { key: 'lead', label: 'Lead' }, { key: 'progress', label: 'Progress' }, { key: 'health', label: 'Health' }] },
  'asset-management': { id: 'asset-management', title: 'Asset Management', subtitle: 'Fixed assets and depreciation.', columns: [{ key: 'asset', label: 'Asset' }, { key: 'value', label: 'Value' }], staticRows: [] },
  'workflow-approvals': { id: 'workflow-approvals', title: 'Approvals', subtitle: 'Pending approval workflows.', columns: [{ key: 'item', label: 'Item' }, { key: 'requester', label: 'Requester' }, { key: 'status', label: 'Status' }], staticRows: [] },
  'notifications': { id: 'notifications', title: 'Notifications', subtitle: 'System notifications and alerts.', columns: [{ key: 'title', label: 'Title' }, { key: 'time', label: 'Time' }], staticRows: [{ title: 'New sales order', time: '2 hours ago' }] },
  'super-admin': { id: 'super-admin', title: 'Super Admin', subtitle: 'Cloud administration console.', columns: [{ key: 'tenant', label: 'Tenant' }, { key: 'plan', label: 'Plan' }], staticRows: [] },
  'design-system': { id: 'design-system', title: 'Design System', subtitle: 'UI component reference.', columns: [{ key: 'component', label: 'Component' }], staticRows: [{ component: 'Buttons' }, { component: 'Forms' }] },
};
