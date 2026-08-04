import type { AppState } from '@/lib/state/types';
import {
  createPaymentRecord,
  ensureCrmState,
  getCustomerAssignments,
  getCustomerFinancialSummary,
  getCustomerList,
  getCustomerProfile,
  syncInvoiceBalances,
} from '@/lib/services/crm-service';
import {
  COLLECTION_DEMO_KPI,
  COLLECTION_DEMO_PAYMENTS_TODAY,
  COLLECTION_OVERLAY_BY_COMPANY,
  getCollectionOverlay,
  hasCollectionDemoData,
  isCollectionDemoCompany,
  type CollectionActivity,
  type CollectionActivityType,
  type CollectionAssignedStaff,
  type CollectionNextAction,
  type CollectionPaymentPromise,
  type CollectionStatus,
} from '@/lib/state/customer-collection-seed';
import { formatActionSchedule } from '@/lib/utils/communication-utils';
export {
  formatDueMoney,
  formatDueDate,
  getPartyInitials,
} from '@/lib/services/due-management-service';

export type { CollectionStatus, CollectionNextAction, CollectionAssignedStaff, CollectionPaymentPromise, CollectionActivity, CollectionActivityType };

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
  collectionStatus: CollectionStatus;
  collectionStatusLabel: string;
  nextAction?: CollectionNextAction;
  assignedTo?: CollectionAssignedStaff;
  paymentPromise?: CollectionPaymentPromise;
  recentActivity: CollectionActivity[];
  isMyTask?: boolean;
  isToday?: boolean;
  isPromised?: boolean;
  isMissed?: boolean;
  isCriticalOverdue?: boolean;
  location?: string;
  tabCounts?: { notes?: number; documents?: number };
};

export type CustomerReceivableFilters = {
  search?: string;
  status?: string;
  assignedStaffId?: string;
};

type Row = Record<string, unknown>;
type CrmCustomer = ReturnType<typeof getCustomerList>[number];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function isValidIsoDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return false;
  const year = parsed.getFullYear();
  return year >= 2000 && year <= 2100;
}

