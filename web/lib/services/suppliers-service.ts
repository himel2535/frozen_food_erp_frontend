import type { AppState } from '@/lib/state/types';
import { formatDueDate, formatDueMoney } from '@/lib/services/due-management-service';
import { listFromState } from '@/lib/services/domain-service';
import { listSuppliers } from '@/lib/services/purchases-service';
import { getSupplierPayableDetail } from '@/lib/services/supplier-payables-service';
import {
  buildSupplierContactFallbacks,
  buildSupplierDemoActivities,
  buildSupplierDemoBills,
  buildSupplierDemoMetrics,
  getSupplierDetailOverlay,
  supplierIdHash,
  type SupplierDetailActivitySeed,
  type SupplierDetailBillSeed,
} from '@/lib/state/supplier-detail-seed';

export type SupplierListStatus = 'clear' | 'payment_due' | 'overdue' | 'inactive';

export type EnrichedSupplier = {
  id: string;
  name: string;
  code: string;
  category: string;
  contactName: string;
  phone: string;
  email?: string;
  address?: string;
  location?: string;
  notes?: string;
  leadTime?: string;
  totalPurchase: number;
  lastPurchaseDate: string;
  paymentTerms: string;
  termsSubLabel: string;
  payable: number;
  payableSubLabel: string;
  dueDate: string;
  listStatus: SupplierListStatus;
  statusLabel: string;
  recordStatus: 'active' | 'inactive';
  rating?: number;
  createdAt: string;
  creditLimit?: number;
  openingBalance?: number;
};

export type SupplierDetailMetrics = {
  totalPurchase: number;
  purchaseCount: number;
  itemCount: number;
  totalPaid: number;
  paymentCount: number;
  currentPayable: number;
  billCount: number;
  overdueAmount: number;
  overdueBillCount: number;
};

export type SupplierDetailBill = SupplierDetailBillSeed;

export type SupplierDetailActivity = SupplierDetailActivitySeed;

export type SupplierPerformance = {
  rating: number;
  onTimeDelivery: number;
  qualityAcceptance: number;
  returnRate: number;
  avgLeadTime: string;
  totalOrders: number;
  completedOrders: number;
  activeItems: number;
};

export type SupplierDetailProfile = {
  supplier: EnrichedSupplier;
  categoryLabel: string;
  location: string;
  metrics: SupplierDetailMetrics;
  performance: SupplierPerformance;
  creditLimit: number;
  openingBalance: number;
  usedCredit: number;
  usedCreditPct: number;
  nextDueAmount: number;
  nextDueDate: string;
  lastPaymentDate: string;
  bills: SupplierDetailBill[];
  activities: SupplierDetailActivity[];
};

export type SupplierListMetrics = {
  totalSuppliers: number;
  activeCount: number;
  inactiveCount: number;
  totalPayable: number;
  payableSupplierCount: number;
  overdueAmount: number;
  overdueSupplierCount: number;
  dueThisWeek: number;
  dueThisWeekSupplierCount: number;
};

