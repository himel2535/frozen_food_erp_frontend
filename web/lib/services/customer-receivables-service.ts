import type { AppState } from '@/lib/state/types';
import {
  createPaymentRecord,
  ensureCrmState,
  getCustomerFinancialSummary,
  getCustomerList,
  syncInvoiceBalances,
} from '@/lib/services/crm-service';
export {
  formatDueMoney,
  formatDueDate,
  getPartyInitials,
} from '@/lib/services/due-management-service';

export type CustomerReceivableStatus = 'overdue' | 'due_soon' | 'paid' | 'active';

export type CustomerReceivableInvoice = {
  invoiceId: string;
  amount: number;
  paid: number;
  due: number;
  dueDate: string;
  status: string;
};

export type CustomerReceivable = {
  id: string;
  customerId: string;
  name: string;
  company: string;
  phone: string;
  email?: string;
  totalDue: number;
  dueDate: string;
  agingDays: number;
  agingLabel: string;
  status: CustomerReceivableStatus;
  lastPaymentAmount: number;
  lastPaymentDate: string;
  creditLimit: number;
  availableCredit: number;
  customerSince: string;
  nextFollowUp?: string;
  invoices: CustomerReceivableInvoice[];
};

export type CustomerReceivableFilters = {
  search?: string;
  status?: string;
};

type Row = Record<string, unknown>;
type CrmCustomer = ReturnType<typeof getCustomerList>[number];

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

function mapInvoiceToReceivable(invoice: Record<string, unknown>): CustomerReceivableInvoice {
  const amount = Number(invoice.total ?? invoice.amount ?? 0);
  const paid = Number(invoice.paidAmount ?? invoice.paid ?? 0);
  const due = Number(invoice.dueAmount ?? invoice.due ?? Math.max(0, amount - paid));
  const dueDate = String(invoice.dueDate ?? '');
  const today = todayIso();
  let status = 'active';
  if (due <= 0) status = 'paid';
  else if (dueDate && dueDate < today) status = 'overdue';
  else if (dueDate && dueDate <= weekEndIso()) status = 'due_soon';

  return {
    invoiceId: String(invoice.id ?? ''),
    amount,
    paid,
    due,
    dueDate,
    status,
  };
}

function computeAging(
  dueDate: string,
  totalDue: number,
): { agingDays: number; agingLabel: string; status: CustomerReceivableStatus } {
  if (totalDue <= 0) return { agingDays: 0, agingLabel: 'Paid', status: 'paid' };
  if (!dueDate) return { agingDays: 0, agingLabel: 'Active', status: 'active' };

  const today = todayIso();
  const diff = Math.floor((new Date(today).getTime() - new Date(dueDate).getTime()) / 86400000);
  if (diff > 0) return { agingDays: diff, agingLabel: `${diff} days Overdue`, status: 'overdue' };
  if (dueDate <= weekEndIso()) {
    const daysUntil = Math.abs(diff);
    return { agingDays: daysUntil, agingLabel: `${daysUntil} days Due Soon`, status: 'due_soon' };
  }
  return { agingDays: 0, agingLabel: 'Active', status: 'active' };
}

function getCustomerPayments(state: AppState, customerId: string) {
  ensureCrmState(state);
  return Object.values(state.crmData?.paymentsById ?? {})
    .filter((payment) => payment.customerId === customerId)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function getCollectedThisMonth(state: AppState) {
  ensureCrmState(state);
  const monthStart = new Date();
  monthStart.setDate(1);
  const start = monthStart.toISOString().slice(0, 10);
  const payments = Object.values(state.crmData?.paymentsById ?? {}).filter(
    (payment) => String(payment.date ?? '') >= start,
  );
  return {
    total: payments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0),
    paymentCount: payments.length,
  };
}

function buildCustomerReceivable(state: AppState, customer: CrmCustomer): CustomerReceivable {
  const summary = getCustomerFinancialSummary(state, customer.id);
  const invoiceRows = (state.invoices ?? [])
    .filter((invoice) => invoice.customerId === customer.id && invoice.status !== 'cancelled')
    .map((invoice) => mapInvoiceToReceivable(invoice as Record<string, unknown>));

  const openInvoices = invoiceRows.filter((invoice) => invoice.due > 0);
  const oldestDue = [...openInvoices].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  const dueDate = oldestDue?.dueDate ?? '';
  const totalDue = Number(summary.totalDue ?? 0);
  const aging = computeAging(dueDate, totalDue);
  const lastPayment = getCustomerPayments(state, customer.id)[0];

  return {
    id: customer.id,
    customerId: customer.id,
    name: String(customer.name ?? ''),
    company: String(customer.company ?? ''),
    phone: String(customer.phone ?? ''),
    email: customer.email ? String(customer.email) : undefined,
    totalDue,
    dueDate,
    agingDays: aging.agingDays,
    agingLabel: aging.agingLabel,
    status: aging.status,
    lastPaymentAmount: Number(lastPayment?.amount ?? 0),
    lastPaymentDate: String(lastPayment?.date ?? summary.lastPaymentDate ?? ''),
    creditLimit: Number(summary.creditLimit ?? customer.creditLimit ?? 0),
    availableCredit: Math.max(0, Number(summary.creditLimit ?? customer.creditLimit ?? 0) - totalDue),
    customerSince: String(customer.createdAt ?? '').slice(0, 10) || '—',
    nextFollowUp: customer.nextFollowUpAt ? String(customer.nextFollowUpAt) : undefined,
    invoices: invoiceRows,
  };
}

