import type { AppState } from '@/lib/state/types';
import { listFromState, createInState, updateInState, deleteFromState, formatCurrency } from '@/lib/services/domain-service';
import { listInventory, createStockIn } from '@/lib/services/inventory-service';
import { getTaxRateByLabel } from '@/components/modules/sales/invoice-form/inv-form-options';

type Row = Record<string, unknown>;

export type PoLineItem = {
  id: string;
  productId: string;
  description: string;
  unit: string;
  qty: number;
  rate: number;
  discountPct: number;
  taxLabel: string;
  amount: number;
};

export type PoOrderTotals = {
  subtotal: number;
  lineDiscount: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
};

export function listPurchases(state: AppState) {
  return listFromState(state, 'purchases');
}

export function listSuppliers(state: AppState) {
  return listFromState(state, 'purchasesSuppliers');
}

export function createSupplier(state: AppState, payload: Row) {
  return createInState(state, 'purchasesSuppliers', { ...payload, due: Number(payload.due ?? 0), balance: Number(payload.balance ?? payload.due ?? 0) }, 'SUP');
}

export function updateSupplier(state: AppState, id: string, payload: Row) {
  return updateInState(state, 'purchasesSuppliers', id, payload);
}

export function deleteSupplier(state: AppState, id: string) {
  return deleteFromState(state, 'purchasesSuppliers', id);
}

