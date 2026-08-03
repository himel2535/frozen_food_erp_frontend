/** Sales domain — quotations, orders, deliveries, dispatch, returns */
import type { AppState } from '@/lib/state/types';
import {
  ensureCrmState,
  getCustomerList,
  getCustomerProfile,
  syncInvoiceBalances,
  transitionInvoiceLifecycle,
} from '@/lib/services/crm-service';
import { listInvoices } from '@/lib/modules/sales-configs';
import {
  computeInvoiceTotalsFromItems,
  type InvoiceLineItem,
} from '@/components/modules/sales/invoice-form/inv-form-types';
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

export type SoOrderTotals = {
  subtotal: number;
  lineDiscount: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
};

export function previewSalesOrderId(state: AppState): string {
  const year = new Date().getFullYear();
  const rows = listSalesOrders(state);
  const nums = rows
    .map((r) => parseInt(String(r.id).replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `SO-${year}-${String(next).padStart(4, '0')}`;
}

export function getSalesPersonOptions(state: AppState) {
  const employees = listFromState(state, 'employees');
  if (employees.length) {
    return employees.map((e) => ({
      id: String(e.id),
      name: String(e.name ?? e.fullName ?? e.id),
    }));
  }
  return [
    { id: 'admin', name: 'Admin Super Admin' },
    { id: 'sales', name: 'Sales Team' },
  ];
}

export function computeSoOrderTotals(
  items: InvoiceLineItem[],
  overrides?: { docDiscountOverride?: number | null; docTaxOverride?: number | null },
): SoOrderTotals {
  return computeInvoiceTotalsFromItems(items, overrides);
}

function normalizeSoLineItems(items: Row[]): Row[] {
  return items.map((item) => ({
    ...item,
    id: item.id,
    productId: item.productId ?? '',
    description: String(item.description ?? item.name ?? ''),
    name: String(item.description ?? item.name ?? ''),
    unit: String(item.unit ?? 'pcs'),
    qty: Number(item.qty ?? item.quantity ?? 0),
    rate: Number(item.rate ?? item.price ?? 0),
    price: Number(item.rate ?? item.price ?? 0),
    discountPct: Number(item.discountPct ?? 0),
    taxLabel: String(item.taxLabel ?? 'No Tax'),
    amount: Number(item.amount ?? item.total ?? 0),
  }));
}

function normalizeSalesOrderRecord(payload: Row): Row {
  const items = Array.isArray(payload.items) ? normalizeSoLineItems(payload.items as Row[]) : [];
  const totals = payload.totals as SoOrderTotals | undefined;
  const total = Number(totals?.total ?? payload.total ?? lineTotal(items));
  const paidAmount = Number(payload.paidAmount ?? 0);
  const balanceDue = Number(payload.balanceDue ?? Math.max(0, total - paidAmount));

  return {
    ...payload,
    items,
    subtotal: Number(totals?.subtotal ?? payload.subtotal ?? 0),
    discountAmount: Number(totals?.discountAmount ?? payload.discountAmount ?? 0),
    taxAmount: Number(totals?.taxAmount ?? payload.taxAmount ?? 0),
    total,
    paidAmount,
    balanceDue,
    paymentStatus: payload.paymentStatus ?? 'unpaid',
    customer: payload.customer ?? payload.customerName,
    customerName: payload.customerName ?? payload.customer,
    deliveryAddress: payload.deliveryAddress ?? payload.shippingAddress,
  };
}

export function deleteSalesOrder(state: AppState, id: string) {
  ensureCrmState(state);
  const maps = getCrmMaps(state);
  delete maps.salesOrdersById[id];
  setCrmMaps(state, maps);
  return deleteFromState(state, 'salesOrders', id);
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
  const normalized = normalizeSalesOrderRecord(payload);
  const maps = getCrmMaps(state);
  const id = String(normalized.id ?? previewSalesOrderId(state));
  const record = {
    ...normalized,
    id,
    status: normalized.status || 'draft',
    date: normalized.date || new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  };
  maps.salesOrdersById[id] = record;
  setCrmMaps(state, maps);
  createInState(state, 'salesOrders', record, 'SO');
  return { ok: true as const, id };
}

export function updateSalesOrder(state: AppState, id: string, payload: Row) {
  ensureCrmState(state);
  const normalized = normalizeSalesOrderRecord({ ...payload, id });
  const maps = getCrmMaps(state);
  const existing = maps.salesOrdersById[id];
  if (existing) {
    maps.salesOrdersById[id] = { ...existing, ...normalized };
    setCrmMaps(state, maps);
  }
  return updateInState(state, 'salesOrders', id, normalized);
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
  const key = 'salesDeliveries';
  const id = String(payload.id ?? previewChallanNumber(state, String(payload.date ?? '')));
  const items = Array.isArray(payload.items) ? payload.items : [];
  const record = normalizeDeliveryRecord(state, { ...payload, id, items });
  return createInState(state, key, record, 'DC');
}

export function updateDelivery(state: AppState, id: string, payload: Row) {
  const key = 'salesDeliveries';
  const items = Array.isArray(payload.items) ? payload.items : undefined;
  const record = normalizeDeliveryRecord(state, { ...payload, ...(items ? { items } : {}) });
  return updateInState(state, key, id, record);
}

function getChallanPeriod(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function formatCustomerDisplayName(customer: { name?: unknown; company?: unknown }): string {
  const name = String(customer.name ?? '').trim();
  const company = String(customer.company ?? '').trim();
  if (!name) return company;
  return company ? `${name} (${company})` : name;
}

function resolveChallanCustomerName(state: AppState, row: Row): string {
  const direct = String(row.customerName ?? row.customer ?? '').trim();
  if (direct) return direct;

  const customerId = String(row.customerId ?? '');
  if (customerId) {
    const customer = getCustomerList(state).find((c) => String(c.id) === customerId);
    if (customer) return formatCustomerDisplayName(customer);
  }

  const orderId = String(row.orderId ?? '');
  if (orderId) {
    const order = listSalesOrders(state).find((o) => String(o.id) === orderId);
    const orderCustomer = String(order?.customer ?? order?.customerName ?? '').trim();
    if (orderCustomer) return orderCustomer;
  }

  return '';
}

export function resolveChallanCustomerLabel(state: AppState, row: Row): string {
  return resolveChallanCustomerName(state, row) || '—';
}

function normalizeDeliveryRecord(state: AppState, payload: Row): Row {
  const items = (Array.isArray(payload.items) ? payload.items : []) as Row[];
  const activeItems = items.filter((item) => String(item.productName ?? item.name ?? '').trim());
  const totalDeliverQty = activeItems.reduce((sum, item) => sum + Number(item.deliverNow ?? item.qty ?? 0), 0);
  const resolvedCustomerName = resolveChallanCustomerName(state, payload);
  return {
    ...payload,
    customer: resolvedCustomerName || String(payload.customer ?? payload.customerName ?? ''),
    customerName: resolvedCustomerName || String(payload.customerName ?? payload.customer ?? ''),
    orderId: payload.orderId ?? '',
    items: activeItems,
    totalDeliverQty,
    totalItems: activeItems.length,
    total: Number(payload.total ?? totalDeliverQty),
  };
}

export function previewChallanNumber(state: AppState, dateStr?: string) {
  const period = getChallanPeriod(dateStr ? new Date(`${dateStr}T00:00:00`) : new Date());
  const prefix = `DC-${period}-`;
  const deliveries = listDeliveries(state);
  const nums = deliveries
    .map((row) => String(row.id ?? ''))
    .filter((id) => id.startsWith(prefix))
    .map((id) => parseInt(id.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}${String(next).padStart(4, '0')}`;
}

export function getDeliveredQtyBySku(state: AppState, orderId: string, excludeChallanId?: string) {
  const totals = new Map<string, number>();
  listDeliveries(state)
    .filter((row) => String(row.orderId) === orderId && String(row.id) !== String(excludeChallanId ?? ''))
    .forEach((row) => {
      const items = Array.isArray(row.items) ? row.items : [];
      items.forEach((item) => {
        const sku = String((item as Row).sku ?? (item as Row).productId ?? '');
        if (!sku) return;
        totals.set(sku, (totals.get(sku) ?? 0) + Number((item as Row).deliverNow ?? (item as Row).qty ?? 0));
      });
    });
  return totals;
}

export function buildChallanItemsFromOrder(state: AppState, orderId: string, excludeChallanId?: string): Row[] {
  const order = listSalesOrders(state).find((row) => String(row.id) === orderId);
  if (!order) return [];
  const deliveredBySku = getDeliveredQtyBySku(state, orderId, excludeChallanId);
  const items = Array.isArray(order.items) ? order.items : [];
  return items.map((raw, index) => {
    const item = raw as Row;
    const sku = String(item.sku ?? item.productId ?? `SKU-${index + 1}`);
    const orderedQty = Number(item.qty ?? item.quantity ?? 0);
    const previouslyDelivered = deliveredBySku.get(sku) ?? 0;
    const deliverNow = Math.max(0, orderedQty - previouslyDelivered);
    return {
      id: `line-${index + 1}`,
      productId: String(item.productId ?? sku),
      productName: String(item.name ?? item.description ?? item.productName ?? 'Product'),
      sku,
      imageUrl: String(item.imageUrl ?? '/images/logo-toys.png'),
      orderedQty,
      previouslyDelivered,
      deliverNow,
      remainingQty: Math.max(0, orderedQty - previouslyDelivered - deliverNow),
      unit: String(item.unit ?? 'Pcs'),
    };
  });
}

export function getCustomerDeliveryDefaults(state: AppState, customerId: string) {
  const profile = getCustomerProfile(state, customerId);
  if (!profile) {
    return { deliveryAddress: '', contactPerson: '', contactPhone: '' };
  }
  const customer = profile.customer as Row;
  const contacts = (profile.contacts ?? []) as Row[];
  const addresses = (profile.addresses ?? []) as Row[];
  const primary = contacts.find((c) => c.primary) ?? contacts[0];
  const shipping = addresses.find((a) => a.type === 'shipping') ?? addresses[0];
  const line1 = String(shipping?.line1 ?? '');
  const city = String(shipping?.city ?? '');
  const region = String(shipping?.region ?? '');
  const postal = String(shipping?.postalCode ?? '');
  const country = String(shipping?.country ?? '');
  const deliveryAddress = [line1, city, region, postal, country].filter(Boolean).join(', ');
  return {
    deliveryAddress,
    contactPerson: String(primary?.name ?? customer.name ?? ''),
    contactPhone: String(primary?.phone ?? ''),
  };
}

function normalizeMatchText(value: string) {
  return value.trim().toLowerCase();
}

function orderMatchesCustomer(
  order: Row,
  customerId: string,
  customerName?: string,
  companyName?: string,
) {
  if (customerId && String(order.customerId) === customerId) return true;

  const orderCustomer = normalizeMatchText(String(order.customer ?? order.customerName ?? ''));
  if (!orderCustomer) return false;

  const name = normalizeMatchText(customerName ?? '');
  const company = normalizeMatchText(companyName ?? '');
  const displayLabel = [name, company].filter(Boolean).join(' ');

  if (name && (orderCustomer.includes(name) || name.includes(orderCustomer.split('(')[0]?.trim() ?? ''))) {
    return true;
  }
  if (company && orderCustomer.includes(company)) return true;
  if (displayLabel && (orderCustomer.includes(displayLabel) || displayLabel.includes(orderCustomer))) {
    return true;
  }

  return false;
}

export function getSalesOrdersForCustomer(
  state: AppState,
  customerId: string,
  customerName?: string,
  companyName?: string,
) {
  if (!customerId) return [];

  const byId = new Map<string, Row>();
  listSalesOrders(state)
    .filter((order) => orderMatchesCustomer(order, customerId, customerName, companyName))
    .forEach((order) => byId.set(String(order.id), order));

  const profile = getCustomerProfile(state, customerId);
  (profile?.salesOrders ?? []).forEach((order) => {
    const row = order as Row;
    byId.set(String(row.id), row);
  });

  return [...byId.values()].sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')));
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

function addDaysToIso(date: string, days: number) {
  const base = new Date(`${date}T00:00:00`);
  base.setDate(base.getDate() + Number(days || 0));
  return base.toISOString().slice(0, 10);
}

function getTermDays(terms: string) {
  const match = String(terms || '').match(/(\d+)/);
  return match ? Number(match[1]) : 30;
}

function getInvoiceYear(dateStr?: string) {
  const date = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
  return date.getFullYear();
}

export function previewInvoiceNumber(state: AppState, dateStr?: string, excludeId?: string) {
  const year = getInvoiceYear(dateStr);
  const prefix = `INV-${year}-`;
  const nums = listInvoices(state)
    .map((row) => String(row.id ?? ''))
    .filter((id) => id.startsWith(prefix) && id !== String(excludeId ?? ''))
    .map((id) => parseInt(id.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}${String(next).padStart(4, '0')}`;
}

export function listInventoryProductOptions(state: AppState) {
  const inventory = Array.isArray(state.inventory) ? state.inventory : [];
  return inventory.map((raw) => {
    const product = raw as Row;
    return {
      id: String(product.id ?? product.sku ?? ''),
      name: String(product.name ?? 'Product'),
      sku: String(product.sku ?? ''),
      price: Number(product.price ?? product.sellingPrice ?? product.rate ?? 0),
    };
  });
}

export function getCustomerBillingDefaults(state: AppState, customerId: string, issueDate?: string) {
  const profile = getCustomerProfile(state, customerId);
  if (!profile) {
    return { billingAddress: '', paymentTerms: 'Net 30', dueDate: '' };
  }
  const customer = profile.customer as Row;
  const addresses = (profile.addresses ?? []) as Row[];
  const billing = addresses.find((a) => a.type === 'billing')
    ?? addresses.find((a) => a.type === 'shipping')
    ?? addresses[0];
  const line1 = String(billing?.line1 ?? '');
  const city = String(billing?.city ?? '');
  const region = String(billing?.region ?? '');
  const postal = String(billing?.postalCode ?? '');
  const country = String(billing?.country ?? '');
  const billingAddress = [line1, city, region, postal, country].filter(Boolean).join(', ');
  const paymentTerms = String(customer.paymentTerms ?? 'Net 30');
  const baseDate = issueDate || new Date().toISOString().slice(0, 10);
  const dueDate = addDaysToIso(baseDate, getTermDays(paymentTerms));
  return { billingAddress, paymentTerms, dueDate };
}

export function computeInvoiceTotals(
  items: InvoiceLineItem[],
  overrides?: { docDiscountOverride?: number | null; docTaxOverride?: number | null },
) {
  return computeInvoiceTotalsFromItems(items, overrides);
}

function normalizeInvoiceItems(items: InvoiceLineItem[]) {
  return items
    .filter((item) => item.description.trim() || item.productId)
    .map((item) => ({
      id: item.id,
      productId: item.productId,
      description: item.description,
      name: item.description,
      qty: item.qty,
      quantity: item.qty,
      rate: item.rate,
      price: item.rate,
      discountPct: item.discountPct,
      taxLabel: item.taxLabel,
      total: item.amount,
      amount: item.amount,
    }));
}

export function createInvoice(state: AppState, payload: Row) {
  ensureCrmState(state);
  const items = normalizeInvoiceItems((payload.items ?? []) as InvoiceLineItem[]);
  const id = String(payload.id ?? previewInvoiceNumber(state, String(payload.issueDate ?? payload.date ?? '')));
  const totals = computeInvoiceTotalsFromItems((payload.items ?? []) as InvoiceLineItem[], {
    docDiscountOverride: payload.docDiscountOverride as number | null | undefined,
    docTaxOverride: payload.docTaxOverride as number | null | undefined,
  });
  const record: Row = {
    ...payload,
    id,
    items,
    issueDate: payload.issueDate ?? payload.date,
    date: payload.issueDate ?? payload.date,
    subtotal: totals.subtotal,
    discountAmount: totals.discountAmount,
    discount: totals.discountAmount,
    taxAmount: totals.taxAmount,
    tax: totals.taxAmount,
    total: totals.total,
    amount: totals.total,
    status: payload.status || 'draft',
    billingAddress: payload.billingAddress ?? '',
    notes: payload.notes ?? '',
    terms: payload.terms ?? payload.paymentTerms ?? 'Net 30',
    includeSignature: Boolean(payload.includeSignature),
    signatureId: payload.signatureId ?? null,
  };
  state.invoices = [...listInvoices(state), record];
  syncInvoiceBalances(state);
  return { ok: true as const, id };
}

export function updateInvoice(state: AppState, id: string, payload: Row) {
  ensureCrmState(state);
  const rows = listInvoices(state);
  const idx = rows.findIndex((r) => String(r.id) === id);
  if (idx < 0) return { ok: false as const, error: 'Not found' };
  const items = normalizeInvoiceItems((payload.items ?? rows[idx].items ?? []) as InvoiceLineItem[]);
  const totals = computeInvoiceTotalsFromItems((payload.items ?? []) as InvoiceLineItem[], {
    docDiscountOverride: payload.docDiscountOverride as number | null | undefined,
    docTaxOverride: payload.docTaxOverride as number | null | undefined,
  });
  rows[idx] = {
    ...rows[idx],
    ...payload,
    id,
    items,
    issueDate: payload.issueDate ?? payload.date ?? rows[idx].issueDate,
    date: payload.issueDate ?? payload.date ?? rows[idx].date,
    subtotal: totals.subtotal,
    discountAmount: totals.discountAmount,
    discount: totals.discountAmount,
    taxAmount: totals.taxAmount,
    tax: totals.taxAmount,
    total: totals.total,
    amount: totals.total,
    billingAddress: payload.billingAddress ?? rows[idx].billingAddress,
    notes: payload.notes ?? rows[idx].notes,
    terms: payload.terms ?? rows[idx].terms,
    includeSignature: payload.includeSignature ?? rows[idx].includeSignature ?? false,
    signatureId: payload.signatureId ?? rows[idx].signatureId ?? null,
  };
  state.invoices = rows;
  syncInvoiceBalances(state);
  return { ok: true as const };
}

export function deleteInvoice(state: AppState, id: string) {
  state.invoices = listInvoices(state).filter((r) => String(r.id) !== id);
  syncInvoiceBalances(state);
  return { ok: true as const };
}

export function markInvoiceSent(state: AppState, id: string) {
  return transitionInvoiceLifecycle(state, id, 'sent');
}

export function resolveInvoiceCustomerLabel(state: AppState, row: Row): string {
  const direct = String(row.customerName ?? row.customer ?? '').trim();
  if (direct) return direct;
  const customerId = String(row.customerId ?? '');
  if (customerId) {
    const customer = getCustomerList(state).find((c) => String(c.id) === customerId);
    if (customer) {
      const name = String(customer.name ?? '').trim();
      const company = String(customer.company ?? '').trim();
      if (!name) return company;
      return company ? `${name} (${company})` : name;
    }
  }
  return '—';
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