export function listCustomerReceivables(state: AppState): CustomerReceivable[] {
  ensureCrmState(state);
  syncInvoiceBalances(state);
  return getCustomerList(state).map((customer) => buildCustomerReceivable(state, customer));
}

export function getCustomerReceivableMetrics(state: AppState) {
  const customers = listCustomerReceivables(state);
  const withDue = customers.filter((customer) => customer.totalDue > 0);
  const overdueCustomers = customers.filter((customer) => customer.status === 'overdue' && customer.totalDue > 0);
  const dueSoonCustomers = customers.filter((customer) => customer.status === 'due_soon' && customer.totalDue > 0);
  const collected = getCollectedThisMonth(state);

  return {
    totalReceivable: withDue.reduce((sum, customer) => sum + customer.totalDue, 0),
    customerCount: customers.length,
    overdueAmount: overdueCustomers.reduce((sum, customer) => sum + customer.totalDue, 0),
    overdueCustomerCount: overdueCustomers.length,
    dueThisWeek: dueSoonCustomers.reduce((sum, customer) => sum + customer.totalDue, 0),
    dueThisWeekCount: dueSoonCustomers.length,
    collectedThisMonth: collected.total,
    paymentCount: collected.paymentCount,
  };
}

export type CustomerReceivableMetrics = ReturnType<typeof getCustomerReceivableMetrics>;

export function filterCustomerReceivables(
  entries: CustomerReceivable[],
  filters: CustomerReceivableFilters,
): CustomerReceivable[] {
  return entries.filter((entry) => {
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'overdue' && entry.status !== 'overdue') return false;
      if (filters.status === 'due_soon' && entry.status !== 'due_soon') return false;
      if (filters.status === 'paid' && entry.status !== 'paid') return false;
      if (filters.status === 'all_due' && entry.totalDue <= 0) return false;
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const invoiceIds = entry.invoices.map((invoice) => invoice.invoiceId).join(' ');
      const hay = `${entry.name} ${entry.company} ${entry.phone} ${invoiceIds}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function getCustomerReceivableDetail(state: AppState, customerId: string): CustomerReceivable | null {
  return listCustomerReceivables(state).find(
    (customer) => customer.customerId === customerId || customer.id === customerId,
  ) ?? null;
}

export function receiveCustomerPayment(
  state: AppState,
  customerId: string,
  amount: number,
  paymentDate?: string,
  method?: string,
): { ok: boolean; error?: string } {
  ensureCrmState(state);
  syncInvoiceBalances(state);

  const openInvoices = (state.invoices ?? [])
    .filter((invoice) => invoice.customerId === customerId && Number(invoice.dueAmount ?? invoice.due ?? 0) > 0)
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));

  if (!openInvoices.length) return { ok: false, error: 'No open invoices for this customer' };

  let remaining = amount;
  const date = paymentDate ?? todayIso();

  for (const invoice of openInvoices) {
    if (remaining <= 0) break;
    const due = Number(invoice.dueAmount ?? invoice.due ?? 0);
    const pay = Math.min(remaining, due);
    createPaymentRecord(state, {
      customerId,
      invoiceId: String(invoice.id),
      amount: pay,
      date,
      method: method || 'Cash',
    });
    remaining -= pay;
  }

  syncInvoiceBalances(state);
  return { ok: true };
}

export function createCustomerDue(
  state: AppState,
  payload: Row,
): { ok: true; id: string } | { ok: false; error: string } {
  ensureCrmState(state);
  syncInvoiceBalances(state);

  const customerId = String(payload.customer ?? payload.customerId ?? '').trim();
  const amount = Number(payload.amount ?? 0);
  const dueDate = String(payload.dueDate ?? todayIso());
  if (!customerId || amount <= 0) return { ok: false, error: 'Customer and amount are required' };

  const customer = (state.crmData?.customersById as Record<string, Record<string, unknown>> | undefined)?.[customerId];
  if (!customer) return { ok: false, error: 'Customer not found' };

  const issueDate = todayIso();
  const nextSequence = (state.invoices?.length ?? 0) + 1;
  const invoiceId = `INV-2026-${String(10000 + nextSequence).slice(1)}`;

  if (!state.invoices) state.invoices = [];
  state.invoices.push({
    id: invoiceId,
    customerId,
    issueDate,
    date: issueDate,
    dueDate,
    items: [{ name: String(payload.notes || 'Opening due balance'), quantity: 1, price: amount, total: amount }],
    subtotal: amount,
    discountAmount: 0,
    taxAmount: 0,
    total: amount,
    amount,
    currency: String(customer.defaultCurrency ?? 'USD'),
    terms: String(customer.paymentTerms ?? 'Net 30'),
    approvalStatus: 'approved',
    postedAt: issueDate,
    sentAt: issueDate,
    status: 'sent',
    notes: String(payload.notes ?? ''),
  });

  syncInvoiceBalances(state);
  return { ok: true, id: customerId };
}

export function getCustomerStatusLabel(status: CustomerReceivableStatus) {
  if (status === 'overdue') return 'Overdue';
  if (status === 'due_soon') return 'Due Soon';
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
