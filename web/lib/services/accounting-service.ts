import type { AppState } from '@/lib/state/types';
import { listFromState, createInState, updateInState, deleteFromState, formatCurrency } from '@/lib/services/domain-service';

type Row = Record<string, unknown>;

export function listJournals(state: AppState) {
  return listFromState(state, 'journals');
}

export function listLedger(state: AppState) {
  return listFromState(state, 'accounting');
}

export function listDues(state: AppState) {
  return listFromState(state, 'dues');
}

export function listTrialBalance(state: AppState) {
  return listFromState(state, 'trialBalance');
}

export function listProfitLoss(state: AppState) {
  return listFromState(state, 'profitLoss');
}

export function listBalanceSheet(state: AppState) {
  return listFromState(state, 'balanceSheet');
}

export function createJournalEntry(state: AppState, payload: Row) {
  const debit = Number(payload.debit ?? 0);
  const credit = Number(payload.credit ?? 0);
  const result = createInState(state, 'journals', {
    ...payload,
    desc: payload.desc ?? payload.description,
    debit,
    credit,
    date: payload.date ?? new Date().toISOString().split('T')[0],
  }, 'JRN');
  if (result.ok) {
    const ledger = listLedger(state);
    const lastBal = ledger.length ? Number(ledger[ledger.length - 1].balance ?? 0) : 0;
    createInState(state, 'accounting', {
      ref: String(payload.ref ?? result.id),
      date: payload.date ?? new Date().toISOString().split('T')[0],
      account: payload.account,
      desc: payload.desc ?? payload.description ?? 'Journal entry',
      debit,
      credit,
      balance: lastBal + credit - debit,
    }, 'TXN');
  }
  return result;
}

export function updateJournalEntry(state: AppState, id: string, payload: Row) {
  return updateInState(state, 'journals', id, payload);
}

export function deleteJournalEntry(state: AppState, id: string) {
  return deleteFromState(state, 'journals', id);
}

export function getJournalMetrics(rows: Row[]) {
  const totalDebit = rows.reduce((s, r) => s + Number(r.debit ?? 0), 0);
  const pending = rows.filter((r) => String(r.status ?? '').toLowerCase() === 'pending').length;
  return { totalEntries: rows.length, totalDebit, pending };
}

export function getLedgerMetrics(rows: Row[]) {
  const lastBal = rows.length ? Number(rows[rows.length - 1].balance ?? 0) : 0;
  return { totalEntries: rows.length, netBalance: lastBal };
}

export function crudAccounting(stateKey: string, prefix: string) {
  return {
    list: (state: AppState) => listFromState(state, stateKey),
    create: (state: AppState, payload: Row) => createInState(state, stateKey, payload, prefix),
    update: (state: AppState, id: string, payload: Row) => updateInState(state, stateKey, id, payload),
    delete: (state: AppState, id: string) => deleteFromState(state, stateKey, id),
  };
}

export { formatCurrency as formatMoney };
