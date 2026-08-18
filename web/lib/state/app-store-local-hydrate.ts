import { DEFAULT_STATE, LOCAL_STORAGE_KEY } from './default-state';
import type { AppState } from './types';
import { ensureCrmState } from '../services/crm-service';
import { ensureSettingsState } from '../services/settings-service';
import { ensureRecipesState } from '../services/recipes-service';
import { ensureAuditState } from '../services/audit-log-service';

export { LOCAL_STORAGE_KEY };

export function getDefaultAppState(): AppState {
  return DEFAULT_STATE;
}

export function hydrateLocalAppState(state: Partial<AppState> | null): AppState {
  const nextState = { ...DEFAULT_STATE, ...(state ?? {}) } as AppState;
  if (!nextState.inventory) nextState.inventory = DEFAULT_STATE.inventory;
  if (!nextState.invoices) nextState.invoices = DEFAULT_STATE.invoices;
  if (!nextState.employees) nextState.employees = DEFAULT_STATE.employees;
  if (!nextState.attendance) nextState.attendance = DEFAULT_STATE.attendance;
  if (!nextState.purchases) nextState.purchases = DEFAULT_STATE.purchases;
  if (!nextState.accounting) nextState.accounting = DEFAULT_STATE.accounting;
  if (!nextState.cashboxEntries) nextState.cashboxEntries = DEFAULT_STATE.cashboxEntries;
  if (!nextState.dueEntries) nextState.dueEntries = DEFAULT_STATE.dueEntries;
  if (!nextState.purchasePayments) nextState.purchasePayments = DEFAULT_STATE.purchasePayments;
  if (!nextState.trialBalance) nextState.trialBalance = DEFAULT_STATE.trialBalance;
  if (!nextState.profitLoss) nextState.profitLoss = DEFAULT_STATE.profitLoss;
  if (!nextState.balanceSheet) nextState.balanceSheet = DEFAULT_STATE.balanceSheet;
  if (!nextState.salaryStructures) nextState.salaryStructures = DEFAULT_STATE.salaryStructures;
  if (!nextState.salarySheetEntries) nextState.salarySheetEntries = DEFAULT_STATE.salarySheetEntries;
  if (!nextState.payroll) nextState.payroll = DEFAULT_STATE.payroll;
  if (!nextState.projects) nextState.projects = DEFAULT_STATE.projects;
  if (!nextState.manufacturing) nextState.manufacturing = DEFAULT_STATE.manufacturing;
  if (!nextState.productionOrders) nextState.productionOrders = DEFAULT_STATE.productionOrders;
  if (!nextState.salesOrders) nextState.salesOrders = DEFAULT_STATE.salesOrders;
  if (!nextState.purchasesSuppliers) nextState.purchasesSuppliers = DEFAULT_STATE.purchasesSuppliers;
  if (!nextState.purchaseRmOrders) nextState.purchaseRmOrders = DEFAULT_STATE.purchaseRmOrders;
  if (!nextState.approvals) nextState.approvals = DEFAULT_STATE.approvals;
  if (!nextState.lang) nextState.lang = 'en';
  ensureCrmState(nextState);
  ensureSettingsState(nextState);
  ensureRecipesState(nextState);
  ensureAuditState(nextState);
  return nextState;
}
