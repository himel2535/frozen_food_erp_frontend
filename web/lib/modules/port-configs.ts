import type { PortField, PortFilter, PortModuleConfig } from '@/lib/modules/port-types';
import { MODULE_REGISTRY as MODULE_METADATA } from '@/lib/modules/module-metadata';
import {
  crmActivityAdapter,
  stateKeyAdapter,
} from '@/lib/modules/port-adapters';

const STATUS_OPTIONS = ['active', 'inactive', 'overdue', 'credit-hold'];
const OPEN_CLOSED = ['open', 'closed', 'pending', 'cancelled'];

function basicFields(overrides: PortField[] = []): PortField[] {
  return [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
    ...overrides,
  ];
}

function fromRegistry(
  id: string,
  adapter: PortModuleConfig['adapter'],
  fieldOverrides?: PortField[],
  extra?: Partial<PortModuleConfig>
): PortModuleConfig {
  const reg = MODULE_METADATA[id];
  return {
    id,
    title: reg?.title ?? id,
    subtitle: reg?.subtitle ?? '',
    columns: reg?.columns ?? [{ key: 'name', label: 'Name' }],
    searchKeys: reg?.searchKeys ?? ['name'],
    fields: fieldOverrides ?? basicFields(),
    adapter,
    ...extra,
  };
}

function stateModule(
  id: string,
  stateKey: string,
  idPrefix: string,
  fieldOverrides?: PortField[],
  extra?: Partial<PortModuleConfig>,
  filterFn?: (row: Record<string, unknown>) => boolean
): PortModuleConfig {
  return fromRegistry(id, stateKeyAdapter(stateKey, idPrefix, filterFn), fieldOverrides, extra);
}