export function previewPurchaseOrderId(state: AppState): string {
  const year = new Date().getFullYear();
  const rows = listPurchases(state);
  const nums = rows
    .map((r) => parseInt(String(r.id).replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 40) + 1;
  return `PO-${year}-${String(next).padStart(5, '0')}`;
}

export function listPoProductOptions(state: AppState) {
  return listInventory(state, { excludeRaw: false }).map((p) => ({
    id: String(p.id),
    name: String(p.name ?? ''),
    sku: String(p.sku ?? p.id),
    price: Number(p.cost ?? p.price ?? 0),
    unit: String(p.uom ?? 'pcs'),
  }));
}

export function getPurchaserOptions(state: AppState) {
  const employees = listFromState(state, 'employees');
  if (employees.length) {
    return employees.map((e) => ({
      id: String(e.id),
      name: String(e.name ?? e.fullName ?? e.id),
    }));
  }
  return [
    { id: 'admin', name: 'Admin Super Admin' },
    { id: 'procurement', name: 'Procurement Team' },
  ];
}

export function recalcPoLineItem(item: PoLineItem): PoLineItem {
  const qty = Math.max(0, Number(item.qty) || 0);
  const rate = Math.max(0, Number(item.rate) || 0);
  const discountPct = Math.min(100, Math.max(0, Number(item.discountPct) || 0));
  const taxRate = getTaxRateByLabel(item.taxLabel);
  const lineSubtotal = qty * rate;
  const lineDiscount = lineSubtotal * (discountPct / 100);
  const lineTaxable = lineSubtotal - lineDiscount;
  const lineTax = lineTaxable * taxRate;
  const amount = lineTaxable + lineTax;
  return { ...item, qty, rate, discountPct, amount };
}

export function computePoOrderTotals(
  items: PoLineItem[],
  overrides?: { docDiscountOverride?: number | null; docTaxOverride?: number | null },
): PoOrderTotals {
  const active = items.filter((item) => item.description.trim() || item.productId);
  let subtotal = 0;
  let lineDiscount = 0;
  let taxAmount = 0;

  active.forEach((raw) => {
    const item = recalcPoLineItem(raw);
    const lineSubtotal = item.qty * item.rate;
    const disc = lineSubtotal * (item.discountPct / 100);
    const taxable = lineSubtotal - disc;
    const taxRate = getTaxRateByLabel(item.taxLabel);
    subtotal += lineSubtotal;
    lineDiscount += disc;
    taxAmount += taxable * taxRate;
  });

  const discountAmount =
    overrides?.docDiscountOverride != null ? Math.max(0, overrides.docDiscountOverride) : lineDiscount;
  const taxFromOverride =
    overrides?.docTaxOverride != null ? Math.max(0, overrides.docTaxOverride) : taxAmount;
  const total = Math.max(0, subtotal - discountAmount + taxFromOverride);

  return { subtotal, lineDiscount, discountAmount, taxAmount: taxFromOverride, total };
}

function legacyFieldsFromItems(items: PoLineItem[], total: number) {
  const first = items.find((i) => i.description.trim() || i.productId);
  if (!first) {
    return { product: '', productId: '', qty: 0, unitCost: 0, total };
  }
  const calc = recalcPoLineItem(first);
  return {
    product: calc.description,
    productId: calc.productId,
    qty: calc.qty,
    unitCost: calc.rate,
    total,
  };
}

function normalizePurchaseOrderRecord(payload: Row): Row {
  const items = Array.isArray(payload.items) ? (payload.items as PoLineItem[]) : [];
  const totals = payload.totals as PoOrderTotals | undefined;
  const total = Number(totals?.total ?? payload.total ?? 0);
  const legacy = items.length ? legacyFieldsFromItems(items, total) : {
    product: String(payload.product ?? ''),
    productId: String(payload.productId ?? ''),
    qty: Number(payload.qty ?? 0),
    unitCost: Number(payload.unitCost ?? 0),
    total,
  };

  const paidAmount = Number(payload.paidAmount ?? 0);
  const balanceDue = Number(payload.balanceDue ?? Math.max(0, total - paidAmount));

  return {
    ...payload,
    ...legacy,
    items,
    subtotal: Number(totals?.subtotal ?? payload.subtotal ?? 0),
    discountAmount: Number(totals?.discountAmount ?? payload.discountAmount ?? 0),
    taxAmount: Number(totals?.taxAmount ?? payload.taxAmount ?? 0),
    total,
    paidAmount,
    balanceDue,
    paymentStatus: payload.paymentStatus ?? 'unpaid',
  };
}

export function createPurchaseOrder(state: AppState, payload: Row) {
  const normalized = normalizePurchaseOrderRecord(payload);
  const id = String(normalized.id ?? previewPurchaseOrderId(state));
  return createInState(state, 'purchases', {
    ...normalized,
    id,
    status: normalized.status ?? 'Draft',
  }, 'PO');
}

export function updatePurchaseOrder(state: AppState, id: string, payload: Row) {
  const normalized = normalizePurchaseOrderRecord({ ...payload, id });
  return updateInState(state, 'purchases', id, normalized);
}

export function deletePurchaseOrder(state: AppState, id: string) {
  return deleteFromState(state, 'purchases', id);
}

export function sendPurchaseOrder(state: AppState, id: string) {
  const rows = listPurchases(state);
  const record = rows.find((r) => String(r.id) === id);
  if (!record || record.status !== 'Draft') return { ok: false, error: 'Only draft orders can be sent' };
  return updateInState(state, 'purchases', id, { status: 'Sent' });
}

function applyStockForLine(state: AppState, productId: string, productName: string, qty: number) {
  const product = listInventory(state).find(
    (p) => String(p.id) === String(productId) || String(p.name) === String(productName),
  );
  if (!product || qty <= 0) return;
  const whId = String(product.defaultWarehouse ?? 'WH-001');
  const ws = { ...(product.warehouseStock as Record<string, number> ?? {}) };
  ws[whId] = Number(ws[whId] ?? 0) + qty;
  const stock = Object.values(ws).reduce((s, v) => s + Number(v || 0), 0);
  const inv = listFromState(state, 'inventory');
  const idx = inv.findIndex((p) => String(p.id) === String(product.id));
  if (idx >= 0) {
    const next = [...inv];
    next[idx] = { ...next[idx], warehouseStock: ws, stock };
    (state as Record<string, unknown>).inventory = next;
  }
}

export function receivePurchaseOrder(state: AppState, id: string) {
  const rows = listPurchases(state);
  const record = rows.find((r) => String(r.id) === id);
  if (!record || record.status !== 'Sent') return { ok: false, error: 'Only sent orders can be received' };
  updateInState(state, 'purchases', id, { status: 'Received' });

  const lineItems = Array.isArray(record.items) ? (record.items as PoLineItem[]) : [];
  if (lineItems.length) {
    lineItems.forEach((line) => {
      applyStockForLine(state, String(line.productId), String(line.description), Number(line.qty ?? 0));
    });
  } else {
    applyStockForLine(
      state,
      String(record.productId ?? record.product),
      String(record.product ?? ''),
      Number(record.qty ?? 0),
    );
  }

  const ledger = listFromState(state, 'accounting');
  const lastBal = ledger.length ? Number(ledger[ledger.length - 1].balance ?? 0) : 0;
  const debit = Number(record.total ?? 0);
  createInState(state, 'accounting', {
    ref: `TXN-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
    account: 'Cost of Goods Sold',
    desc: `Purchase inventory batch ${id} - Received`,
    debit,
    credit: 0,
    balance: lastBal - debit,
  }, 'TXN');
  return { ok: true };
}

export function cancelPurchaseOrder(state: AppState, id: string) {
  const rows = listPurchases(state);
  const record = rows.find((r) => String(r.id) === id);
  if (!record || !['Draft', 'Sent'].includes(String(record.status))) return { ok: false, error: 'Cannot cancel this order' };
  return updateInState(state, 'purchases', id, { status: 'Cancelled' });
}

export function getPurchaseOrderMetrics(rows: Row[]) {
  const totalSpend = rows.reduce((s, r) => s + Number(r.total ?? 0), 0);
  const pending = rows.filter((r) => ['Draft', 'Sent'].includes(String(r.status))).length;
  const received = rows.filter((r) => String(r.status) === 'Received').length;
  const draft = rows.filter((r) => String(r.status) === 'Draft').length;
  return { totalSpend, pending, received, draft };
}

export function listGoodsReceived(state: AppState) { return listFromState(state, 'goodsReceived'); }
export function listVendorBills(state: AppState) { return listFromState(state, 'vendorBills'); }
export function listPurchasePayments(state: AppState) { return listFromState(state, 'purchasePayments'); }
export function listPurchaseReturns(state: AppState) { return listFromState(state, 'purchaseReturns'); }
export function listRecipes(state: AppState) { return listFromState(state, 'recipes'); }

export function createGoodsReceived(state: AppState, payload: Row) {
  const result = createInState(state, 'goodsReceived', payload, 'GRN');
  if (result.ok && payload.product && payload.qty) {
    createStockIn(state, { product: payload.product, qty: payload.qty, supplier: payload.supplier, status: 'received' });
  }
  return result;
}

export { formatCurrency as formatMoney };
