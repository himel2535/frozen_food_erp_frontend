import type { AppState } from '@/lib/state/types';
import { createInState, formatCurrency, listFromState } from '@/lib/services/domain-service';

export interface TrialBalanceAccount {
  id: string;
  accountCode: string;
  accountName: string;
  parentAccount: string;
  debit: number;
  credit: number;
  active: boolean;
  notes?: string;
  children?: TrialBalanceAccount[];
}

export interface TrialBalanceMetrics {
  totalDebit: number;
  totalCredit: number;
  difference: number;
  isBalanced: boolean;
}

export interface TrialBalanceFilters {
  search?: string;
  showZeroBalance?: boolean;
  showInactiveAccounts?: boolean;
}

export interface TrialBalanceLinePayload {
  accountCode: string;
  accountName: string;
  parentAccount: string;
  debit?: number;
  credit?: number;
  active?: boolean;
  notes?: string;
}

function normalizeRow(row: Record<string, unknown>): TrialBalanceAccount {
  return {
    id: String(row.id ?? ''),
    accountCode: String(row.accountCode ?? row.code ?? ''),
    accountName: String(row.accountName ?? row.account ?? row.name ?? ''),
    parentAccount: String(row.parentAccount ?? row.parent ?? ''),
    debit: Number(row.debit ?? 0),
    credit: Number(row.credit ?? 0),
    active: row.active !== false,
    notes: row.notes ? String(row.notes) : undefined,
    children: Array.isArray(row.children)
      ? (row.children as Record<string, unknown>[]).map(normalizeRow)
      : undefined,
  };
}

export function listTrialBalanceAccounts(state: AppState): TrialBalanceAccount[] {
  return listFromState(state, 'trialBalance').map(normalizeRow);
}

export function getTrialBalanceMetrics(rows: TrialBalanceAccount[]): TrialBalanceMetrics {
  const totalDebit = rows.reduce((sum, row) => sum + row.debit, 0);
  const totalCredit = rows.reduce((sum, row) => sum + row.credit, 0);
  const difference = Math.abs(totalDebit - totalCredit);
  return {
    totalDebit,
    totalCredit,
    difference,
    isBalanced: difference < 0.01,
  };
}

export function filterTrialBalanceAccounts(
  rows: TrialBalanceAccount[],
  filters: TrialBalanceFilters,
): TrialBalanceAccount[] {
  const search = (filters.search ?? '').trim().toLowerCase();
  return rows.filter((row) => {
    if (!filters.showInactiveAccounts && !row.active) return false;
    if (!filters.showZeroBalance && row.debit === 0 && row.credit === 0) return false;
    if (!search) return true;
    const haystack = `${row.accountCode} ${row.accountName} ${row.parentAccount}`.toLowerCase();
    return haystack.includes(search);
  });
}

export function createTrialBalanceLine(state: AppState, payload: TrialBalanceLinePayload) {
  const debit = Number(payload.debit ?? 0);
  const credit = Number(payload.credit ?? 0);
  if (!payload.accountCode?.trim() || !payload.accountName?.trim()) {
    return { ok: false as const, error: 'Account code and name are required.' };
  }
  return createInState(state, 'trialBalance', {
    accountCode: payload.accountCode.trim(),
    accountName: payload.accountName.trim(),
    parentAccount: payload.parentAccount || 'Assets',
    debit,
    credit,
    active: payload.active !== false,
    notes: payload.notes?.trim() || '',
  }, 'TB');
}

export function formatTrialMoney(value: number) {
  return formatCurrency(value);
}

export function formatTrialAmount(value: number) {
  if (value === 0) return '0.00';
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
