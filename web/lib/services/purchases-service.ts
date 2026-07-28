import type { AppState } from '@/lib/state/types';
import { listFromState, createInState, updateInState, deleteFromState, formatCurrency } from '@/lib/services/domain-service';
import { listInventory, createStockIn } from '@/lib/services/inventory-service';

type Row = Record<string, unknown>;

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

export function createPurchaseOrder(state: AppState, payload: Row) {
  const qty = Number(payload.qty ?? 0);
  const unitCost = Number(payload.unitCost ?? 0);
  const total = Number(payload.total ?? qty * unitCost);
  const year = new Date().getFullYear();
  const rows = listPurchases(state);
  const nums = rows.map((r) => parseInt(String(r.id).replace(/\D/g, ''), 10)).filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 40) + 1;
  const id = String(payload.id ?? `PO-${year}-${String(next).padStart(5, '0')}`);
  return createInState(state, 'purchases', { ...payload, id, qty, unitCost, total, status: payload.status ?? 'Draft' }, 'PO');
}

export function updatePurchaseOrder(state: AppState, id: string, payload: Row) {
  const qty = Number(payload.qty ?? 0);
  const unitCost = Number(payload.unitCost ?? 0);
  if (payload.qty !== undefined || payload.unitCost !== undefined) {
    payload.total = qty * unitCost;
  }
  return updateInState(state, 'purchases', id, payload);
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

export function receivePurchaseOrder(state: AppState, id: string) {
  const rows = listPurchases(state);
  const record = rows.find((r) => String(r.id) === id);
  if (!record || record.status !== 'Sent') return { ok: false, error: 'Only sent orders can be received' };
  updateInState(state, 'purchases', id, { status: 'Received' });
  const productId = record.productId ?? record.product;
  const product = listInventory(state).find((p) => String(p.id) === String(productId) || String(p.name) === String(record.product));
  if (product) {
    const whId = String(product.defaultWarehouse ?? 'WH-001');
    const ws = { ...(product.warehouseStock as Record<string, number> ?? {}) };
    ws[whId] = Number(ws[whId] ?? 0) + Number(record.qty ?? 0);
    const stock = Object.values(ws).reduce((s, v) => s + Number(v || 0), 0);
    const inv = listFromState(state, 'inventory');
    const idx = inv.findIndex((p) => String(p.id) === String(product.id));
    if (idx >= 0) {
      const next = [...inv];
      next[idx] = { ...next[idx], warehouseStock: ws, stock };
      (state as Record<string, unknown>).inventory = next;
    }
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
