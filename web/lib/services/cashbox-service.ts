import type { AppState } from '@/lib/state/types';
import {
  createInState,
  deleteFromState,
  formatCurrency,
  listFromState,
  updateInState,
} from '@/lib/services/domain-service';
import { getCustomerList } from '@/lib/services/crm-service';
import { listSuppliers } from '@/lib/services/purchases-service';

export type CashboxEntryType = 'cash_in' | 'cash_out' | 'transfer';

export type CashboxEntry = {
  id: string;
  type: CashboxEntryType;
  description: string;
  category: string;
  party: string;
  paymentMethod: string;
  reference: string;
  note: string;
  datetime: string;
  amount: number;
  cashIn: number;
  cashOut: number;
  balance: number;
};

export type CashboxFilters = {
  dateFrom?: string;
  dateTo?: string;
  type?: string;
  category?: string;
};

export type CashboxFormValues = {
  amount: string;
  datetime: string;
  category: string;
  party: string;
  paymentMethod: string;
  reference: string;
  note: string;
  description: string;
};

const OPENING_BALANCE = 47500;

type Row = Record<string, unknown>;

function normalizeEntry(row: Row): CashboxEntry {
  const type = String(row.type ?? 'cash_in') as CashboxEntryType;
  const amount = Number(row.amount ?? 0);
  const cashIn = Number(row.cashIn ?? (type === 'cash_in' ? amount : 0));
  const cashOut = Number(row.cashOut ?? (type === 'cash_out' || type === 'transfer' ? amount : 0));
  return {
    id: String(row.id ?? ''),
    type,
    description: String(row.description ?? row.note ?? ''),
    category: String(row.category ?? 'Other Income'),
    party: String(row.party ?? ''),
    paymentMethod: String(row.paymentMethod ?? 'Cash'),
    reference: String(row.reference ?? ''),
    note: String(row.note ?? ''),
    datetime: String(row.datetime ?? new Date().toISOString()),
    amount,
    cashIn,
    cashOut,
    balance: Number(row.balance ?? 0),
  };
}

function sortAsc(entries: CashboxEntry[]): CashboxEntry[] {
  return [...entries].sort((a, b) => {
    const diff = new Date(a.datetime).getTime() - new Date(b.datetime).getTime();
    if (diff !== 0) return diff;
    return a.id.localeCompare(b.id);
  });
}

function sortDesc(entries: CashboxEntry[]): CashboxEntry[] {
  return [...entries].sort((a, b) => {
    const diff = new Date(b.datetime).getTime() - new Date(a.datetime).getTime();
    if (diff !== 0) return diff;
    return b.id.localeCompare(a.id);
  });
}

export function recalculateBalances(entries: CashboxEntry[], openingBalance = OPENING_BALANCE): CashboxEntry[] {
  const sorted = sortAsc(entries);
  let balance = openingBalance;
  return sorted.map((entry) => {
    balance += entry.cashIn - entry.cashOut;
    return { ...entry, balance };
  });
}

export function listCashboxEntries(state: AppState): CashboxEntry[] {
  const rows = listFromState(state, 'cashboxEntries');
  const normalized = rows.map(normalizeEntry);
  const recalculated = recalculateBalances(normalized);
  return sortDesc(recalculated);
}

export function filterCashboxEntries(entries: CashboxEntry[], filters: CashboxFilters): CashboxEntry[] {
  return entries.filter((entry) => {
    const entryDate = entry.datetime.slice(0, 10);
    if (filters.dateFrom && entryDate < filters.dateFrom) return false;
    if (filters.dateTo && entryDate > filters.dateTo) return false;
    if (filters.type && filters.type !== 'all') {
      if (filters.type === 'cash_in' && entry.type !== 'cash_in') return false;
      if (filters.type === 'cash_out' && entry.type !== 'cash_out') return false;
      if (filters.type === 'transfer' && entry.type !== 'transfer') return false;
    }
    if (filters.category && filters.category !== 'all' && entry.category !== filters.category) return false;
    return true;
  });
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate()
  );
}

export function getCashboxMetrics(state: AppState) {
  const entries = listCashboxEntries(state);
  const currentBalance = entries.length ? entries[0].balance : OPENING_BALANCE;
  const todayEntries = entries.filter((e) => isToday(e.datetime));
  const todayIn = todayEntries.filter((e) => e.cashIn > 0);
  const todayOut = todayEntries.filter((e) => e.cashOut > 0);
  const todayInTotal = todayIn.reduce((s, e) => s + e.cashIn, 0);
  const todayOutTotal = todayOut.reduce((s, e) => s + e.cashOut, 0);

  return {
    currentBalance,
    asOf: new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    todayInTotal,
    todayInCount: todayIn.length,
    todayOutTotal,
    todayOutCount: todayOut.length,
    netToday: todayInTotal - todayOutTotal,
  };
}