const activityFields: PortField[] = [
  { key: 'type', label: 'Activity Type', type: 'select', options: ['call', 'meeting', 'note', 'follow-up', 'email'], required: true },
  { key: 'summary', label: 'Summary', type: 'text', required: true },
  { key: 'entityType', label: 'Entity Type', type: 'select', options: ['customer', 'lead', 'deal'] },
  { key: 'entityId', label: 'Entity ID', type: 'text' },
  { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
];

export const PORT_CONFIGS: Record<string, PortModuleConfig> = {
  // ── CRM (activities only — customers/leads/deals/complaints use dedicated pages) ──
  'crm-activities': fromRegistry('crm-activities', crmActivityAdapter(), activityFields, {
    searchKeys: ['summary', 'type'],
  }),

  // ── Sales (wholesale only — other sales routes use dedicated pages) ──
  'sales-wholesale': stateModule('sales-wholesale', 'wholesaleOrders', 'WS', [
    { key: 'buyer', label: 'Buyer', type: 'text', required: true },
    { key: 'total', label: 'Total', type: 'number', required: true },
    { key: 'status', label: 'Status', type: 'select', options: OPEN_CLOSED },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  // ── Purchases ──
  'purchases-suppliers': stateModule('purchases-suppliers', 'purchasesSuppliers', 'SUP', [
    { key: 'name', label: 'Supplier Name', type: 'text', required: true },
    { key: 'due', label: 'Outstanding Due', type: 'number', advanced: true },
    { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  'purchases-orders': stateModule('purchases-orders', 'purchases', 'PO', [
    { key: 'supplier', label: 'Supplier', type: 'text', required: true },
    { key: 'total', label: 'Total', type: 'number', required: true },
    { key: 'status', label: 'Status', type: 'select', options: ['draft', 'ordered', 'received', 'cancelled'] },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  'purchases-goods-received': stateModule('purchases-goods-received', 'goodsReceived', 'GRN', [
    { key: 'supplier', label: 'Supplier', type: 'text', required: true },
    { key: 'status', label: 'Status', type: 'select', options: OPEN_CLOSED },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  'purchases-bills': stateModule('purchases-bills', 'vendorBills', 'BILL', [
    { key: 'supplier', label: 'Supplier', type: 'text', required: true },
    { key: 'amount', label: 'Amount', type: 'number', required: true },
    { key: 'status', label: 'Status', type: 'select', options: ['draft', 'posted', 'paid'] },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  'purchases-payments': stateModule('purchases-payments', 'purchasePayments', 'PP', [
    { key: 'supplier', label: 'Supplier', type: 'text', required: true },
    { key: 'amount', label: 'Amount', type: 'number', required: true },
    { key: 'status', label: 'Status', type: 'select', options: ['paid', 'pending'] },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  'purchases-returns': stateModule('purchases-returns', 'purchaseReturns', 'PR', [
    { key: 'supplier', label: 'Supplier', type: 'text', required: true },
    { key: 'status', label: 'Status', type: 'select', options: OPEN_CLOSED },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  'purchases-recipes': stateModule('purchases-recipes', 'recipes', 'RCP', [
    { key: 'product', label: 'Product', type: 'text', required: true },
    { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  // ── Manufacturing ──
  'manufacturing-orders': stateModule('manufacturing-orders', 'productionOrders', 'MO', [
    { key: 'product', label: 'Product', type: 'text', required: true },
    { key: 'status', label: 'Status', type: 'select', options: ['planned', 'in-progress', 'completed', 'cancelled'] },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  'manufacturing-bom': stateModule('manufacturing-bom', 'bom', 'BOM', [
    { key: 'product', label: 'Product', type: 'text', required: true },
    { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  'manufacturing-machine-maintenance': stateModule('manufacturing-machine-maintenance', 'machineMaintenance', 'MM', [
    { key: 'machine', label: 'Machine', type: 'text', required: true },
    { key: 'status', label: 'Status', type: 'select', options: ['scheduled', 'in-progress', 'completed'] },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  'manufacturing-mold-management': stateModule('manufacturing-mold-management', 'molds', 'MOLD', [
    { key: 'mold', label: 'Mold', type: 'text', required: true },
    { key: 'status', label: 'Status', type: 'select', options: ['active', 'maintenance', 'retired'] },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  'manufacturing-wastage': stateModule('manufacturing-wastage', 'wastage', 'WST', [
    { key: 'product', label: 'Product', type: 'text', required: true },
    { key: 'qty', label: 'Quantity', type: 'number', required: true },
    { key: 'status', label: 'Status', type: 'select', options: ['recorded', 'reviewed'] },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  'manufacturing-packing': stateModule('manufacturing-packing', 'packing', 'PKG', [
    { key: 'batch', label: 'Batch', type: 'text', required: true },
    { key: 'product', label: 'Product', type: 'text', required: true },
    { key: 'status', label: 'Status', type: 'select', options: OPEN_CLOSED },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  // ── Accounting ──
  'accounting-dues': stateModule('accounting-dues', 'dues', 'DUE', [
    { key: 'party', label: 'Party', type: 'text', required: true },
    { key: 'type', label: 'Type', type: 'select', options: ['receivable', 'payable'] },
    { key: 'due', label: 'Amount Due', type: 'number' },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  'accounting-receivables': fromRegistry(
    'accounting-receivables',
    stateKeyAdapter('crmCustomers', 'CUST'),
    [
      { key: 'name', label: 'Customer', type: 'text', required: true },
      { key: 'due', label: 'Due', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
      { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
    ]
  ),

  'accounting-payables': fromRegistry(
    'accounting-payables',
    stateKeyAdapter('purchasesSuppliers', 'SUP'),
    [
      { key: 'name', label: 'Supplier', type: 'text', required: true },
      { key: 'due', label: 'Due', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
      { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
    ]
  ),

  'accounting-journals': stateModule('accounting-journals', 'journals', 'JE', [
    { key: 'account', label: 'Account', type: 'text', required: true },
    { key: 'debit', label: 'Debit', type: 'number' },
    { key: 'credit', label: 'Credit', type: 'number' },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  'accounting-ledger': stateModule('accounting-ledger', 'accounting', 'GL', [
    { key: 'account', label: 'Account', type: 'text', required: true },
    { key: 'desc', label: 'Description', type: 'text' },
    { key: 'balance', label: 'Balance', type: 'number' },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  'accounting-trial': stateModule('accounting-trial', 'trialBalance', 'TB', [
    { key: 'account', label: 'Account', type: 'text', required: true },
    { key: 'debit', label: 'Debit', type: 'number' },
    { key: 'credit', label: 'Credit', type: 'number' },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  'accounting-pl': stateModule('accounting-pl', 'profitLoss', 'PL', [
    { key: 'line', label: 'Line Item', type: 'text', required: true },
    { key: 'amount', label: 'Amount', type: 'number' },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  'accounting-balance': stateModule('accounting-balance', 'balanceSheet', 'BS', [
    { key: 'line', label: 'Line Item', type: 'text', required: true },
    { key: 'amount', label: 'Amount', type: 'number' },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  // ── HRM ──
  'hrm-employees': stateModule('hrm-employees', 'employees', 'EMP', [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'department', label: 'Department', type: 'text' },
    { key: 'designation', label: 'Designation', type: 'text' },
    { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'on-leave'] },
    { key: 'email', label: 'Email', type: 'email', advanced: true },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ], { searchKeys: ['name', 'email'] }),

  'hrm-departments': stateModule('hrm-departments', 'departments', 'DEPT', [
    { key: 'name', label: 'Department', type: 'text', required: true },
    { key: 'head', label: 'Head', type: 'text' },
    { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  'hrm-designations': stateModule('hrm-designations', 'designations', 'DES', [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'department', label: 'Department', type: 'text' },
    { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  'hrm-attendance': stateModule('hrm-attendance', 'attendance', 'ATT', [
    { key: 'date', label: 'Date', type: 'date', required: true },
    { key: 'employeeId', label: 'Employee ID', type: 'text', required: true },
    { key: 'status', label: 'Status', type: 'select', options: ['present', 'absent', 'late', 'leave'] },
    { key: 'workingHours', label: 'Hours', type: 'number', advanced: true },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  'hrm-leave': stateModule('hrm-leave', 'leaveRequests', 'LV', [
    { key: 'employee', label: 'Employee', type: 'text', required: true },
    { key: 'type', label: 'Leave Type', type: 'select', options: ['annual', 'sick', 'casual', 'unpaid'] },
    { key: 'status', label: 'Status', type: 'select', options: ['pending', 'approved', 'rejected'] },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  // ── Payroll ──
  'payroll-structures': stateModule('payroll-structures', 'salaryStructures', 'SS', [
    { key: 'name', label: 'Structure Name', type: 'text', required: true },
    { key: 'base', label: 'Base Salary', type: 'number' },
    { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  'payroll-runs': stateModule('payroll-runs', 'payrollRuns', 'PR', [
    { key: 'period', label: 'Period', type: 'text', required: true },
    { key: 'status', label: 'Status', type: 'select', options: ['draft', 'processing', 'completed'] },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  'payroll-slips': stateModule('payroll-slips', 'payroll', 'PS', [
    { key: 'name', label: 'Employee', type: 'text', required: true },
    { key: 'net', label: 'Net Pay', type: 'number' },
    { key: 'status', label: 'Status', type: 'select', options: ['draft', 'approved', 'paid'] },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  // ── Reports (read-only style — create disabled via no adapter.create in EnhancedCrudModule) ──
  ...Object.fromEntries(
    (['reports-sales', 'reports-purchases', 'reports-inventory', 'reports-customers', 'reports-suppliers', 'reports-financial', 'reports-hr'] as const).map((id) => [
      id,
      {
        ...fromRegistry(id, {
          list: () => MODULE_METADATA[id].staticRows ?? [],
        }),
        fields: basicFields(),
      } satisfies PortModuleConfig,
    ])
  ),

  // ── Settings ──
  'settings-users': stateModule('settings-users', 'users', 'USR', [
    { key: 'name', label: 'User', type: 'text', required: true },
    { key: 'role', label: 'Role', type: 'select', options: ['Admin', 'Manager', 'User', 'Viewer'] },
    { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  'settings-roles': stateModule('settings-roles', 'roles', 'ROLE', [
    { key: 'name', label: 'Role', type: 'text', required: true },
    { key: 'users', label: 'User Count', type: 'number' },
    { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  'settings-permissions': stateModule('settings-permissions', 'permissions', 'PERM', [
    { key: 'module', label: 'Module', type: 'text', required: true },
    { key: 'access', label: 'Access Level', type: 'select', options: ['none', 'read', 'write', 'admin'] },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  'settings-documents': stateModule('settings-documents', 'documents', 'DOC', [
    { key: 'name', label: 'Document', type: 'text', required: true },
    { key: 'type', label: 'Type', type: 'select', options: ['invoice', 'quotation', 'purchase-order', 'payslip'] },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  'settings-company': stateModule('settings-company', 'companySettings', 'SET', [
    { key: 'field', label: 'Field', type: 'text', required: true },
    { key: 'value', label: 'Value', type: 'text', required: true },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  'settings-audit-logs': {
    ...fromRegistry('settings-audit-logs', {
      list: () => MODULE_METADATA['settings-audit-logs'].staticRows ?? [],
    }),
    fields: [
      { key: 'user', label: 'User', type: 'text' },
      { key: 'type', label: 'Event Type', type: 'text' },
      { key: 'module', label: 'Module', type: 'text' },
      { key: 'desc', label: 'Description', type: 'textarea' },
    ],
  },

  'settings-profile': stateModule('settings-profile', 'profileSettings', 'PROF', [
    { key: 'field', label: 'Field', type: 'text', required: true },
    { key: 'value', label: 'Value', type: 'text', required: true },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  // ── Other ──
  'projects': stateModule('projects', 'projects', 'PRJ', [
    { key: 'name', label: 'Project', type: 'text', required: true },
    { key: 'lead', label: 'Lead', type: 'text' },
    { key: 'progress', label: 'Progress %', type: 'number' },
    { key: 'health', label: 'Health', type: 'select', options: ['green', 'amber', 'red'] },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  'asset-management': stateModule('asset-management', 'assets', 'AST', [
    { key: 'asset', label: 'Asset', type: 'text', required: true },
    { key: 'value', label: 'Value', type: 'number' },
    { key: 'status', label: 'Status', type: 'select', options: ['active', 'disposed', 'maintenance'] },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  'workflow-approvals': stateModule('workflow-approvals', 'approvals', 'APR', [
    { key: 'item', label: 'Item', type: 'text', required: true },
    { key: 'requester', label: 'Requester', type: 'text' },
    { key: 'status', label: 'Status', type: 'select', options: ['pending', 'approved', 'rejected'] },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  'notifications': stateModule('notifications', 'notifications', 'NTF', [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'time', label: 'Time', type: 'text' },
    { key: 'status', label: 'Status', type: 'select', options: ['unread', 'read'] },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ]),

  'super-admin': {
    ...fromRegistry('super-admin', { list: () => MODULE_METADATA['super-admin'].staticRows ?? [] }),
    fields: basicFields(),
  },

  'design-system': {
    ...fromRegistry('design-system', { list: () => MODULE_METADATA['design-system'].staticRows ?? [] }),
    fields: basicFields(),
  },
};
