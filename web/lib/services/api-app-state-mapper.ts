import type { ApiModule } from '@/lib/config/data-source';
import type { AppState, CompanyProfile, CompanySignature, CurrentUserProfile } from '@/lib/state/types';
import { mapGenericApiRow, mapGenericPayloadToApi } from '@/lib/services/generic-api-mapper';
import { mapApiInvoiceRow } from '@/lib/services/entity-api-mappers';
import { apiDocId } from '@/lib/services/api-resource-service';
import { ensureCrmState } from '@/lib/services/crm-service';
import { ensureSettingsState } from '@/lib/services/settings-service';
import { ensureRecipesState } from '@/lib/services/recipes-service';
import { DEFAULT_ALERT_SETTINGS } from '@/lib/services/alert-settings-defaults';
import type { AlertSettings } from '@/lib/services/business-alert-types';

function rowsOf(data: Partial<Record<ApiModule, Record<string, unknown>[]>>, mod: ApiModule) {
  return (data[mod] ?? []).map(mapGenericApiRow);
}

function assignArray(state: AppState, key: string, rows: Record<string, unknown>[]) {
  (state as Record<string, unknown>)[key] = rows;
}

function indexById(rows: Record<string, unknown>[]) {
  const map: Record<string, Record<string, unknown>> = {};
  for (const row of rows) {
    map[String(row.id)] = row;
  }
  return map;
}

function applyCrmIndexed(state: AppState, data: Partial<Record<ApiModule, Record<string, unknown>[]>>) {
  ensureCrmState(state);
  const crm = state.crmData!;
  const pairs: [ApiModule, keyof typeof crm][] = [
    ['leads', 'leadsById'],
    ['deals', 'dealsById'],
    ['quotations', 'quotationsById'],
    ['payments', 'paymentsById'],
    ['complaints', 'supportTicketsById'],
    ['crmActivities', 'activitiesById'],
  ];
  for (const [mod, key] of pairs) {
    const rows = rowsOf(data, mod);
    if (rows.length > 0) {
      (crm as Record<string, unknown>)[key as string] = indexById(rows);
    }
  }
  const customers = rowsOf(data, 'customers');
  if (customers.length > 0) {
    crm.customersById = indexById(customers);
  }
  const orders = rowsOf(data, 'salesOrders');
  if (orders.length > 0) {
    crm.salesOrdersById = indexById(orders);
  }
}

function applySettingsDocs(state: AppState, docs: Record<string, unknown>[]) {
  ensureSettingsState(state);
  for (const doc of docs) {
    const key = String(doc.settingsKey ?? doc.profileType ?? doc.field ?? '');
    const payload = (doc.payload ?? doc.data ?? doc) as Record<string, unknown>;
    if (key === 'companyProfile' || key === 'main') {
      state.companyProfile = { ...state.companyProfile, ...payload } as CompanyProfile;
    } else if (key === 'companySignatures' || key === 'signatures') {
      state.companySignatures = (payload.signatures ?? payload) as CompanySignature[];
    } else if (key === 'alertSettings' || key === 'alerts') {
      state.alertSettings = (payload.settings ?? payload) as AlertSettings;
    } else if (key === 'currentUser' || key === 'profile') {
      state.currentUser = { ...state.currentUser, ...payload } as CurrentUserProfile;
    } else if (doc.name && !key) {
      state.companyProfile = { ...state.companyProfile, ...doc } as CompanyProfile;
    }
  }
  if (!state.alertSettings) {
    state.alertSettings = JSON.parse(JSON.stringify(DEFAULT_ALERT_SETTINGS));
  }
}

/** Merge live API rows into an AppState snapshot (read path for legacy services). */
export function applyApiDataToAppState(
  base: AppState,
  data: Partial<Record<ApiModule, Record<string, unknown>[]>>,
): AppState {
  const next = { ...base } as AppState;

  const arrayMap: [ApiModule, string][] = [
    ['customers', 'crmCustomers'],
    ['products', 'inventory'],
    ['suppliers', 'purchasesSuppliers'],
    ['employees', 'employees'],
    ['salesOrders', 'salesOrders'],
    ['invoices', 'invoices'],
    ['categories', 'inventoryCategories'],
    ['units', 'inventoryUnits'],
    ['warehouses', 'inventoryWarehouses'],
    ['rawMaterials', 'rawMaterials'],
    ['semiFinishedProducts', 'semiFinishedProducts'],
    ['finishedGoods', 'finishedGoods'],
    ['purchaseOrders', 'purchases'],
    ['purchaseRm', 'purchaseRmOrders'],
    ['purchasePayments', 'purchasePayments'],
    ['vendorBills', 'vendorBills'],
    ['goodsReceived', 'goodsReceived'],
    ['dues', 'dueEntries'],
    ['cashbox', 'cashboxEntries'],
    ['trialBalance', 'trialBalance'],
    ['profitLoss', 'profitLoss'],
    ['balanceSheet', 'balanceSheet'],
    ['salarySheet', 'salarySheetEntries'],
    ['salaryStructures', 'salaryStructures'],
    ['payrollSlips', 'payroll'],
    ['payrollRuns', 'payrollRuns'],
    ['productionOrders', 'productionOrders'],
    ['projects', 'projects'],
    ['workflowApprovals', 'approvals'],
    ['attendance', 'attendance'],
    ['departments', 'departments'],
    ['designations', 'designations'],
    ['leaveRequests', 'leaveRequests'],
    ['deliveries', 'deliveries'],
    ['dispatch', 'dispatchRecords'],
    ['returns', 'returns'],
    ['pos', 'posReceipts'],
    ['stockIn', 'stockInRecords'],
    ['stockOut', 'stockOutRecords'],
    ['stockTransfers', 'stockTransfers'],
    ['stockAdjustments', 'stockAdjustments'],
    ['journals', 'journals'],
    ['ledger', 'ledger'],
    ['assets', 'assets'],
    ['documents', 'documents'],
    ['users', 'users'],
    ['roles', 'roles'],
    ['notifications', 'notifications'],
  ];

  for (const [mod, key] of arrayMap) {
    const rows = data[mod];
    if (rows && rows.length >= 0) {
      assignArray(next, key, mod === 'invoices' ? rows.map(mapApiInvoiceRow) : rowsOf(data, mod));
    }
  }

  const recipes = rowsOf(data, 'recipes');
  if (data.recipes !== undefined) {
    next.finishedGoodsRecipes = recipes.filter((r) => String(r.variant ?? 'finished-goods') !== 'semi-finished');
    next.semiFinishedRecipes = recipes.filter((r) => String(r.variant) === 'semi-finished');
  }

  applySettingsDocs(next, rowsOf(data, 'companySettings'));
  applyCrmIndexed(next, data);

  ensureCrmState(next);
  ensureSettingsState(next);
  ensureRecipesState(next);
  return next;
}

export function settingsDocBody(key: string, payload: unknown) {
  return mapGenericPayloadToApi({ settingsKey: key, payload });
}

export function findSettingsDocId(docs: Record<string, unknown>[], key: string) {
  const match = docs.find((d) => String(d.settingsKey ?? d.profileType ?? d.field ?? '') === key);
  return match ? apiDocId(match) : undefined;
}
