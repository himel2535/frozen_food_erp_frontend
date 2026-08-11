import type { AppState } from '@/lib/state/types';
import { formatAppDate } from '@/lib/i18n/locale-format';
import {
  createInState,
  formatCurrency,
  listFromState,
  sortRowsNewestFirst,
  updateInState,
} from '@/lib/services/domain-service';

export type DueEntryType = 'customer' | 'supplier';
export type DueStatus = 'due_today' | 'overdue' | 'partial' | 'upcoming';

export type DueEntry = {
  id: string;
  type: DueEntryType;
  partyId: string;
  partyName: string;
  partyLocation: string;
  invoiceId: string;
  invoiceDate: string;
  total: number;
  paid: number;
  due: number;
  dueDate: string;
  status: DueStatus;
  overdueDays?: number;
  daysUntilDue?: number;
  totalBusiness?: number;
};

export type DueFilters = {
  type?: DueEntryType;
  search?: string;
  status?: string;
};

export type PartySummary = {
  partyId: string;
  partyName: string;
  partyLocation: string;
  type: DueEntryType;
  totalDue: number;
  totalOverdue: number;
  totalPaid: number;
  totalBusiness: number;
  invoiceCount: number;
};

type Row = Record<string, unknown>;

const TODAY = '2026-07-28';

function normalizeEntry(row: Row): DueEntry {
  const total = Number(row.total ?? 0);
  const paid = Number(row.paid ?? 0);
  const due = Number(row.due ?? Math.max(0, total - paid));
  const dueDate = String(row.dueDate ?? '');
  let status = String(row.status ?? 'upcoming') as DueStatus;
  let overdueDays = Number(row.overdueDays ?? 0) || undefined;
  let daysUntilDue = Number(row.daysUntilDue ?? 0) || undefined;

  if (!row.status && dueDate) {
    if (dueDate === TODAY) status = paid > 0 && due > 0 ? 'partial' : 'due_today';
    else if (dueDate < TODAY) {
      status = 'overdue';
      overdueDays = Math.max(1, Math.floor((new Date(TODAY).getTime() - new Date(dueDate).getTime()) / 86400000));
    } else {
      status = paid > 0 && due > 0 ? 'partial' : 'upcoming';
      daysUntilDue = Math.max(1, Math.floor((new Date(dueDate).getTime() - new Date(TODAY).getTime()) / 86400000));
    }
  }

  return {
    id: String(row.id ?? ''),
    type: (row.type === 'supplier' ? 'supplier' : 'customer') as DueEntryType,
    partyId: String(row.partyId ?? ''),
    partyName: String(row.partyName ?? ''),
    partyLocation: String(row.partyLocation ?? ''),
    invoiceId: String(row.invoiceId ?? ''),
    invoiceDate: String(row.invoiceDate ?? ''),
    total,
    paid,
    due,
    dueDate,
    status,
    overdueDays,
    daysUntilDue,
    totalBusiness: Number(row.totalBusiness ?? 0) || undefined,
  };
}

export function listDueEntries(state: AppState, type?: DueEntryType): DueEntry[] {
  const rows = listFromState(state, 'dueEntries').map(normalizeEntry);
  const open = rows.filter((e) => e.due > 0);
  const filtered = type ? open.filter((e) => e.type === type) : open;
  return sortRowsNewestFirst(filtered);
}

export function getDueMetrics(state: AppState) {
  const entries = listDueEntries(state);
  const customerEntries = entries.filter((e) => e.type === 'customer');
  const supplierEntries = entries.filter((e) => e.type === 'supplier');
  const customerDue = customerEntries.reduce((s, e) => s + e.due, 0);
  const supplierDue = supplierEntries.reduce((s, e) => s + e.due, 0);
  const overdueEntries = entries.filter((e) => e.status === 'overdue');
  const overdueTotal = overdueEntries.reduce((s, e) => s + e.due, 0);
  const customerCount = new Set(customerEntries.map((e) => e.partyId)).size;
  const supplierCount = new Set(supplierEntries.map((e) => e.partyId)).size;

  return {
    customerDue,
    customerCount,
    supplierDue,
    supplierCount,
    overdueTotal,
    overdueCount: overdueEntries.length,
  };
}

