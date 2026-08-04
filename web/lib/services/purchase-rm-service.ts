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

export type PurchaseRmReceiveProofItem = {
  productName: string;
  sku: string;
  qty: number;
  unit: string;
  unitPrice: number;
  discountPct: number;
  taxPct: number;
  lineTotal: number;
};

export type PurchaseRmReceiveProof = {
  id: string;
  date: string;
  poId: string;
  supplierName: string;
  warehouseName: string;
  receivedBy: string;
  qty: number;
  note: string;
  proofType?: string;
  proofNote?: string;
  attachments?: Array<{ type: string; name: string; dataUrl: string }>;
  items: PurchaseRmReceiveProofItem[];
  subTotal: number;
  vat: number;
  ait: number;
  grandTotal: number;
};

export type PurchaseRmReceiveAttachment = {
  type: string;
  name: string;
  dataUrl: string;
};

export type PurchaseRmReceiveOpts = {
  receiveQty?: number;
  proofType?: string;
  proofNote?: string;
  attachments?: PurchaseRmReceiveAttachment[];
};

export function listPurchaseRmOrders(state: AppState) {
  return listFromState(state, 'purchaseRmOrders');
}

export function listApprovals(state: AppState) {
  return listFromState(state, 'approvals');
}

function markApprovalForOrder(state: AppState, refId: string, status: 'approved' | 'rejected') {
  const linked = listApprovals(state).find(
    (a) => String(a.refType) === 'purchase_rm_order' && String(a.refId) === refId,
  );
  if (linked) {
    updateInState(state, 'approvals', String(linked.id), { status });
  }
}