export type SupplierListFilters = {
  search?: string;
  tab?: string;
  sort?: string;
  category?: string;
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

function diffDays(fromIso: string, toIso: string) {
  return Math.floor((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 86400000);
}

function purchaseStats(state: AppState, supplierName: string) {
  const reportPurchases = (state.reportPurchases ?? []) as Array<{ supplier?: string; total?: number; date?: string }>;
  const purchases = reportPurchases.filter(
    (row) => String(row.supplier ?? '').toLowerCase() === supplierName.toLowerCase(),
  );
  const totalPurchase = purchases.reduce((sum, row) => sum + Number(row.total ?? 0), 0);
  const lastPurchaseDate = purchases
    .map((row) => String(row.date ?? ''))
    .sort((a, b) => b.localeCompare(a))[0] ?? '';
  return { totalPurchase, lastPurchaseDate, purchaseCount: purchases.length };
}

function billStatusLabel(status: string, dueDate: string) {
  const today = todayIso();
  if (status === 'overdue' || (dueDate && dueDate < today)) {
    return { statusLabel: 'Overdue', statusTone: 'rose' as const };
  }
  if (status === 'due_soon' || status === 'due_today' || (dueDate && dueDate <= weekEndIso())) {
    return { statusLabel: 'Due Soon', statusTone: 'amber' as const };
  }
  if (Number(dueDate) === 0 || status === 'paid') {
    return { statusLabel: 'Paid', statusTone: 'emerald' as const };
  }
  return { statusLabel: 'Upcoming', statusTone: 'sky' as const };
}

function resolveListStatus(
  recordStatus: string,
  payable: number,
  dueDate: string,
): { listStatus: SupplierListStatus; statusLabel: string; payableSubLabel: string; termsSubLabel: string } {
  if (recordStatus === 'inactive') {
    return {
      listStatus: 'inactive',
      statusLabel: 'Inactive',
      payableSubLabel: payable > 0 ? formatDueMoney(payable) : '—',
      termsSubLabel: '—',
    };
  }

  if (payable <= 0) {
    return {
      listStatus: 'clear',
      statusLabel: 'Clear',
      payableSubLabel: 'Clear',
      termsSubLabel: dueDate ? `Due ${formatDueDate(dueDate)}` : 'On Delivery',
    };
  }

  const today = todayIso();
  if (dueDate && dueDate < today) {
    const days = Math.abs(diffDays(dueDate, today));
    return {
      listStatus: 'overdue',
      statusLabel: 'Overdue',
      payableSubLabel: `${days} day${days === 1 ? '' : 's'} overdue`,
      termsSubLabel: dueDate ? `Due ${formatDueDate(dueDate)}` : 'Overdue',
    };
  }

  if (dueDate && dueDate <= weekEndIso()) {
    const days = diffDays(today, dueDate);
    return {
      listStatus: 'payment_due',
      statusLabel: 'Payment Due',
      payableSubLabel: days <= 0 ? 'Due today' : `${days} day${days === 1 ? '' : 's'} left`,
      termsSubLabel: dueDate ? `Due ${formatDueDate(dueDate)}` : 'Due soon',
    };
  }

  return {
    listStatus: 'payment_due',
    statusLabel: 'Payment Due',
    payableSubLabel: dueDate ? formatDueDate(dueDate) : 'Outstanding',
    termsSubLabel: dueDate ? `Due ${formatDueDate(dueDate)}` : 'On Credit',
  };
}

function buildEnrichedSupplier(state: AppState, row: Row): EnrichedSupplier {
  const name = String(row.name ?? '');
  const recordStatus = String(row.status ?? 'active') === 'inactive' ? 'inactive' : 'active';
  const payable = Number(row.balance ?? row.due ?? 0);
  const dueDate = String(row.dueDate ?? '');
  const paymentTerms = String(row.paymentTerms ?? row.terms ?? 'Net 30');
  const { totalPurchase, lastPurchaseDate } = purchaseStats(state, name);
  const purchaseTotal = Number(row.totalPurchase ?? totalPurchase);
  const purchaseLast = String(row.lastPurchaseDate ?? lastPurchaseDate);
  const resolved = resolveListStatus(recordStatus, payable, dueDate);
  const overlay = getSupplierDetailOverlay(String(row.id ?? ''));

  const termsSubLabel = String(row.termsSubLabel ?? resolved.termsSubLabel);
  const payableSubLabel = String(row.payableSubLabel ?? resolved.payableSubLabel);

  return {
    id: String(row.id ?? ''),
    name,
    code: String(row.code ?? row.id ?? ''),
    category: String(row.category ?? 'General'),
    contactName: overlay?.contactName ?? String(row.contact ?? row.contactName ?? '—'),
    phone: overlay?.phone ?? String(row.phone ?? '—'),
    email: overlay?.email ?? (row.email ? String(row.email) : undefined),
    address: overlay?.address ?? (row.address ? String(row.address) : undefined),
    location: overlay?.location ?? String(row.location ?? ''),
    notes: row.notes ? String(row.notes) : undefined,
    leadTime: row.lead ? String(row.lead) : row.leadTime ? String(row.leadTime) : undefined,
    totalPurchase: purchaseTotal,
    lastPurchaseDate: overlay?.lastPurchaseDate ?? purchaseLast,
    paymentTerms,
    termsSubLabel: paymentTerms.toLowerCase().includes('cash') ? 'On Delivery' : termsSubLabel,
    payable: overlay?.metrics.currentPayable ?? payable,
    payableSubLabel,
    dueDate: overlay?.nextDueDate ?? dueDate,
    listStatus: (row.listStatus as SupplierListStatus | undefined) ?? resolved.listStatus,
    statusLabel: String(row.statusLabel ?? resolved.statusLabel),
    recordStatus,
    rating: overlay?.performance.rating ?? (row.rating != null ? Number(row.rating) : undefined),
    createdAt: overlay?.supplierSince ?? String(row.createdAt ?? '2026-01-15'),
    creditLimit: overlay?.creditLimit ?? Number(row.creditLimit ?? 0),
    openingBalance: overlay?.openingBalance ?? Number(row.openingBalance ?? 0),
  };
}

function buildComputedBills(state: AppState, supplierId: string): SupplierDetailBill[] {
  const payable = getSupplierPayableDetail(state, supplierId);
  if (!payable) return [];

  const mapBill = (bill: { billId: string; billDate: string; amount: number; paid: number; due: number; dueDate: string; status: string }) => {
    const tone = bill.due <= 0
      ? { statusLabel: 'Paid' as const, statusTone: 'emerald' as const }
      : billStatusLabel(bill.status, bill.dueDate);
    return {
      billNo: bill.billId,
      billDate: bill.billDate,
      amount: bill.amount,
      paid: bill.paid,
      due: bill.due,
      dueDate: bill.dueDate,
      statusLabel: tone.statusLabel,
      statusTone: tone.statusTone,
    };
  };

  const openBills = payable.bills.filter((bill) => bill.due > 0).slice(0, 5).map(mapBill);
  if (openBills.length > 0) return openBills;

  return payable.bills.slice(0, 3).map(mapBill);
}

function buildComputedActivities(state: AppState, supplierId: string, supplierName: string): SupplierDetailActivity[] {
  const payments = listFromState(state, 'purchasePayments')
    .filter((p) => String(p.supplierId) === supplierId)
    .slice(0, 3)
    .map((p) => ({
      id: `pay-${String(p.id)}`,
      type: 'payment' as const,
      title: 'Payment recorded',
      text: `${formatDueMoney(Number(p.amount ?? 0))} payment recorded`,
      at: `${String(p.date ?? todayIso())}T10:00:00.000Z`,
      meta: String(p.id ?? ''),
    }));

  const pos = listFromState(state, 'purchases')
    .filter((po) => String(po.supplier ?? '').toLowerCase() === supplierName.toLowerCase())
    .slice(0, 2)
    .map((po) => ({
      id: `po-${String(po.id)}`,
      type: 'po' as const,
      title: 'Purchase order created',
      text: `${String(po.id ?? 'PO')} created`,
      at: `${String(po.date ?? todayIso())}T14:00:00.000Z`,
    }));

  return [...payments, ...pos].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 5);
}

function buildComputedMetrics(state: AppState, supplier: EnrichedSupplier, rawRow?: Row): SupplierDetailMetrics {
  const payable = getSupplierPayableDetail(state, supplier.id);
  const stats = purchaseStats(state, supplier.name);
  const payments = listFromState(state, 'purchasePayments').filter((p) => String(p.supplierId) === supplier.id);
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
  const bills = payable?.bills ?? [];
  const openBills = bills.filter((b) => b.due > 0);
  const overdueBills = openBills.filter((b) => b.status === 'overdue' || (b.dueDate && b.dueDate < todayIso()));
  const rowPurchase = Number(rawRow?.totalPurchase ?? 0);
  const totalPurchase = supplier.totalPurchase || rowPurchase || stats.totalPurchase;
  const hash = supplierIdHash(supplier.id);
  const purchaseCount = stats.purchaseCount > 0
    ? stats.purchaseCount
    : totalPurchase > 0
      ? Math.max(8 + (hash % 17), payments.length || 1)
      : 0;

  return {
    totalPurchase,
    purchaseCount,
    itemCount: purchaseCount > 0 ? Math.max(Math.round(purchaseCount * 1.6), 4) : 0,
    totalPaid,
    paymentCount: payments.length,
    currentPayable: payable?.totalDue ?? supplier.payable,
    billCount: openBills.length,
    overdueAmount: overdueBills.reduce((sum, b) => sum + b.due, 0),
    overdueBillCount: overdueBills.length,
  };
}

function buildComputedPerformance(supplier: EnrichedSupplier, metrics: SupplierDetailMetrics): SupplierPerformance {
  return {
    rating: supplier.rating ?? 4.0,
    onTimeDelivery: Number((supplier as Row).onTimeDelivery ?? 88),
    qualityAcceptance: 95,
    returnRate: 2.5,
    avgLeadTime: supplier.leadTime ?? '5 Days',
    totalOrders: metrics.purchaseCount,
    completedOrders: Math.max(metrics.purchaseCount - 1, 0),
    activeItems: Math.max(Math.floor(metrics.itemCount / 3), 1),
  };
}

function getRawSupplierRow(state: AppState, supplierId: string): Row | null {
  const row = listSuppliers(state).find((r) => String(r.id) === supplierId);
  return row ? (row as Row) : null;
}

function ensureSupplierDetailFallback(
  state: AppState,
  supplierId: string,
  profile: SupplierDetailProfile,
  hasOverlay: boolean,
): SupplierDetailProfile {
  if (hasOverlay) return profile;

  const rawRow = getRawSupplierRow(state, supplierId);
  const payments = listFromState(state, 'purchasePayments').filter((p) => String(p.supplierId) === supplierId);
  const demoInput = {
    id: profile.supplier.id,
    name: profile.supplier.name,
    category: profile.supplier.category,
    contactName: profile.supplier.contactName,
    totalPurchase: Number(rawRow?.totalPurchase ?? profile.supplier.totalPurchase ?? 0),
    lastPurchaseDate: profile.supplier.lastPurchaseDate,
    createdAt: profile.supplier.createdAt,
    payable: Number(rawRow?.due ?? rawRow?.balance ?? profile.supplier.payable ?? 0),
  };

  const contactFallback = buildSupplierContactFallbacks(demoInput);
  const supplier: EnrichedSupplier = {
    ...profile.supplier,
    email: profile.supplier.email ?? contactFallback.email,
    address: profile.supplier.address ?? contactFallback.address,
    location: profile.supplier.location || contactFallback.location,
    leadTime: profile.supplier.leadTime ?? `${4 + (supplierIdHash(supplierId) % 4)} Days`,
  };

  let metrics = profile.metrics;
  const needsMetrics =
    (metrics.totalPurchase === 0 && demoInput.totalPurchase > 0) ||
    (metrics.purchaseCount === 0 && demoInput.totalPurchase > 0) ||
    (metrics.totalPaid === 0 && payments.length > 0);
  if (needsMetrics) {
    metrics = {
      ...metrics,
      ...buildSupplierDemoMetrics(
        demoInput,
        metrics.totalPaid,
        metrics.paymentCount,
      ),
      currentPayable: metrics.currentPayable || demoInput.payable || 0,
      billCount: metrics.billCount || (payments.length > 0 ? payments.length : 2),
    };
  } else if (metrics.purchaseCount === 0 && metrics.totalPurchase > 0) {
    const hash = supplierIdHash(supplierId);
    metrics = {
      ...metrics,
      purchaseCount: Math.max(8 + (hash % 17), 1),
      itemCount: Math.max(Math.round((8 + (hash % 17)) * 1.6), 4),
    };
  }

  let performance = profile.performance;
  if (performance.totalOrders === 0 && metrics.purchaseCount > 0) {
    performance = {
      ...performance,
      totalOrders: metrics.purchaseCount,
      completedOrders: Math.max(metrics.purchaseCount - 1, 0),
      activeItems: Math.max(Math.floor(metrics.itemCount / 3), 1),
    };
  }

  let bills = profile.bills;
  if (bills.length === 0) {
    bills = buildSupplierDemoBills(
      demoInput,
      payments.map((p) => ({
        id: String(p.id ?? ''),
        billId: String(p.billId ?? ''),
        date: String(p.date ?? ''),
        amount: Number(p.amount ?? 0),
      })),
    );
  }

  let activities = profile.activities;
  if (activities.length === 0) {
    activities = buildSupplierDemoActivities(
      demoInput,
      payments.map((p) => ({
        id: String(p.id ?? ''),
        billId: String(p.billId ?? ''),
        date: String(p.date ?? ''),
        amount: Number(p.amount ?? 0),
      })),
    );
  }

  const creditLimit = profile.creditLimit > 0 ? profile.creditLimit : 150000;
  const usedCredit = metrics.currentPayable;
  const usedCreditPct = creditLimit > 0 ? Math.round((usedCredit / creditLimit) * 1000) / 10 : 0;
  const firstOpenBill = bills.find((b) => b.due > 0);

  return {
    ...profile,
    supplier,
    categoryLabel: profile.categoryLabel.endsWith('Supplier')
      ? profile.categoryLabel
      : `${supplier.category} Supplier`,
    location: supplier.location || contactFallback.location,
    metrics,
    performance,
    bills,
    activities,
    creditLimit,
    usedCredit,
    usedCreditPct,
    nextDueAmount: profile.nextDueAmount || firstOpenBill?.due || 0,
    nextDueDate: profile.nextDueDate && profile.nextDueDate !== '—'
      ? profile.nextDueDate
      : firstOpenBill?.dueDate || supplier.lastPurchaseDate || supplier.createdAt,
    lastPaymentDate: profile.lastPaymentDate !== '—'
      ? profile.lastPaymentDate
      : payments[0]?.date
        ? String(payments[0].date)
        : supplier.lastPurchaseDate,
  };
}

export function listEnrichedSuppliers(state: AppState): EnrichedSupplier[] {
  return listSuppliers(state).map((row) => buildEnrichedSupplier(state, row as Row));
}

export function getSupplierListMetrics(state: AppState): SupplierListMetrics {
  const rows = listEnrichedSuppliers(state);
  const activeCount = rows.filter((r) => r.recordStatus === 'active').length;
  const inactiveCount = rows.length - activeCount;
  const payableRows = rows.filter((r) => r.payable > 0);
  const overdueRows = rows.filter((r) => r.listStatus === 'overdue');
  const dueWeekRows = rows.filter((r) => {
    if (r.payable <= 0 || r.recordStatus === 'inactive') return false;
    if (r.listStatus === 'overdue') return false;
    if (!r.dueDate) return r.listStatus === 'payment_due';
    return r.dueDate >= todayIso() && r.dueDate <= weekEndIso();
  });

  return {
    totalSuppliers: rows.length,
    activeCount,
    inactiveCount,
    totalPayable: payableRows.reduce((sum, r) => sum + r.payable, 0),
    payableSupplierCount: payableRows.length,
    overdueAmount: overdueRows.reduce((sum, r) => sum + r.payable, 0),
    overdueSupplierCount: overdueRows.length,
    dueThisWeek: dueWeekRows.reduce((sum, r) => sum + r.payable, 0),
    dueThisWeekSupplierCount: dueWeekRows.length,
  };
}

export function filterEnrichedSuppliers(rows: EnrichedSupplier[], filters: SupplierListFilters): EnrichedSupplier[] {
  let data = [...rows];
  const tab = filters.tab ?? 'all';

  if (tab === 'payable') {
    data = data.filter((r) => r.payable > 0 && r.recordStatus === 'active');
  } else if (tab === 'overdue') {
    data = data.filter((r) => r.listStatus === 'overdue');
  } else if (tab === 'inactive') {
    data = data.filter((r) => r.recordStatus === 'inactive');
  }

  if (filters.category && filters.category !== 'all') {
    data = data.filter((r) => r.category === filters.category);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase().trim();
    data = data.filter((r) =>
      [r.name, r.phone, r.code, r.contactName, r.category].some((v) => v.toLowerCase().includes(q)),
    );
  }

  const sort = filters.sort ?? 'recent';
  if (sort === 'name') {
    data.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === 'payable') {
    data.sort((a, b) => b.payable - a.payable);
  } else {
    data.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
  }

  return data;
}

export function getSupplierById(state: AppState, id: string): EnrichedSupplier | null {
  return listEnrichedSuppliers(state).find((r) => r.id === id) ?? null;
}

export function getSupplierDetailProfile(state: AppState, supplierId: string): SupplierDetailProfile | null {
  const supplier = getSupplierById(state, supplierId);
  if (!supplier) return null;

  const rawRow = getRawSupplierRow(state, supplierId);
  const overlay = getSupplierDetailOverlay(supplierId);
  const hasOverlay = Boolean(overlay);
  const metrics = overlay?.metrics ?? buildComputedMetrics(state, supplier, rawRow ?? undefined);
  const performance = overlay?.performance ?? buildComputedPerformance(supplier, metrics);
  const creditLimit = overlay?.creditLimit ?? supplier.creditLimit ?? 0;
  const usedCredit = metrics.currentPayable;
  const usedCreditPct = overlay?.usedCreditPct ?? (creditLimit > 0 ? Math.round((usedCredit / creditLimit) * 1000) / 10 : 0);
  const payable = getSupplierPayableDetail(state, supplierId);

  const profile: SupplierDetailProfile = {
    supplier,
    categoryLabel: overlay?.categoryLabel ?? `${supplier.category} Supplier`,
    location: overlay?.location ?? supplier.location ?? supplier.address ?? '—',
    metrics,
    performance,
    creditLimit,
    openingBalance: overlay?.openingBalance ?? supplier.openingBalance ?? 0,
    usedCredit,
    usedCreditPct,
    nextDueAmount: overlay?.nextDueAmount ?? (payable?.bills.find((b) => b.due > 0)?.due ?? 0),
    nextDueDate: overlay?.nextDueDate ?? payable?.dueDate ?? supplier.dueDate,
    lastPaymentDate: overlay?.lastPaymentDate ?? payable?.lastPaymentDate ?? '—',
    bills: overlay?.bills ?? buildComputedBills(state, supplierId),
    activities: overlay?.activities ?? buildComputedActivities(state, supplierId, supplier.name),
  };

  return ensureSupplierDetailFallback(state, supplierId, profile, hasOverlay);
}

export function getSupplierDetailMetrics(state: AppState, supplierId: string): SupplierDetailMetrics | null {
  return getSupplierDetailProfile(state, supplierId)?.metrics ?? null;
}

export function getSupplierDetailActivities(state: AppState, supplierId: string): SupplierDetailActivity[] {
  return getSupplierDetailProfile(state, supplierId)?.activities ?? [];
}

export { formatDueMoney, formatDueDate };
