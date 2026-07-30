import type { AppState } from '@/lib/state/types';
import { listFromState, createInState, updateInState, deleteFromState, formatCurrency } from '@/lib/services/domain-service';
import { listMaterialOptions } from '@/lib/services/recipes-service';

type Row = Record<string, unknown>;

export type PurchaseRmLineItem = {
  id: string;
  materialId: string;
  productName: string;
  sku: string;
  category: string;
  imageUrl: string;
  currentStock: number;
  unit: string;
  qty: number;
  unitPrice: number;
  discountPct: number;
  taxPct: number;
  lineTotal: number;
  receivedQty?: number;
};

export type PurchaseRmTotals = {
  totalItems: number;
  totalQty: number;
  subTotal: number;
  discount: number;
  vatPct: number;
  vat: number;
  aitPct: number;
  ait: number;
  otherCharges: number;
  grandTotal: number;
};

export function listPurchaseRmOrders(state: AppState) {
  return listFromState(state, 'purchaseRmOrders');
}

export function previewPoNumber(state: AppState, dateStr?: string) {
  const year = dateStr ? new Date(`${dateStr}T00:00:00`).getFullYear() : new Date().getFullYear();
  const prefix = `PO-${year}-`;
  const nums = listPurchaseRmOrders(state)
    .map((r) => String(r.id ?? ''))
    .filter((id) => id.startsWith(prefix))
    .map((id) => parseInt(id.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 50) + 1;
  return `${prefix}${String(next).padStart(5, '0')}`;
}

export function computeLineTotal(item: Pick<PurchaseRmLineItem, 'qty' | 'unitPrice' | 'discountPct' | 'taxPct'>) {
  const base = Number(item.qty || 0) * Number(item.unitPrice || 0);
  const discount = base * Number(item.discountPct || 0) / 100;
  const afterDiscount = base - discount;
  const tax = afterDiscount * Number(item.taxPct || 0) / 100;
  return Number((afterDiscount + tax).toFixed(2));
}

export function computePoTotals(
  items: PurchaseRmLineItem[],
  opts?: { vatPct?: number; aitPct?: number; otherCharges?: number },
): PurchaseRmTotals {
  const active = items.filter((i) => i.productName.trim());
  let subTotal = 0;
  let discount = 0;
  let lineTaxSum = 0;
  let totalQty = 0;

  active.forEach((item) => {
    const base = Number(item.qty || 0) * Number(item.unitPrice || 0);
    const disc = base * Number(item.discountPct || 0) / 100;
    const after = base - disc;
    const tax = after * Number(item.taxPct || 0) / 100;
    subTotal += base;
    discount += disc;
    lineTaxSum += tax;
    totalQty += Number(item.qty || 0);
  });

  const net = subTotal - discount;
  const vatPct = Number(opts?.vatPct ?? 15);
  const aitPct = Number(opts?.aitPct ?? 1);
  const otherCharges = Number(opts?.otherCharges ?? 0);
  const vat = lineTaxSum > 0 ? lineTaxSum : Number((net * vatPct / 100).toFixed(2));
  const ait = Number((net * aitPct / 100).toFixed(2));
  const grandTotal = Number((net + vat + ait + otherCharges).toFixed(2));

  return {
    totalItems: active.length,
    totalQty,
    subTotal: Number(subTotal.toFixed(2)),
    discount: Number(discount.toFixed(2)),
    vatPct,
    vat,
    aitPct,
    ait,
    otherCharges,
    grandTotal,
  };
}

function normalizeItems(items: unknown): PurchaseRmLineItem[] {
  if (!Array.isArray(items)) return [];
  return items.map((raw, index) => {
    const item = raw as PurchaseRmLineItem;
    const line: PurchaseRmLineItem = {
      id: String(item.id ?? `line-${index + 1}`),
      materialId: String(item.materialId ?? ''),
      productName: String(item.productName ?? ''),
      sku: String(item.sku ?? ''),
      category: String(item.category ?? ''),
      imageUrl: String(item.imageUrl ?? '/images/logo-toys.png'),
      currentStock: Number(item.currentStock ?? 0),
      unit: String(item.unit ?? 'pcs'),
      qty: Number(item.qty ?? 0),
      unitPrice: Number(item.unitPrice ?? 0),
      discountPct: Number(item.discountPct ?? 0),
      taxPct: Number(item.taxPct ?? 15),
      lineTotal: Number(item.lineTotal ?? 0),
      receivedQty: Number(item.receivedQty ?? 0),
    };
    line.lineTotal = computeLineTotal(line);
    return line;
  }).filter((i) => i.productName.trim());
}

function calcProgress(items: PurchaseRmLineItem[]) {
  const ordered = items.reduce((s, i) => s + Number(i.qty || 0), 0);
  const received = items.reduce((s, i) => s + Number(i.receivedQty || 0), 0);
  if (!ordered) return 0;
  return Math.min(100, Math.round((received / ordered) * 100));
}

function buildTimeline(status: string, createdBy: string, createdAt: string) {
  const base = [{ step: 'created', label: 'PO Created', at: createdAt, by: createdBy }];
  if (['pending_approval', 'sent', 'partially_received', 'completed'].includes(status)) {
    base.push({ step: 'approved', label: 'Approved', at: createdAt, by: 'John Wick' });
  }
  if (['sent', 'partially_received', 'completed'].includes(status)) {
    base.push({ step: 'sent', label: 'Sent to Supplier', at: createdAt, by: createdBy });
  }
  if (['partially_received', 'completed'].includes(status)) {
    base.push({ step: 'received', label: status === 'completed' ? 'Fully Received' : 'Partially Received', at: createdAt, by: createdBy });
  }
  return base;
}

function normalizeRecord(payload: Row): Row {
  const items = normalizeItems(payload.items);
  const totals = computePoTotals(items, {
    vatPct: Number(payload.vatPct ?? (payload.totals as Row)?.vatPct ?? 15),
    aitPct: Number(payload.aitPct ?? (payload.totals as Row)?.aitPct ?? 1),
    otherCharges: Number(payload.otherCharges ?? (payload.totals as Row)?.otherCharges ?? 0),
  });
  const progress = calcProgress(items);
  const status = String(payload.status ?? 'draft');
  const paymentStatus = String(payload.paymentStatus ?? (progress >= 100 ? 'partial' : 'unpaid'));
  const paidPercent = Number(payload.paidPercent ?? (status === 'completed' ? 100 : progress > 0 ? 50 : 0));
  const createdAt = String(payload.createdAt ?? new Date().toISOString());
  const createdBy = String(payload.createdBy ?? 'Sarah Connor');

  return {
    ...payload,
    items,
    totals,
    progress,
    paymentStatus,
    paidPercent,
    grandTotal: totals.grandTotal,
    total: totals.grandTotal,
    timeline: Array.isArray(payload.timeline) && payload.timeline.length
      ? payload.timeline
      : buildTimeline(status, createdBy, createdAt),
    receiveHistory: Array.isArray(payload.receiveHistory) ? payload.receiveHistory : [],
    createdAt,
    createdBy,
  };
}

export function listRmProductOptions(state: AppState) {
  return listMaterialOptions(state);
}

export function getSupplierProfile(state: AppState, supplierId: string) {
  const supplier = listFromState(state, 'purchasesSuppliers').find((s) => String(s.id) === supplierId);
  if (!supplier) {
    return null;
  }
  const orders = listPurchaseRmOrders(state).filter((o) => String(o.supplierId) === supplierId);
  const lastOrder = orders.sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
  const outstanding = Number(supplier.due ?? supplier.balance ?? 0);
  const creditLimit = Number(supplier.creditLimit ?? 100000);

  return {
    id: String(supplier.id),
    name: String(supplier.name ?? ''),
    rating: Number(supplier.rating ?? 4),
    status: String(supplier.status ?? 'active'),
    phone: String(supplier.phone ?? '+880 1711-223344'),
    email: String(supplier.email ?? 'info@supplier.com'),
    address: String(supplier.address ?? 'Dhaka, Bangladesh'),
    outstanding,
    creditLimit,
    lastPurchaseLabel: lastOrder ? `${Math.max(0, Math.floor((Date.now() - new Date(String(lastOrder.date)).getTime()) / 86400000))} Days Ago` : '—',
    lastPoId: lastOrder ? String(lastOrder.id) : '—',
    paymentTerms: String(supplier.paymentTerms ?? '30 Days (Credit)'),
    onTimeDelivery: Number(supplier.onTimeDelivery ?? 96),
  };
}

export function getPurchaseRmMetrics(state: AppState) {
  const rows = listPurchaseRmOrders(state);
  const fmt = (n: number) => formatCurrency(n);
  const sumByStatus = (statuses: string[]) =>
    rows.filter((r) => statuses.includes(String(r.status))).reduce((s, r) => s + Number(r.grandTotal ?? r.total ?? 0), 0);

  const totalValue = rows.reduce((s, r) => s + Number(r.grandTotal ?? r.total ?? 0), 0);
  const overdueCount = rows.filter((r) => {
    if (!['sent', 'partially_received'].includes(String(r.status))) return false;
    const exp = String(r.expectedDelivery ?? '');
    return exp && new Date(`${exp}T00:00:00`) < new Date();
  }).length;

  const overdueValue = rows.filter((r) => {
    if (!['sent', 'partially_received'].includes(String(r.status))) return false;
    const exp = String(r.expectedDelivery ?? '');
    return exp && new Date(`${exp}T00:00:00`) < new Date();
  }).reduce((s, r) => s + Number(r.grandTotal ?? r.total ?? 0), 0);

  return [
    { key: 'total', label: 'Total PO Value', value: fmt(totalValue), sub: 'This Month' },
    { key: 'pending', label: 'Pending Approval', value: fmt(sumByStatus(['pending_approval'])), sub: `${rows.filter((r) => r.status === 'pending_approval').length} orders` },
    { key: 'waiting', label: 'Waiting Delivery', value: fmt(sumByStatus(['sent'])), sub: `${rows.filter((r) => r.status === 'sent').length} orders` },
    { key: 'partial', label: 'Partially Received', value: fmt(sumByStatus(['partially_received'])), sub: `${rows.filter((r) => r.status === 'partially_received').length} orders` },
    { key: 'completed', label: 'Completed', value: fmt(sumByStatus(['completed'])), sub: `${rows.filter((r) => r.status === 'completed').length} orders` },
    { key: 'overdue', label: 'Overdue Orders', value: fmt(overdueValue), sub: `${overdueCount} orders` },
  ];
}

export function createPurchaseRmOrder(state: AppState, payload: Row) {
  const id = String(payload.id ?? previewPoNumber(state, String(payload.date ?? '')));
  const status = String(payload.status ?? 'draft');
  const record = normalizeRecord({ ...payload, id, status });
  return createInState(state, 'purchaseRmOrders', record, 'PO');
}

export function updatePurchaseRmOrder(state: AppState, id: string, payload: Row) {
  const record = normalizeRecord({ ...payload });
  return updateInState(state, 'purchaseRmOrders', id, record);
}

export function deletePurchaseRmOrder(state: AppState, id: string) {
  const row = listPurchaseRmOrders(state).find((r) => String(r.id) === id);
  if (!row || !['draft', 'cancelled'].includes(String(row.status))) {
    return { ok: false, error: 'Only draft or cancelled orders can be deleted' };
  }
  return deleteFromState(state, 'purchaseRmOrders', id);
}

export function sendPurchaseRmOrder(state: AppState, id: string) {
  const row = listPurchaseRmOrders(state).find((r) => String(r.id) === id);
  if (!row || !['draft', 'pending_approval'].includes(String(row.status))) {
    return { ok: false, error: 'Only draft or pending orders can be sent' };
  }
  return updateInState(state, 'purchaseRmOrders', id, { status: 'sent' });
}

export function approvePurchaseRmOrder(state: AppState, id: string) {
  const row = listPurchaseRmOrders(state).find((r) => String(r.id) === id);
  if (!row || String(row.status) !== 'pending_approval') {
    return { ok: false, error: 'Only pending approval orders can be approved' };
  }
  return updateInState(state, 'purchaseRmOrders', id, { status: 'sent' });
}

export function receivePurchaseRmOrder(state: AppState, id: string, receiveQty?: number) {
  const row = listPurchaseRmOrders(state).find((r) => String(r.id) === id);
  if (!row || !['sent', 'partially_received'].includes(String(row.status))) {
    return { ok: false, error: 'Only sent or partially received orders can be received' };
  }

  const items = normalizeItems(row.items);
  const totalOrdered = items.reduce((s, i) => s + Number(i.qty || 0), 0);
  const totalReceived = items.reduce((s, i) => s + Number(i.receivedQty || 0), 0);
  const remaining = totalOrdered - totalReceived;
  const qtyToReceive = receiveQty ?? remaining;

  if (qtyToReceive <= 0) return { ok: false, error: 'Nothing left to receive' };

  let allocated = 0;
  const updatedItems = items.map((item) => {
    if (allocated >= qtyToReceive) return item;
    const itemRemaining = Number(item.qty || 0) - Number(item.receivedQty || 0);
    if (itemRemaining <= 0) return item;
    const take = Math.min(itemRemaining, qtyToReceive - allocated);
    allocated += take;
    const materialId = item.materialId;
    if (materialId) {
      const rms = listFromState(state, 'rawMaterials');
      const idx = rms.findIndex((m) => String(m.id) === materialId);
      if (idx >= 0) {
        const next = [...rms];
        next[idx] = { ...next[idx], quantity: Number(next[idx].quantity ?? 0) + take };
        (state as Record<string, unknown>).rawMaterials = next;
      }
    }
    return { ...item, receivedQty: Number(item.receivedQty || 0) + take };
  });

  const newProgress = calcProgress(updatedItems);
  const newStatus = newProgress >= 100 ? 'completed' : 'partially_received';
  const history = Array.isArray(row.receiveHistory) ? [...row.receiveHistory] : [];
  history.push({
    date: new Date().toISOString().slice(0, 10),
    qty: allocated,
    note: `Received ${allocated} units`,
  });

  return updateInState(state, 'purchaseRmOrders', id, {
    items: updatedItems,
    progress: newProgress,
    status: newStatus,
    paymentStatus: newStatus === 'completed' ? 'paid' : 'partial',
    paidPercent: newStatus === 'completed' ? 100 : Math.max(50, newProgress),
    receiveHistory: history,
  });
}

export function cancelPurchaseRmOrder(state: AppState, id: string) {
  const row = listPurchaseRmOrders(state).find((r) => String(r.id) === id);
  if (!row || !['draft', 'pending_approval', 'sent'].includes(String(row.status))) {
    return { ok: false, error: 'Cannot cancel this order' };
  }
  return updateInState(state, 'purchaseRmOrders', id, { status: 'cancelled' });
}

export function formatPoMoney(value: number) {
  return formatCurrency(value);
}