export type CashboxMetrics = ReturnType<typeof getCashboxMetrics>;

export function getFilteredTotals(entries: CashboxEntry[]) {
  const totalIn = entries.reduce((s, e) => s + e.cashIn, 0);
  const totalOut = entries.reduce((s, e) => s + e.cashOut, 0);
  return { totalIn, totalOut, netTotal: totalIn - totalOut };
}

function entryFromPayload(type: CashboxEntryType, payload: Row): Row {
  const amount = Number(payload.amount ?? 0);
  const cashIn = type === 'cash_in' ? amount : 0;
  const cashOut = type === 'cash_out' || type === 'transfer' ? amount : 0;
  return {
    type,
    description: String(payload.description ?? payload.note ?? ''),
    category: String(payload.category ?? ''),
    party: String(payload.party ?? ''),
    paymentMethod: String(payload.paymentMethod ?? 'Cash'),
    reference: String(payload.reference ?? ''),
    note: String(payload.note ?? ''),
    datetime: String(payload.datetime ?? new Date().toISOString()),
    amount,
    cashIn,
    cashOut,
    balance: 0,
  };
}

function persistEntries(state: AppState, entries: CashboxEntry[]) {
  const recalculated = recalculateBalances(entries);
  (state as Record<string, unknown>).cashboxEntries = recalculated;
}

export function createCashboxEntry(
  state: AppState,
  type: CashboxEntryType,
  payload: Row,
): { ok: true; id: string } | { ok: false; error: string } {
  const result = createInState(state, 'cashboxEntries', entryFromPayload(type, payload), 'CB');
  if (!result.ok) return result;
  const entries = listFromState(state, 'cashboxEntries').map(normalizeEntry);
  persistEntries(state, entries);
  return result;
}

export function updateCashboxEntry(
  state: AppState,
  id: string,
  payload: Row,
): { ok: boolean; error?: string } {
  const existing = listFromState(state, 'cashboxEntries').find((r) => String(r.id) === id);
  if (!existing) return { ok: false, error: 'Record not found' };
  const type = String(payload.type ?? existing.type ?? 'cash_in') as CashboxEntryType;
  const merged = { ...existing, ...entryFromPayload(type, { ...existing, ...payload }) };
  const result = updateInState(state, 'cashboxEntries', id, merged);
  if (!result.ok) return result;
  const entries = listFromState(state, 'cashboxEntries').map(normalizeEntry);
  persistEntries(state, entries);
  return result;
}

export function deleteCashboxEntry(state: AppState, id: string): { ok: boolean; error?: string } {
  const result = deleteFromState(state, 'cashboxEntries', id);
  if (!result.ok) return result;
  const entries = listFromState(state, 'cashboxEntries').map(normalizeEntry);
  persistEntries(state, entries);
  return result;
}

export function getCashboxPartyOptions(state: AppState): string[] {
  const customers = getCustomerList(state).map((c) => String(c.name ?? '')).filter(Boolean);
  const suppliers = listSuppliers(state).map((s) => String(s.name ?? s.company ?? '')).filter(Boolean);
  const staticOptions = ['Petty Cash', 'Bank Account', 'Cash Drawer', 'Maintenance Vendor', 'Stationery Shop'];
  return [...new Set([...staticOptions, ...customers, ...suppliers])].sort((a, b) => a.localeCompare(b));
}

export function formatCashboxMoney(value: number) {
  return formatCurrency(value);
}

export function formatCashboxDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function defaultFormValues(type: CashboxEntryType): CashboxFormValues {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  return {
    amount: '',
    datetime: local,
    category: type === 'cash_in' ? 'Sales' : 'Expense',
    party: '',
    paymentMethod: 'Cash',
    reference: '',
    note: '',
    description: '',
  };
}

export function entryToFormValues(entry: CashboxEntry): CashboxFormValues {
  const d = new Date(entry.datetime);
  const pad = (n: number) => String(n).padStart(2, '0');
  const local = Number.isNaN(d.getTime())
    ? entry.datetime
    : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return {
    amount: String(entry.amount || ''),
    datetime: local,
    category: entry.category,
    party: entry.party,
    paymentMethod: entry.paymentMethod,
    reference: entry.reference,
    note: entry.note,
    description: entry.description,
  };
}

export function exportCashboxCsv(entries: CashboxEntry[]) {
  const headers = ['Date & Time', 'Description', 'Category', 'Type', 'Cash In', 'Cash Out', 'Balance', 'Party', 'Reference'];
  const rows = entries.map((e) => [
    formatCashboxDateTime(e.datetime),
    e.description,
    e.category,
    e.type,
    e.cashIn ? String(e.cashIn) : '',
    e.cashOut ? String(e.cashOut) : '',
    String(e.balance),
    e.party,
    e.reference,
  ]);
  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `cashbox-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