export type DueMetrics = ReturnType<typeof getDueMetrics>;

export function filterDueEntries(entries: DueEntry[], filters: DueFilters): DueEntry[] {
  return entries.filter((entry) => {
    if (filters.type && entry.type !== filters.type) return false;
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'due_today' && entry.status !== 'due_today') return false;
      if (filters.status === 'overdue' && entry.status !== 'overdue') return false;
      if (filters.status === 'partial' && entry.status !== 'partial') return false;
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const hay = `${entry.partyName} ${entry.invoiceId} ${entry.partyLocation}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function getPartySummary(entries: DueEntry[], partyId: string): PartySummary | null {
  const partyEntries = entries.filter((e) => e.partyId === partyId && e.due > 0);
  if (!partyEntries.length) return null;
  const first = partyEntries[0];
  return {
    partyId,
    partyName: first.partyName,
    partyLocation: first.partyLocation,
    type: first.type,
    totalDue: partyEntries.reduce((s, e) => s + e.due, 0),
    totalOverdue: partyEntries.filter((e) => e.status === 'overdue').reduce((s, e) => s + e.due, 0),
    totalPaid: partyEntries.reduce((s, e) => s + e.paid, 0),
    totalBusiness: first.totalBusiness ?? partyEntries.reduce((s, e) => s + e.total, 0),
    invoiceCount: partyEntries.length,
  };
}

export function getPartyInvoices(entries: DueEntry[], partyId: string): DueEntry[] {
  return entries.filter((e) => e.partyId === partyId && e.due > 0);
}

export function receiveDuePayment(
  state: AppState,
  entryId: string,
  amount: number,
): { ok: boolean; error?: string } {
  const rows = listFromState(state, 'dueEntries');
  const idx = rows.findIndex((r) => String(r.id) === entryId);
  if (idx < 0) return { ok: false, error: 'Entry not found' };
  const entry = normalizeEntry(rows[idx]);
  const payAmount = Math.min(amount, entry.due);
  const paid = entry.paid + payAmount;
  const due = Math.max(0, entry.total - paid);
  const updated = {
    ...rows[idx],
    paid,
    due,
    status: due <= 0 ? 'upcoming' : paid > 0 ? 'partial' : entry.status,
  };
  updateInState(state, 'dueEntries', entryId, updated);
  return { ok: true };
}

export function createOpeningDue(state: AppState, payload: Row): { ok: true; id: string } | { ok: false; error: string } {
  const type = payload.type === 'supplier' ? 'supplier' : 'customer';
  const total = Number(payload.amount ?? payload.due ?? 0);
  const dueDate = String(payload.dueDate ?? TODAY);
  const partyName = String(payload.party ?? payload.partyName ?? '');
  const result = createInState(state, 'dueEntries', {
    type,
    partyId: `OPEN-${Date.now()}`,
    partyName,
    partyLocation: String(payload.location ?? '—'),
    invoiceId: String(payload.invoiceId ?? `OPEN-${String(Date.now()).slice(-4)}`),
    invoiceDate: new Date().toISOString().slice(0, 10),
    total,
    paid: 0,
    due: total,
    dueDate,
    status: dueDate === TODAY ? 'due_today' : dueDate < TODAY ? 'overdue' : 'upcoming',
    totalBusiness: total,
  }, 'DUE');
  return result;
}

export function formatDueMoney(value: number) {
  return formatCurrency(value);
}

export function formatDueDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return formatAppDate(d, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function getPartyInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function getDueStatusLabel(entry: DueEntry) {
  if (entry.status === 'due_today') return 'Due Today';
  if (entry.status === 'overdue') return `Overdue ${entry.overdueDays ?? ''} Days`.trim();
  if (entry.status === 'partial') return 'Partial';
  if (entry.daysUntilDue) return `Due in ${entry.daysUntilDue} Days`;
  return 'Upcoming';
}
