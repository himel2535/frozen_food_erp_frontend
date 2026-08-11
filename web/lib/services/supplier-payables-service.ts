import type { AppState } from '@/lib/state/types';
import { createInState, listFromState, sortRowsNewestFirst, updateInState } from '@/lib/services/domain-service';
import { listSuppliers } from '@/lib/services/purchases-service';
export {
  formatDueMoney,
  formatDueDate,
  getPartyInitials,
} from '@/lib/services/due-management-service';

export type SupplierPayableStatus =
  | 'overdue'
  | 'due_soon'
  | 'due_today'
  | 'upcoming'
  | 'paid'
  | 'active';

export type SupplierPayableBill = {
  entryId: string;
  billId: string;
  poRef?: string;
  billDate: string;
  dueDate: string;
  amount: number;
  paid: number;
  due: number;
  status: string;
};

export type SupplierPayable = {
  id: string;
  supplierId: string;
  name: string;
  phone: string;
  location: string;
  totalDue: number;
  dueDate: string;
  agingDays: number;
  agingLabel: string;
  status: SupplierPayableStatus;
  lastPaymentAmount: number;
  lastPaymentDate: string;
  creditLimit: number;
  availableCredit: number;
  totalPurchase: number;
  supplierSince: string;
  preferredMethod: string;
  nextPaymentDue?: string;
  unpaidBillCount: number;
  bills: SupplierPayableBill[];
};

export type SupplierPayableFilters = {
  search?: string;
  status?: string;
};