function resolvePromiseDueDate(expectedPaymentDate?: string) {
  return isValidIsoDate(expectedPaymentDate) ? expectedPaymentDate! : todayIso();
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
  if (diff > 0) return { agingDays: diff, agingLabel: `${diff} Days Overdue`, status: 'overdue' };
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

function getCollectedToday(state: AppState) {
  ensureCrmState(state);
  const today = todayIso();
  const livePayments = Object.values(state.crmData?.paymentsById ?? {}).filter(
    (payment) => String(payment.date ?? '') === today,
  );
  const liveTotal = livePayments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const demoTotal = COLLECTION_DEMO_PAYMENTS_TODAY.reduce((sum, payment) => sum + payment.amount, 0);
  const demoCount = COLLECTION_DEMO_PAYMENTS_TODAY.length;
  return {
    total: liveTotal > 0 ? liveTotal : demoTotal,
    paymentCount: livePayments.length > 0 ? livePayments.length : demoCount,
  };
}

function statusLabelForReceivable(status: CustomerReceivableStatus) {
  if (status === 'overdue') return 'Overdue';
  if (status === 'due_soon') return 'Due Soon';
  if (status === 'paid') return 'Paid';
  return 'Active';
}

function mapCrmActivityToCollection(activity: Record<string, unknown>): CollectionActivity {
  const activityType = String(activity.activityType ?? activity.type ?? 'note').toLowerCase();
  let type: CollectionActivityType = 'note';
  if (/call|phone/.test(activityType)) type = 'call';
  else if (/whatsapp|message/.test(activityType)) type = 'whatsapp';
  else if (/promise|payment/.test(activityType)) type = 'promise';

  return {
    id: String(activity.id ?? `crm-${Date.now()}`),
    type,
    text: String(activity.summary ?? activity.note ?? activity.text ?? 'Activity logged'),
    at: String(activity.completedAt ?? activity.createdAt ?? new Date().toISOString()),
    by: String(activity.actorName ?? activity.by ?? 'System'),
  };
}

function getRuntimeTimelineExtras(state: AppState, customerId: string): CollectionActivity[] {
  const extras = (state as Record<string, unknown>).collectionTimelineExtras as Record<string, CollectionActivity[]> | undefined;
  return extras?.[customerId] ?? [];
}

function enrichActivityFromBasic(activity: CollectionActivity): CollectionActivity {
  if (activity.title) return activity;
  const titleByType: Record<CollectionActivityType, string> = {
    call: 'Call Logged',
    whatsapp: 'WhatsApp Message',
    promise: 'Payment Promise',
    note: 'Note Added',
  };
  return {
    ...activity,
    title: titleByType[activity.type] ?? 'Activity',
    statusTone: activity.type === 'call' ? 'sky' : activity.type === 'whatsapp' ? 'emerald' : activity.type === 'promise' ? 'purple' : 'amber',
  };
}

export function getFollowUpTimeline(state: AppState, customerId: string): CollectionActivity[] {
  const receivable = getCustomerReceivableDetail(state, customerId);
  if (!receivable) return [];

  const overlay = getCollectionOverlay(receivable.company);
  const seedTimeline = overlay?.followUpTimeline ?? overlay?.recentActivity ?? receivable.recentActivity;
  const runtime = getRuntimeTimelineExtras(state, customerId);
  const merged = [...runtime, ...seedTimeline.map(enrichActivityFromBasic)];

  const seen = new Set<string>();
  const unique = merged.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  return unique.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

export type ScheduleFollowUpPayload = {
  contactMethod: 'call' | 'whatsapp' | 'email' | 'sms' | 'meeting';
  contactPerson?: string;
  contactAt: string;
  assignedStaffName: string;
  outcome: string;
  notes?: string;
  scheduleNext: boolean;
  nextScheduledAt?: string;
  nextAssignedTo?: string;
  reminder?: string;
  nextNote?: string;
  promiseAmount?: number;
  expectedPaymentDate?: string;
  attachmentName?: string;
};

type FollowUpRuntimeMeta = {
  nextAction?: CollectionNextAction;
  paymentPromise?: CollectionPaymentPromise;
  assignedTo?: CollectionAssignedStaff;
};

function getFollowUpRuntimeMeta(state: AppState, customerId: string): FollowUpRuntimeMeta | undefined {
  const all = (state as Record<string, unknown>).collectionFollowUpMetaByCustomerId as Record<string, FollowUpRuntimeMeta> | undefined;
  return all?.[customerId];
}

function setFollowUpRuntimeMeta(state: AppState, customerId: string, meta: FollowUpRuntimeMeta) {
  const store = state as Record<string, unknown>;
  const all = (store.collectionFollowUpMetaByCustomerId as Record<string, FollowUpRuntimeMeta> | undefined) ?? {};
  store.collectionFollowUpMetaByCustomerId = { ...all, [customerId]: { ...all[customerId], ...meta } };
}

function outcomeToActivity(outcome: string, contactMethod: ScheduleFollowUpPayload['contactMethod']) {
  const map: Record<string, { title: string; statusLabel: string; statusTone: CollectionActivity['statusTone']; type: CollectionActivityType }> = {
    connected: { title: 'Call Connected', statusLabel: 'Connected', statusTone: 'emerald', type: 'call' },
    no_answer: { title: 'Call Attempted', statusLabel: 'No Answer', statusTone: 'rose', type: 'call' },
    busy: { title: 'Call Attempted', statusLabel: 'Busy', statusTone: 'amber', type: 'call' },
    call_later: { title: 'Call Attempted', statusLabel: 'Call Later', statusTone: 'sky', type: 'call' },
    payment_promised: { title: 'Payment Promise', statusLabel: 'Promise Made', statusTone: 'purple', type: 'promise' },
    payment_sent: { title: 'Payment Received', statusLabel: 'Payment Sent', statusTone: 'emerald', type: 'promise' },
    dispute: { title: 'Dispute Raised', statusLabel: 'Dispute', statusTone: 'rose', type: 'note' },
    wrong_number: { title: 'Call Attempted', statusLabel: 'Wrong Number', statusTone: 'rose', type: 'call' },
  };
  const base = map[outcome] ?? { title: 'Follow-up Logged', statusLabel: 'Logged', statusTone: 'sky' as const, type: 'note' as CollectionActivityType };
  if (contactMethod === 'whatsapp') return { ...base, title: base.title.replace('Call', 'WhatsApp'), type: 'whatsapp' as CollectionActivityType };
  if (contactMethod === 'email' || contactMethod === 'sms') return { ...base, title: 'Message Sent', type: 'note' as CollectionActivityType };
  if (contactMethod === 'meeting') return { ...base, title: 'Meeting Held', type: 'note' as CollectionActivityType };
  return base;
}

function contactMethodToNextActionType(method: ScheduleFollowUpPayload['contactMethod']): CollectionNextAction['type'] {
  if (method === 'whatsapp') return 'whatsapp';
  if (method === 'meeting') return 'follow_up';
  return 'call';
}

export function scheduleCustomerFollowUp(
  state: AppState,
  customerId: string,
  payload: ScheduleFollowUpPayload,
): { ok: boolean; error?: string } {
  const receivable = getCustomerReceivableDetail(state, customerId);
  if (!receivable) return { ok: false, error: 'Customer not found' };

  const mapped = outcomeToActivity(payload.outcome, payload.contactMethod);
  const noteText = payload.notes?.trim()
    || (payload.contactPerson ? `Contact: ${payload.contactPerson}` : 'Follow-up recorded from Customer Due.');

  const activity: CollectionActivity = {
    id: `act-runtime-${Date.now()}`,
    type: mapped.type,
    title: mapped.title,
    text: noteText,
    at: payload.contactAt,
    by: payload.assignedStaffName.trim() || receivable.assignedTo?.name || 'Staff',
    statusLabel: mapped.statusLabel,
    statusTone: mapped.statusTone,
    ...(payload.scheduleNext && payload.nextScheduledAt
      ? { sideMeta: `Next Follow-up: ${formatActionSchedule(payload.nextScheduledAt)}` }
      : {}),
    ...(payload.outcome === 'payment_promised' && payload.promiseAmount
      ? { sideHint: 'Waiting for Payment' }
      : {}),
  };

  const store = state as Record<string, unknown>;
  const extras = (store.collectionTimelineExtras as Record<string, CollectionActivity[]> | undefined) ?? {};
  const list = extras[customerId] ?? [];
  store.collectionTimelineExtras = { ...extras, [customerId]: [activity, ...list] };

  const runtimeMeta: FollowUpRuntimeMeta = {
    assignedTo: staffFromName(payload.assignedStaffName),
  };

  if (payload.scheduleNext && payload.nextScheduledAt) {
    runtimeMeta.nextAction = {
      type: contactMethodToNextActionType(payload.contactMethod),
      label: payload.contactMethod === 'call' ? 'Call Customer' : payload.contactMethod === 'whatsapp' ? 'WhatsApp Customer' : 'Follow Up',
      scheduledAt: payload.nextScheduledAt,
      reason: payload.nextNote || payload.notes,
    };
  }

  if (payload.promiseAmount && payload.promiseAmount > 0) {
    runtimeMeta.paymentPromise = {
      amount: payload.promiseAmount,
      dueDate: resolvePromiseDueDate(payload.expectedPaymentDate),
      status: payload.outcome === 'payment_sent' ? 'received' : 'waiting',
    };
  }

  setFollowUpRuntimeMeta(state, customerId, runtimeMeta);

  const overlayKey = receivable.company;
  if (overlayKey && getCollectionOverlay(overlayKey)) {
    const existing = getCollectionOverlay(overlayKey)!;
    COLLECTION_OVERLAY_BY_COMPANY[overlayKey] = {
      ...existing,
      assignedTo: runtimeMeta.assignedTo ?? existing.assignedTo,
      nextAction: runtimeMeta.nextAction ?? existing.nextAction,
      paymentPromise: runtimeMeta.paymentPromise ?? existing.paymentPromise,
      recentActivity: [activity, ...existing.recentActivity].slice(0, 8),
      followUpTimeline: [activity, ...(existing.followUpTimeline ?? existing.recentActivity)].slice(0, 12),
    };
  }

  return { ok: true };
}

export function getCustomerReceivablePayments(state: AppState, customerId: string) {
  return getCustomerPayments(state, customerId);
}

function resolveRecentActivity(state: AppState, receivable: CustomerReceivableCore, seedActivity: CollectionActivity[]): CollectionActivity[] {
  const profile = getCustomerProfile(state, receivable.customerId);
  const crmActivities = (profile?.activities ?? []).map((a) => mapCrmActivityToCollection(a as Record<string, unknown>));
  if (crmActivities.length > 0) return crmActivities.slice(0, 8);
  return seedActivity;
}

function todayAtIso(hour: number, minute = 0) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function staffFromName(name: string, id?: string): CollectionAssignedStaff {
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const shortName = parts[0] ?? trimmed;
  const initials = parts.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?';
  return {
    id: id || `staff-${shortName.toLowerCase()}`,
    name: trimmed,
    shortName,
    initials,
  };
}

function buildFallbackCollectionFields(
  state: AppState,
  receivable: CustomerReceivableCore,
): Pick<CustomerReceivable, 'nextAction' | 'assignedTo' | 'collectionStatusLabel' | 'isToday' | 'isMyTask'> {
  ensureCrmState(state);

  const assignment = getCustomerAssignments(state, receivable.customerId) as {
    ownerName?: string;
    ownerId?: string;
  } | null;
  const crmCustomer = (state.crmData?.customersById as Record<string, Record<string, unknown>> | undefined)?.[receivable.customerId];
  const ownerName = String(assignment?.ownerName ?? crmCustomer?.ownerName ?? crmCustomer?.salesRepName ?? '').trim();
  const ownerId = String(assignment?.ownerId ?? crmCustomer?.ownerId ?? crmCustomer?.salesRepId ?? '').trim();

  let assignedTo: CollectionAssignedStaff | undefined;
  if (ownerName) {
    assignedTo = staffFromName(ownerName, ownerId || undefined);
  } else {
    const salesRep = (state.employees ?? []).find((e) => e.department === 'Sales') ?? (state.employees ?? [])[0];
    if (salesRep?.name) assignedTo = staffFromName(String(salesRep.name), String(salesRep.id));
  }

  const openTasks = Object.values(state.crmData?.tasksById ?? {})
    .filter((task) => task.entityType === 'customer' && task.entityId === receivable.customerId && task.status !== 'done')
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
  const nextTask = openTasks[0];

  let nextAction: CollectionNextAction | undefined;
  if (nextTask) {
    const taskTitle = String(nextTask.title ?? 'Follow Up');
    const dueDate = String(nextTask.dueDate ?? todayIso());
    const scheduledAt = dueDate.includes('T') ? dueDate : `${dueDate}T10:00:00.000Z`;
    const lower = taskTitle.toLowerCase();
    const type: CollectionNextAction['type'] = /whatsapp|message/.test(lower)
      ? 'whatsapp'
      : /call|phone/.test(lower)
        ? 'call'
        : 'follow_up';
    nextAction = { type, label: taskTitle, scheduledAt };
  } else if (receivable.nextFollowUp) {
    const scheduledAt = receivable.nextFollowUp.includes('T')
      ? receivable.nextFollowUp
      : `${receivable.nextFollowUp}T14:00:00.000Z`;
    nextAction = { type: 'follow_up', label: 'Follow Up', scheduledAt };
  } else if (receivable.totalDue > 0) {
    if (receivable.status === 'overdue') {
      nextAction = { type: 'call', label: 'Call Now', scheduledAt: todayAtIso(10, 30) };
    } else if (receivable.status === 'due_soon') {
      nextAction = { type: 'follow_up', label: 'Follow Up', scheduledAt: todayAtIso(14, 0) };
    } else {
      nextAction = { type: 'whatsapp', label: 'WhatsApp Reminder', scheduledAt: todayAtIso(16, 0) };
    }
  }

  const collectionStatusLabel = receivable.status === 'overdue'
    ? 'Overdue'
    : statusLabelForReceivable(receivable.status);
  const isToday = Boolean(
    nextAction && new Date(nextAction.scheduledAt).toDateString() === new Date().toDateString(),
  );

  return { nextAction, assignedTo, collectionStatusLabel, isToday, isMyTask: Boolean(assignedTo) };
}

function mergeRuntimeFollowUpMeta(state: AppState, receivable: CustomerReceivable): CustomerReceivable {
  const runtime = getFollowUpRuntimeMeta(state, receivable.customerId);
  if (!runtime) return receivable;
  return {
    ...receivable,
    ...(runtime.assignedTo ? { assignedTo: runtime.assignedTo } : {}),
    ...(runtime.nextAction ? { nextAction: runtime.nextAction, nextFollowUp: runtime.nextAction.scheduledAt } : {}),
    ...(runtime.paymentPromise ? { paymentPromise: runtime.paymentPromise, isPromised: true } : {}),
  };
}

function applyCollectionOverlay(state: AppState, receivable: CustomerReceivableCore): CustomerReceivable {
  const overlay = getCollectionOverlay(receivable.company);
  if (!overlay) {
    const fallback = buildFallbackCollectionFields(state, receivable);
    return mergeRuntimeFollowUpMeta(state, {
      ...receivable,
      ...fallback,
      collectionStatus: 'none',
      recentActivity: resolveRecentActivity(state, receivable, []),
    });
  }
  return mergeRuntimeFollowUpMeta(state, {
    ...receivable,
    collectionStatus: overlay.collectionStatus,
    collectionStatusLabel: overlay.collectionStatusLabel,
    location: overlay.location,
    nextAction: overlay.nextAction,
    assignedTo: overlay.assignedTo,
    paymentPromise: overlay.paymentPromise,
    recentActivity: resolveRecentActivity(state, receivable, overlay.recentActivity),
    tabCounts: overlay.tabCounts,
    isMyTask: overlay.isMyTask,
    isToday: overlay.isToday,
    isPromised: overlay.isPromised,
    isMissed: overlay.isMissed,
    isCriticalOverdue: overlay.isCriticalOverdue,
    nextFollowUp: overlay.nextAction?.scheduledAt ?? receivable.nextFollowUp,
    ...(overlay.financialOverrides?.lastPaymentAmount != null
      ? { lastPaymentAmount: overlay.financialOverrides.lastPaymentAmount }
      : {}),
    ...(overlay.financialOverrides?.lastPaymentDate
      ? { lastPaymentDate: overlay.financialOverrides.lastPaymentDate }
      : {}),
    ...(overlay.financialOverrides?.creditLimit != null
      ? { creditLimit: overlay.financialOverrides.creditLimit }
      : {}),
    ...(overlay.financialOverrides?.availableCredit != null
      ? { availableCredit: overlay.financialOverrides.availableCredit }
      : {}),
    ...(overlay.financialOverrides?.customerSince
      ? { customerSince: overlay.financialOverrides.customerSince }
      : {}),
  });
}

type CustomerReceivableCore = Omit<
  CustomerReceivable,
  'collectionStatus' | 'collectionStatusLabel' | 'recentActivity'
>;

function buildCustomerReceivable(state: AppState, customer: CrmCustomer): CustomerReceivableCore {
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
  const rows = getCustomerList(state)
    .map((customer) => buildCustomerReceivable(state, customer))
    .map((row) => applyCollectionOverlay(state, row));

  const collectionRows = rows.filter((row) => isCollectionDemoCompany(row.company) && row.totalDue > 0);
  if (collectionRows.length >= 9) {
    return collectionRows.sort((a, b) => {
      if (a.isMissed && !b.isMissed) return -1;
      if (!a.isMissed && b.isMissed) return 1;
      return b.totalDue - a.totalDue;
    });
  }
  return rows.filter((row) => row.totalDue > 0);
}

export function getCustomerReceivableMetrics(state: AppState) {
  const customers = listCustomerReceivables(state);
  const withDue = customers.filter((customer) => customer.totalDue > 0);
  const overdueCustomers = customers.filter((customer) => customer.status === 'overdue' && customer.totalDue > 0);
  const dueSoonCustomers = customers.filter((customer) => customer.status === 'due_soon' && customer.totalDue > 0);
  const collectedMonth = getCollectedThisMonth(state);
  const collectedToday = getCollectedToday(state);
  const useDemoKpi = hasCollectionDemoData(state) && withDue.length >= 9;

  const promisedToday = customers.filter((c) => c.isPromised && c.paymentPromise?.dueDate === todayIso());
  const expectedToday = promisedToday.reduce((sum, c) => sum + Number(c.paymentPromise?.amount ?? 0), 0);
  const promiseCount = promisedToday.length;

  const attentionCustomers = withDue.filter(
    (c) => c.isMissed || c.isCriticalOverdue || c.collectionStatus === 'promise_missed',
  ).length;
  const missedFollowUps = customers.filter((c) => c.isMissed).length;
  const brokenPromises = customers.filter(
    (c) => c.paymentPromise?.status === 'missed' || c.collectionStatus === 'promise_missed',
  ).length;
  const criticalOverdue = customers.filter((c) => c.isCriticalOverdue).length;

  const collectedTodayPct = expectedToday > 0
    ? Math.round((collectedToday.total / expectedToday) * 100)
    : 0;

  const base = {
    totalReceivable: withDue.reduce((sum, customer) => sum + customer.totalDue, 0),
    customerCount: withDue.length,
    overdueAmount: overdueCustomers.reduce((sum, customer) => sum + customer.totalDue, 0),
    overdueCustomerCount: overdueCustomers.length,
    dueThisWeek: dueSoonCustomers.reduce((sum, customer) => sum + customer.totalDue, 0),
    dueThisWeekCount: dueSoonCustomers.length,
    collectedThisMonth: collectedMonth.total,
    paymentCount: collectedMonth.paymentCount,
    expectedToday,
    promiseCount,
    collectedToday: collectedToday.total,
    collectedTodayCount: collectedToday.paymentCount,
    collectedTodayPct,
    attentionCustomers,
    missedFollowUps,
    brokenPromises,
    criticalOverdue,
  };

  if (!useDemoKpi) return base;

  return {
    ...base,
    totalReceivable: COLLECTION_DEMO_KPI.totalReceivable,
    customerCount: COLLECTION_DEMO_KPI.customerCount,
    overdueAmount: COLLECTION_DEMO_KPI.overdueAmount,
    expectedToday: COLLECTION_DEMO_KPI.expectedToday,
    promiseCount: COLLECTION_DEMO_KPI.promiseCount,
    collectedToday: COLLECTION_DEMO_KPI.collectedToday,
    collectedTodayCount: COLLECTION_DEMO_KPI.collectedTodayCount,
    collectedTodayPct: COLLECTION_DEMO_KPI.collectedTodayPct,
    attentionCustomers: COLLECTION_DEMO_KPI.attentionCustomers,
    missedFollowUps: COLLECTION_DEMO_KPI.missedFollowUps,
    brokenPromises: COLLECTION_DEMO_KPI.brokenPromises,
    criticalOverdue: COLLECTION_DEMO_KPI.criticalOverdue,
  };
}

export function getTodayCollectionStats(state: AppState) {
  const customers = listCustomerReceivables(state);
  const useDemoKpi = hasCollectionDemoData(state) && customers.length >= 9;

  const followUps = customers.filter(
    (c) => c.nextAction?.type === 'follow_up' || c.collectionStatus === 'follow_up_scheduled',
  ).length;
  const promises = customers.filter((c) => c.isPromised || c.collectionStatus === 'payment_promise').length;
  const missed = customers.filter((c) => c.isMissed || c.collectionStatus === 'promise_missed').length;
  const broken = customers.filter(
    (c) => c.paymentPromise?.status === 'missed' || c.collectionStatus === 'promise_missed',
  ).length;

  if (useDemoKpi) {
    return {
      followUps: COLLECTION_DEMO_KPI.followUps,
      paymentPromises: COLLECTION_DEMO_KPI.paymentPromises,
      missedFollowUps: COLLECTION_DEMO_KPI.missedFollowUpsBar,
      brokenPromises: COLLECTION_DEMO_KPI.brokenPromisesBar,
    };
  }

  return { followUps, paymentPromises: promises, missedFollowUps: missed, brokenPromises: broken };
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
      if (filters.status === 'my_tasks' && !entry.isMyTask) return false;
      if (filters.status === 'today' && !entry.isToday) return false;
      if (filters.status === 'promised' && !entry.isPromised && entry.collectionStatus !== 'payment_promise') return false;
      if (filters.status === 'missed' && !entry.isMissed && entry.collectionStatus !== 'promise_missed') return false;
    }
    if (filters.assignedStaffId && entry.assignedTo?.id !== filters.assignedStaffId) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const invoiceIds = entry.invoices.map((invoice) => invoice.invoiceId).join(' ');
      const assignee = entry.assignedTo?.name ?? '';
      const hay = `${entry.name} ${entry.company} ${entry.phone} ${assignee} ${invoiceIds}`.toLowerCase();
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

function normalizePartyLabel(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function resolveReceivableCustomerId(
  state: AppState,
  partyId: string,
  partyName: string,
): string | null {
  const receivables = listCustomerReceivables(state);
  const id = partyId.trim();
  if (id) {
    const byId = receivables.find((customer) => customer.customerId === id || customer.id === id);
    if (byId) return byId.customerId;
  }

  const normalizedName = normalizePartyLabel(partyName);
  if (!normalizedName) return null;

  const byName = receivables.find((customer) => {
    const company = normalizePartyLabel(customer.company);
    const name = normalizePartyLabel(customer.name);
    return company === normalizedName || name === normalizedName;
  });
  return byName?.customerId ?? null;
}

export function buildCustomerFollowUpHref(state: AppState, partyId: string, partyName: string): string {
  const resolvedId = resolveReceivableCustomerId(state, partyId, partyName);
  if (resolvedId) {
    return `/accounting/receivables/${encodeURIComponent(resolvedId)}/follow-up`;
  }
  return '/accounting/receivables';
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
