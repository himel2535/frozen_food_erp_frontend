import type { AppState } from './types';
import { DEFAULT_ALERT_SETTINGS } from '@/lib/services/alert-settings-defaults';

export const LOCAL_STORAGE_KEY = 'hookerp_auth_state';

const EMPTY_CRM_DATA = {
  customersById: {},
  customerContactsById: {},
  customerAddressesById: {},
  customerAssignmentsById: {},
  customerTagsById: {},
  leadsById: {},
  dealsById: {},
  dealActivitiesById: {},
  dealFollowUpsById: {},
  dealNotesById: {},
  dealAttachmentsById: {},
  dealStageHistoryById: {},
  activitiesById: {},
  tasksById: {},
  communicationsById: {},
  attachmentsById: {},
  supportTicketsById: {},
  paymentsById: {},
  auditLogsById: {},
  customerMergesById: {},
  quotationsById: {},
  salesOrdersById: {},
  refundsById: {},
};

/** Minimal AppState for Mongo production — no demo seeds or CRM/recipes service imports. */
export function createMongoBootstrapState(partial: Partial<AppState> | null = null): AppState {
  const base: AppState = {
    isLoggedIn: false,
    sidebarCollapsed: false,
    lang: 'en',
    crmFilter: 'all',
    invFilterCategory: 'all',
    hrmActiveTab: 'directory',
    hrmDirectoryFilterStatus: 'all',
    hrmDirectoryFilterDept: 'all',
    hrmAttendanceDate: new Date().toISOString().slice(0, 10),
    salesUi: {
      customerFilter: 'all',
      statusFilter: 'all',
      riskFilter: 'all',
      dateStart: '',
      dateEnd: '',
      search: '',
      selectedInvoiceId: null,
    },
    invoiceApprovalsById: {},
    recurringInvoicesById: {},
    paymentAllocationsById: {},
    crmCustomers: [],
    inventory: [],
    inventoryCategories: [],
    inventoryUnits: [],
    inventoryWarehouses: [],
    invoices: [],
    employees: [],
    attendance: [],
    purchases: [],
    accounting: [],
    cashboxEntries: [],
    dueEntries: [],
    purchasePayments: [],
    trialBalance: [],
    profitLoss: [],
    balanceSheet: [],
    salaryStructures: [],
    salarySheetEntries: [],
    payroll: [],
    projects: [],
    manufacturing: [],
    productionOrders: [],
    salesOrders: [],
    purchasesSuppliers: [],
    purchaseRmOrders: [],
    approvals: [],
    rawMaterials: [],
    semiFinishedProducts: [],
    finishedGoods: [],
    finishedGoodsRecipes: [],
    semiFinishedRecipes: [],
    crmData: { ...EMPTY_CRM_DATA },
    systemAuditLogsById: {},
    alertSettings: JSON.parse(JSON.stringify(DEFAULT_ALERT_SETTINGS)),
  };

  return { ...base, ...(partial ?? {}) } as AppState;
}

export function stripMongoAlertSeed(state: AppState): AppState {
  state.dueEntries = [];
  state.purchases = [];
  state.productionOrders = [];
  state.rawMaterials = [];
  state.semiFinishedProducts = [];
  state.finishedGoods = [];
  state.inventory = [];
  state.systemAuditLogsById = {};
  const crm = state.crmData as { leadsById?: Record<string, unknown> } | undefined;
  if (crm) crm.leadsById = {};
  return state;
}
