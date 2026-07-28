/** Sales domain — quotations, orders, deliveries, dispatch, returns */
import type { AppState } from '@/lib/state/types';
import { ensureCrmState } from '@/lib/services/crm-service';
import { listFromState, createInState, updateInState, deleteFromState } from '@/lib/services/domain-service';

type Row = Record<string, unknown>;

type CrmRecordMaps = {
  quotationsById: Record<string, Row>;
  salesOrdersById: Record<string, Row>;
  paymentsById: Record<string, Row>;
};

export function getCrmMaps(state: AppState): CrmRecordMaps {
  ensureCrmState(state);
  const crm = (state.crmData ?? {}) as Partial<CrmRecordMaps>;
  return {
    quotationsById: crm.quotationsById ?? {},
    salesOrdersById: crm.salesOrdersById ?? {},
    paymentsById: crm.paymentsById ?? {},
  };
}

export function setCrmMaps(state: AppState, maps: Partial<CrmRecordMaps>) {
  state.crmData = { ...(state.crmData ?? {}), ...maps };
}

function mapValues(map: Record<string, Row> | undefined): Row[] {
  return Object.values(map || {});
}

function nextCrmId(state: AppState, prefix: string, existing: string[]): string {
  const nums = existing
    .filter((id) => id.startsWith(prefix))
    .map((id) => parseInt(id.replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `${prefix}-${String(max + 1).padStart(4, '0')}`;
}

function lineTotal(items: Row[]) {
  return items.reduce((sum, row) => sum + Number(row.qty || 0) * Number(row.rate ?? row.price ?? 0), 0);
}

export function listQuotations(state: AppState): Row[] {
  ensureCrmState(state);
  return mapValues(getCrmMaps(state).quotationsById).sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

export function listSalesOrdersFromCrm(state: AppState): Row[] {
  ensureCrmState(state);
  return mapValues(getCrmMaps(state).salesOrdersById).sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

export function listSalesOrders(state: AppState): Row[] {
  const flat = listFromState(state, 'salesOrders');
  const crm = listSalesOrdersFromCrm(state);
  const byId = new Map<string, Row>();
  [...crm, ...flat].forEach((row) => byId.set(String(row.id), row));
  return [...byId.values()].sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')));
}

export function listDeliveries(state: AppState) {
  return listFromState(state, 'salesDeliveries').length
    ? listFromState(state, 'salesDeliveries')
    : listFromState(state, 'deliveries');
}

export function listDispatches(state: AppState) {
  return listFromState(state, 'dispatches');
}

export function listReturns(state: AppState) {
  return listFromState(state, 'salesReturns');
}

export function listPayments(state: AppState): Row[] {
  ensureCrmState(state);
  const crm = mapValues(getCrmMaps(state).paymentsById);
  const flat = listFromState(state, 'salesPayments');
  const byId = new Map<string, Row>();
  [...crm, ...flat].forEach((row) => byId.set(String(row.id), row));
  return [...byId.values()].sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')));
}

export function createQuotation(state: AppState, payload: Row) {
  ensureCrmState(state);
  if (!state.crmData) return { ok: false as const, error: 'CRM not initialized' };
  const maps = getCrmMaps(state);
  const ids = Object.keys(maps.quotationsById);
  const id = String(payload.id ?? nextCrmId(state, 'QUO', ids));
  const items = Array.isArray(payload.items) ? payload.items : [];
  const total = Number(payload.total ?? lineTotal(items as Row[]));
  maps.quotationsById[id] = {
    ...payload,
    id,
    items,
    total,
    status: payload.status || 'draft',
    date: payload.date || new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  };
  setCrmMaps(state, maps);
  return { ok: true as const, id };
}

export function updateQuotation(state: AppState, id: string, payload: Row) {
  ensureCrmState(state);
  const maps = getCrmMaps(state);
  const existing = maps.quotationsById[id];
  if (!existing) return { ok: false, error: 'Not found' };
  const items = Array.isArray(payload.items) ? payload.items : existing.items;
  maps.quotationsById[id] = {
    ...existing,
    ...payload,
    items,
    total: Number(payload.total ?? lineTotal(items as Row[])),
  };
  setCrmMaps(state, maps);
  return { ok: true };
}

export function createSalesOrder(state: AppState, payload: Row) {
  ensureCrmState(state);
  if (!state.crmData) return { ok: false as const, error: 'CRM not initialized' };
  const maps = getCrmMaps(state);
  const ids = Object.keys(maps.salesOrdersById);
  const id = String(payload.id ?? nextCrmId(state, 'SO', ids));
  const items = Array.isArray(payload.items) ? payload.items : [];
  const total = Number(payload.total ?? lineTotal(items as Row[]));
  const record = {
    ...payload,
    id,
    items,
    total,
    status: payload.status || 'draft',
    date: payload.date || new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  };
  maps.salesOrdersById[id] = record;
  setCrmMaps(state, maps);
  createInState(state, 'salesOrders', record, 'SO');
  return { ok: true as const, id };
}

export function updateSalesOrder(state: AppState, id: string, payload: Row) {
  ensureCrmState(state);
  const maps = getCrmMaps(state);
  const existing = maps.salesOrdersById[id];
  if (existing) {
    const items = Array.isArray(payload.items) ? payload.items : existing.items;
    maps.salesOrdersById[id] = { ...existing, ...payload, items, total: Number(payload.total ?? lineTotal(items as Row[])) };
    setCrmMaps(state, maps);
  }
  return updateInState(state, 'salesOrders', id, payload);
}

export function convertQuotationToOrder(state: AppState, quotationId: string) {
  ensureCrmState(state);
  const maps = getCrmMaps(state);
  const quote = maps.quotationsById[quotationId];
  if (!quote) return { ok: false as const, error: 'Quotation not found' };
  const result = createSalesOrder(state, {
    customerId: quote.customerId,
    customer: quote.customer,
    items: quote.items,
    total: quote.total,
    status: 'confirmed',
    sourceQuotationId: quotationId,
  });
  if (result.ok) {
    const updatedMaps = getCrmMaps(state);
    updatedMaps.quotationsById[quotationId] = { ...quote, status: 'accepted' };
    setCrmMaps(state, updatedMaps);
  }
  return result;
}

export function createDelivery(state: AppState, payload: Row) {
  const key = listFromState(state, 'salesDeliveries').length >= 0 ? 'salesDeliveries' : 'deliveries';
  return createInState(state, key, payload, 'DC');
}

export function updateDelivery(state: AppState, id: string, payload: Row) {
  const key = listFromState(state, 'salesDeliveries').length ? 'salesDeliveries' : 'deliveries';
  return updateInState(state, key, id, payload);
}

export function createDispatch(state: AppState, payload: Row) {
  return createInState(state, 'dispatches', payload, 'DSP');
}

export function updateDispatch(state: AppState, id: string, payload: Row) {
  return updateInState(state, 'dispatches', id, payload);
}

export function createReturn(state: AppState, payload: Row) {
  return createInState(state, 'salesReturns', payload, 'SR');
}

export function updateReturn(state: AppState, id: string, payload: Row) {
  return updateInState(state, 'salesReturns', id, payload);
}

export function formatMoney(value: number) {
  return `৳${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function posCheckout(state: AppState, payload: { customer: string; cart: Row[]; total: number }) {
  const items = payload.cart.map((i) => ({
    productId: i.id,
    name: i.name,
    qty: i.qty,
    price: i.price,
  }));
  const result = createSalesOrder(state, {
    customer: payload.customer,
    total: payload.total,
    status: 'fulfilled',
    items,
    source: 'pos',
    date: new Date().toISOString().slice(0, 10),
  });
  if (!result.ok) return result;
  const inventory = Array.isArray(state.inventory) ? state.inventory : [];
  payload.cart.forEach((item) => {
    const idx = inventory.findIndex((p) => String(p.id) === String(item.id) || String(p.sku) === String(item.sku));
    if (idx >= 0) {
      inventory[idx] = { ...inventory[idx], stock: Math.max(0, Number(inventory[idx].stock || 0) - Number(item.qty || 0)) };
    }
  });
  state.inventory = inventory;
  createInState(state, 'posReceipts', { receipt: result.id, amount: payload.total, customer: payload.customer, items: payload.cart.length }, 'POS');
  return result;
}