type Row = Record<string, unknown>;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysToIso(date: string, days: number) {
  const base = new Date(`${date}T00:00:00`);
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

function weekEndIso() {
  return addDaysToIso(todayIso(), 7);
}

function normalizeBillRow(row: Row): SupplierPayableBill {
  const amount = Number(row.total ?? 0);
  const paid = Number(row.paid ?? 0);
  const due = Number(row.due ?? Math.max(0, amount - paid));
  const dueDate = String(row.dueDate ?? '');
  const today = todayIso();
  let status = 'upcoming';
  if (due <= 0) status = 'paid';
  else if (dueDate && dueDate < today) status = 'overdue';
  else if (dueDate === today) status = 'due_today';
  else if (dueDate && dueDate <= weekEndIso()) status = 'due_soon';

  return {
    entryId: String(row.id ?? ''),
    billId: String(row.invoiceId ?? ''),
    poRef: row.poRef ? String(row.poRef) : undefined,
    billDate: String(row.invoiceDate ?? ''),
    dueDate,
    amount,
    paid,
    due,
    status,
  };
}

function billStatusPriority(status: string) {
  if (status === 'overdue') return 5;
  if (status === 'due_today') return 4;
  if (status === 'due_soon') return 3;
  if (status === 'upcoming') return 2;
  if (status === 'paid') return 0;
  return 1;
}

function computeSupplierStatus(
  openBills: SupplierPayableBill[],
  totalDue: number,
): { agingDays: number; agingLabel: string; status: SupplierPayableStatus } {
  if (totalDue <= 0 || !openBills.length) {
    return { agingDays: 0, agingLabel: 'Paid', status: 'paid' };
  }

  const sorted = [...openBills].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const primary = sorted.reduce(
    (best, bill) => (billStatusPriority(bill.status) > billStatusPriority(best.status) ? bill : best),
    sorted[0],
  );
  const dueDate = primary.dueDate;
  const today = todayIso();
  const diff = Math.floor((new Date(today).getTime() - new Date(dueDate).getTime()) / 86400000);

  if (primary.status === 'overdue') {
    return { agingDays: Math.max(1, diff), agingLabel: `${Math.max(1, diff)} days Overdue`, status: 'overdue' };
  }
  if (primary.status === 'due_today') {
    return { agingDays: 0, agingLabel: 'Due Today', status: 'due_today' };
  }
  if (primary.status === 'due_soon') {
    const daysUntil = Math.abs(diff);
    return { agingDays: daysUntil, agingLabel: `${daysUntil} days Due Soon`, status: 'due_soon' };
  }
  const daysUntil = Math.max(0, Math.floor((new Date(dueDate).getTime() - new Date(today).getTime()) / 86400000));
  return {
    agingDays: daysUntil,
    agingLabel: daysUntil > 0 ? `${daysUntil} days Upcoming` : 'Upcoming',
    status: 'upcoming',
  };
}

function vendorBillToPayableRow(row: Row): Row {
  const total = Number(row.amount ?? row.total ?? 0);
  const paid = Number(row.paid ?? 0);
  const due = Number(row.due ?? Math.max(0, total - paid));
  return {
    ...row,
    type: 'supplier',
    partyId: String(row.supplierId ?? row.partyId ?? ''),
    partyName: String(row.supplierName ?? row.supplier ?? row.partyName ?? ''),
    total,
    paid,
    due,
    invoiceId: String(row.invoiceId ?? row.id ?? ''),
    invoiceDate: String(row.invoiceDate ?? row.date ?? ''),
  };
}

function listSupplierBillRows(state: AppState) {
  const vendorBills = listFromState(state, 'vendorBills');
  if (vendorBills.length > 0) {
    return vendorBills.map((row) => vendorBillToPayableRow(row as Row));
  }
  return listFromState(state, 'dueEntries').filter((row) => row.type === 'supplier');
}

function billStorageKey(state: AppState, entryId: string): 'vendorBills' | 'dueEntries' {
  const inVendorBills = listFromState(state, 'vendorBills').some((row) => String(row.id) === entryId);
  return inVendorBills ? 'vendorBills' : 'dueEntries';
}

function matchSupplierBills(state: AppState, supplier: Row): SupplierPayableBill[] {
  const supplierId = String(supplier.id ?? '');
  const supplierName = String(supplier.name ?? '');
  return listSupplierBillRows(state)
    .filter((row) =>
      String(row.partyId) === supplierId
      || String(row.partyName) === supplierName
      || String(row.supplierId) === supplierId
      || String(row.supplier) === supplierName)
    .map((row) => normalizeBillRow(row as Row));
}

function getSupplierPayments(state: AppState, supplierId: string) {
  return listFromState(state, 'purchasePayments')
    .filter((payment) => String(payment.supplierId) === supplierId)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function getPaidThisMonth(state: AppState) {
  const monthStart = new Date();
  monthStart.setDate(1);
  const start = monthStart.toISOString().slice(0, 10);
  const payments = listFromState(state, 'purchasePayments').filter(
    (payment) => String(payment.date ?? '') >= start,
  );
  return {
    total: payments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0),
    paymentCount: payments.length,
  };
}

function buildSupplierPayable(state: AppState, supplier: Row): SupplierPayable {
  const supplierId = String(supplier.id ?? '');
  const bills = matchSupplierBills(state, supplier);
  const openBills = bills.filter((bill) => bill.due > 0);
  const totalDue = openBills.reduce((sum, bill) => sum + bill.due, 0);
  const sortedOpen = [...openBills].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const dueDate = sortedOpen[0]?.dueDate ?? '';
  const aging = computeSupplierStatus(openBills, totalDue);
  const lastPayment = getSupplierPayments(state, supplierId)[0];
  const totalPurchase = bills.reduce((sum, bill) => sum + bill.amount, 0);
  const creditLimit = Number(supplier.creditLimit ?? 0);

  return {
    id: supplierId,
    supplierId,
    name: String(supplier.name ?? ''),
    phone: String(supplier.phone ?? '—'),
    location: String(supplier.address ?? supplier.location ?? '—'),
    totalDue,
    dueDate,
    agingDays: aging.agingDays,
    agingLabel: aging.agingLabel,
    status: aging.status,
    lastPaymentAmount: Number(lastPayment?.amount ?? 0),
    lastPaymentDate: String(lastPayment?.date ?? ''),
    creditLimit,
    availableCredit: Math.max(0, creditLimit - totalDue),
    totalPurchase,
    supplierSince: String(supplier.createdAt ?? '2024-01-01').slice(0, 10),
    preferredMethod: String(supplier.paymentTerms ?? 'Bank Transfer'),
    nextPaymentDue: dueDate || undefined,
    unpaidBillCount: openBills.length,
    bills,
  };
}

export function listSupplierPayables(state: AppState): SupplierPayable[] {
  return sortRowsNewestFirst(listSuppliers(state).map((supplier) => buildSupplierPayable(state, supplier as Row)));
}

export function getSupplierPayableMetrics(state: AppState) {
  const suppliers = listSupplierPayables(state);
  const withDue = suppliers.filter((supplier) => supplier.totalDue > 0);
  const overdueSuppliers = suppliers.filter((supplier) => supplier.status === 'overdue' && supplier.totalDue > 0);
  const dueSoonSuppliers = suppliers.filter(
    (supplier) => (supplier.status === 'due_soon' || supplier.status === 'due_today') && supplier.totalDue > 0,
  );
  const paid = getPaidThisMonth(state);

  return {
    totalPayable: withDue.reduce((sum, supplier) => sum + supplier.totalDue, 0),
    supplierCount: suppliers.length,
    overdueAmount: overdueSuppliers.reduce((sum, supplier) => sum + supplier.totalDue, 0),
    overdueSupplierCount: overdueSuppliers.length,
    dueThisWeek: dueSoonSuppliers.reduce((sum, supplier) => sum + supplier.totalDue, 0),
    dueThisWeekCount: dueSoonSuppliers.length,
    paidThisMonth: paid.total,
    paymentCount: paid.paymentCount,
  };
}

export type SupplierPayableMetrics = ReturnType<typeof getSupplierPayableMetrics>;

export function filterSupplierPayables(
  entries: SupplierPayable[],
  filters: SupplierPayableFilters,
): SupplierPayable[] {
  return entries.filter((entry) => {
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'overdue' && entry.status !== 'overdue') return false;
      if (filters.status === 'due_soon' && entry.status !== 'due_soon' && entry.status !== 'due_today') return false;
      if (filters.status === 'paid' && entry.status !== 'paid') return false;
      if (filters.status === 'all_due' && entry.totalDue <= 0) return false;
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const billIds = entry.bills.map((bill) => `${bill.billId} ${bill.poRef ?? ''}`).join(' ');
      const hay = `${entry.name} ${entry.phone} ${entry.location} ${billIds}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function getSupplierPayableDetail(state: AppState, supplierId: string): SupplierPayable | null {
  return listSupplierPayables(state).find(
    (supplier) => supplier.supplierId === supplierId || supplier.id === supplierId,
  ) ?? null;
}

export function makeSupplierPayment(
  state: AppState,
  supplierId: string,
  amount: number,
  paymentDate?: string,
  method?: string,
  billIds?: string[],
): { ok: boolean; error?: string } {
  const rows = listSupplierBillRows(state);
  const supplier = listSuppliers(state).find((s) => String(s.id) === supplierId);
  if (!supplier) return { ok: false, error: 'Supplier not found' };

  let openRows = rows.filter((row) => {
    const matchesSupplier =
      String(row.partyId) === supplierId || String(row.partyName) === String(supplier.name);
    return matchesSupplier && Number(row.due ?? 0) > 0;
  });

  if (billIds?.length) {
    openRows = openRows.filter((row) => billIds.includes(String(row.id)) || billIds.includes(String(row.invoiceId)));
  }

  openRows.sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
  if (!openRows.length) return { ok: false, error: 'No open bills for this supplier' };

  let remaining = amount;
  const date = paymentDate ?? todayIso();
  const payMethod = method || 'Bank Transfer';

  for (const row of openRows) {
    if (remaining <= 0) break;
    const entryId = String(row.id);
    const total = Number(row.total ?? 0);
    const currentDue = Number(row.due ?? 0);
    const pay = Math.min(remaining, currentDue);
    const paid = Number(row.paid ?? 0) + pay;
    const due = Math.max(0, total - paid);

    updateInState(state, billStorageKey(state, entryId), entryId, {
      ...row,
      amount: total,
      total,
      paid,
      due,
      status: due <= 0 ? 'paid' : 'posted',
    });

    createInState(state, 'purchasePayments', {
      supplierId,
      supplierName: String(supplier.name ?? ''),
      billId: String(row.invoiceId ?? ''),
      dueEntryId: entryId,
      date,
      amount: pay,
      method: payMethod,
      reference: '',
      status: 'paid',
    }, 'PP');

    remaining -= pay;
  }

  const allOpenDue = listSupplierBillRows(state)
    .filter((row) => String(row.partyId) === supplierId || String(row.partyName) === String(supplier.name))
    .reduce((sum, row) => sum + Number(row.due ?? 0), 0);

  updateInState(state, 'purchasesSuppliers', supplierId, {
    ...supplier,
    due: allOpenDue,
    balance: allOpenDue,
  });

  return { ok: true };
}

export function createSupplierPayable(
  state: AppState,
  payload: Row,
): { ok: true; id: string } | { ok: false; error: string } {
  const supplierId = String(payload.supplier ?? payload.supplierId ?? '').trim();
  const amount = Number(payload.amount ?? 0);
  const dueDate = String(payload.dueDate ?? todayIso());
  if (!supplierId || amount <= 0) return { ok: false, error: 'Supplier and amount are required' };

  const supplier = listSuppliers(state).find((s) => String(s.id) === supplierId);
  if (!supplier) return { ok: false, error: 'Supplier not found' };

  const today = todayIso();
  const billId = `BILL-${String(Date.now()).slice(-6)}`;
  const result = createInState(state, 'vendorBills', {
    supplierId,
    supplier: String(supplier.name ?? ''),
    supplierName: String(supplier.name ?? ''),
    invoiceId: billId,
    invoiceDate: today,
    date: today,
    amount,
    total: amount,
    paid: 0,
    due: amount,
    dueDate,
    status: 'posted',
    notes: String(payload.notes ?? ''),
  }, 'BILL');

  if (!result.ok) return result;

  const currentDue = Number(supplier.due ?? supplier.balance ?? 0);
  updateInState(state, 'purchasesSuppliers', supplierId, {
    ...supplier,
    due: currentDue + amount,
    balance: currentDue + amount,
  });

  return { ok: true, id: supplierId };
}

export function getSupplierStatusLabel(status: SupplierPayableStatus) {
  if (status === 'overdue') return 'Overdue';
  if (status === 'due_today') return 'Due Today';
  if (status === 'due_soon') return 'Due Soon';
  if (status === 'upcoming') return 'Upcoming';
  if (status === 'paid') return 'Paid';
  return 'Active';
}

export function formatRelativeDueDate(dueDate: string) {
  if (!dueDate) return '';
  const today = todayIso();
  const diff = Math.floor((new Date(today).getTime() - new Date(dueDate).getTime()) / 86400000);
  if (diff > 0) return `${diff} day${diff === 1 ? '' : 's'} ago`;
  if (diff < 0) return `in ${Math.abs(diff)} day${Math.abs(diff) === 1 ? '' : 's'}`;
  return 'Today';
}