export function upsertPurchaseRmApproval(state: AppState, order: Row) {
  const refId = String(order.id);
  const item = `${refId} — ${String(order.supplierName ?? 'Supplier')}`;
  const payload = {
    item,
    requester: String(order.createdBy ?? 'Sarah Connor'),
    module: 'Purchase RM',
    refType: 'purchase_rm_order',
    refId,
    status: 'pending',
    notes: String(order.notes ?? ''),
  };
  const existing = listApprovals(state).find(
    (a) => String(a.refType) === 'purchase_rm_order' && String(a.refId) === refId,
  );
  if (existing) {
    return updateInState(state, 'approvals', String(existing.id), { ...payload, status: 'pending' });
  }
  return createInState(state, 'approvals', payload, 'APR');
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

export function previewBillNumber(state: AppState, dateStr?: string) {
  const year = dateStr ? new Date(`${dateStr}T00:00:00`).getFullYear() : new Date().getFullYear();
  const prefix = `BILL-${year}-`;
  const nums = listFromState(state, 'vendorBills')
    .map((r) => String(r.id ?? ''))
    .filter((billId) => billId.startsWith(prefix))
    .map((billId) => parseInt(billId.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}${String(next).padStart(5, '0')}`;
}

export function previewGrnNumber(state: AppState, dateStr?: string) {
  const year = dateStr ? new Date(`${dateStr}T00:00:00`).getFullYear() : new Date().getFullYear();
  const prefix = `GRN-${year}-`;
  const nums = listPurchaseRmOrders(state)
    .flatMap((r) => (Array.isArray(r.receiveHistory) ? r.receiveHistory : []))
    .map((h) => String((h as Row).id ?? ''))
    .filter((grnId) => grnId.startsWith(prefix))
    .map((grnId) => parseInt(grnId.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
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
    { key: 'total', label: 'Total PO Value', value: fmt(totalValue), sub: 'This Month', iconify: 'flat-color-icons:currency-exchange' },
    { key: 'pending', label: 'Pending Approval', value: fmt(sumByStatus(['pending_approval'])), sub: `${rows.filter((r) => r.status === 'pending_approval').length} orders`, iconify: 'flat-color-icons:clock' },
    { key: 'waiting', label: 'Waiting Delivery', value: fmt(sumByStatus(['sent'])), sub: `${rows.filter((r) => r.status === 'sent').length} orders`, iconify: 'flat-color-icons:shipped' },
    { key: 'partial', label: 'Partially Received', value: fmt(sumByStatus(['partially_received'])), sub: `${rows.filter((r) => r.status === 'partially_received').length} orders`, iconify: 'flat-color-icons:medium-priority' },
    { key: 'completed', label: 'Completed', value: fmt(sumByStatus(['completed'])), sub: `${rows.filter((r) => r.status === 'completed').length} orders`, iconify: 'flat-color-icons:approval' },
    { key: 'overdue', label: 'Overdue Orders', value: fmt(overdueValue), sub: `${overdueCount} orders`, iconify: 'flat-color-icons:alarm-clock' },
  ];
}

export function createPurchaseRmOrder(state: AppState, payload: Row) {
  const id = String(payload.id ?? previewPoNumber(state, String(payload.date ?? '')));
  const status = String(payload.status ?? 'draft');
  const record = normalizeRecord({ ...payload, id, status });
  const result = createInState(state, 'purchaseRmOrders', record, 'PO');
  if (result.ok && status === 'pending_approval') {
    upsertPurchaseRmApproval(state, record);
  }
  return result;
}

export function updatePurchaseRmOrder(state: AppState, id: string, payload: Row) {
  const record = normalizeRecord({ ...payload, id });
  const result = updateInState(state, 'purchaseRmOrders', id, record);
  if (result.ok && String(record.status) === 'pending_approval') {
    upsertPurchaseRmApproval(state, record);
  }
  return result;
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
  if (!row || String(row.status) !== 'draft') {
    return { ok: false, error: 'Only draft orders can be sent for approval' };
  }
  const result = updateInState(state, 'purchaseRmOrders', id, { status: 'pending_approval' });
  if (!result.ok) return result;
  upsertPurchaseRmApproval(state, { ...row, status: 'pending_approval' });
  return { ok: true };
}

export function approvePurchaseRmOrder(state: AppState, id: string) {
  const row = listPurchaseRmOrders(state).find((r) => String(r.id) === id);
  if (!row || String(row.status) !== 'pending_approval') {
    return { ok: false, error: 'Only pending approval orders can be approved' };
  }
  const result = updateInState(state, 'purchaseRmOrders', id, { status: 'sent' });
  if (!result.ok) return result;
  markApprovalForOrder(state, id, 'approved');
  return { ok: true };
}

export function rejectPurchaseRmOrder(state: AppState, id: string) {
  const row = listPurchaseRmOrders(state).find((r) => String(r.id) === id);
  if (!row || String(row.status) !== 'pending_approval') {
    return { ok: false, error: 'Only pending approval orders can be rejected' };
  }
  const result = updateInState(state, 'purchaseRmOrders', id, { status: 'draft' });
  if (!result.ok) return result;
  markApprovalForOrder(state, id, 'rejected');
  return { ok: true };
}

export function receivePurchaseRmOrder(
  state: AppState,
  id: string,
  opts?: PurchaseRmReceiveOpts | number,
) {
  const options: PurchaseRmReceiveOpts = typeof opts === 'number' ? { receiveQty: opts } : (opts ?? {});
  if (!options.attachments?.length) {
    return { ok: false as const, error: 'Upload at least one proof file (receipt or bank transaction).' };
  }

  const row = listPurchaseRmOrders(state).find((r) => String(r.id) === id);
  if (!row || !['sent', 'partially_received'].includes(String(row.status))) {
    return { ok: false as const, error: 'Only sent or partially received orders can be received' };
  }

  const items = normalizeItems(row.items);
  const totalOrdered = items.reduce((s, i) => s + Number(i.qty || 0), 0);
  const totalReceived = items.reduce((s, i) => s + Number(i.receivedQty || 0), 0);
  const remaining = totalOrdered - totalReceived;
  const qtyToReceive = options.receiveQty ?? remaining;

  if (qtyToReceive <= 0) return { ok: false as const, error: 'Nothing left to receive' };

  const proofItems: PurchaseRmReceiveProofItem[] = [];
  let allocated = 0;
  const updatedItems = items.map((item) => {
    if (allocated >= qtyToReceive) return item;
    const itemRemaining = Number(item.qty || 0) - Number(item.receivedQty || 0);
    if (itemRemaining <= 0) return item;
    const take = Math.min(itemRemaining, qtyToReceive - allocated);
    allocated += take;
    proofItems.push({
      productName: item.productName,
      sku: item.sku,
      qty: take,
      unit: item.unit,
      unitPrice: item.unitPrice,
      discountPct: item.discountPct,
      taxPct: item.taxPct,
      lineTotal: computeLineTotal({ ...item, qty: take }),
    });
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
  const orderTotals = row.totals as Row | undefined;
  const vatPct = Number(orderTotals?.vatPct ?? row.vatPct ?? 15);
  const aitPct = Number(orderTotals?.aitPct ?? row.aitPct ?? 1);
  const proofLineItems: PurchaseRmLineItem[] = proofItems.map((p, index) => ({
    id: `proof-${index}`,
    materialId: '',
    productName: p.productName,
    sku: p.sku,
    category: '',
    imageUrl: '',
    currentStock: 0,
    unit: p.unit,
    qty: p.qty,
    unitPrice: p.unitPrice,
    discountPct: p.discountPct,
    taxPct: p.taxPct,
    lineTotal: p.lineTotal,
    receivedQty: 0,
  }));
  const proofTotals = computePoTotals(proofLineItems, { vatPct, aitPct, otherCharges: 0 });
  const proofId = previewGrnNumber(state);
  const receiveDate = new Date().toISOString().slice(0, 10);
  const proofType = options.proofType ?? 'receipt';
  const proofNote = options.proofNote ?? '';
  const history = Array.isArray(row.receiveHistory) ? [...row.receiveHistory] : [];
  history.push({
    id: proofId,
    date: receiveDate,
    poId: id,
    supplierName: String(row.supplierName ?? ''),
    warehouseName: String(row.warehouseName ?? ''),
    receivedBy: String(row.createdBy ?? 'Sarah Connor'),
    qty: allocated,
    note: proofNote || `Received ${allocated} units`,
    proofType,
    proofNote,
    attachments: options.attachments,
    items: proofItems,
    subTotal: proofTotals.subTotal,
    vat: proofTotals.vat,
    ait: proofTotals.ait,
    grandTotal: proofTotals.grandTotal,
  });

  let billId = String(row.billId ?? '');
  if (newStatus === 'completed') {
    const dueBase = String(row.expectedDelivery ?? receiveDate);
    const dueDate = dueBase >= receiveDate
      ? dueBase
      : new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const billResult = createInState(state, 'vendorBills', {
      supplier: String(row.supplierName ?? ''),
      amount: Number(row.grandTotal ?? row.total ?? proofTotals.grandTotal),
      dueDate,
      status: 'draft',
      ref: id,
      notes: `Auto-created from RM order ${id}`,
    }, 'BILL');
    if (billResult.ok) billId = billResult.id;
  }

  const result = updateInState(state, 'purchaseRmOrders', id, {
    items: updatedItems,
    progress: newProgress,
    status: newStatus,
    paymentStatus: newStatus === 'completed' ? 'paid' : 'partial',
    paidPercent: newStatus === 'completed' ? 100 : Math.max(50, newProgress),
    receiveHistory: history,
    ...(billId ? { billId } : {}),
  });
  if (!result.ok) return result;
  return { ok: true as const, proofId };
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
