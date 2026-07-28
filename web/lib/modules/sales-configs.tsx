import type { SalesDocumentConfig } from '@/components/modules/sales/SalesDocumentModule';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { AppState } from '@/lib/state/types';
import { deleteFromState, updateInState } from '@/lib/services/domain-service';
import {
  listQuotations,
  listSalesOrders,
  listDeliveries,
  listDispatches,
  listReturns,
  listPayments,
  createQuotation,
  updateQuotation,
  createSalesOrder,
  updateSalesOrder,
  convertQuotationToOrder,
  createDelivery,
  updateDelivery,
  createDispatch,
  updateDispatch,
  createReturn,
  updateReturn,
  formatMoney,
  getCrmMaps,
  setCrmMaps,
} from '@/lib/services/sales-service';
import { createPaymentRecord } from '@/lib/services/crm-service';

function docKpi(rows: Record<string, unknown>[], label: string) {
  const total = rows.reduce((s, r) => s + Number(r.total ?? 0), 0);
  return [
    { key: 'count', label: `Total ${label}`, value: String(rows.length) },
    { key: 'open', label: 'Open', value: String(rows.filter((r) => !['fulfilled', 'paid', 'resolved', 'closed', 'accepted'].includes(String(r.status).toLowerCase())).length) },
    { key: 'value', label: 'Total Value', value: formatMoney(total) },
  ];
}

export const QUOTATIONS_CONFIG: SalesDocumentConfig = {
  title: 'Quotations',
  subtitle: 'Create and manage sales quotations with line items.',
  addLabel: 'New Quotation',
  idPrefix: 'QUO',
  statusOptions: ['draft', 'sent', 'accepted', 'rejected'],
  columns: [
    { key: 'id', label: 'Quote #' },
    { key: 'customer', label: 'Customer' },
    { key: 'date', label: 'Date' },
    { key: 'total', label: 'Total', render: (r) => formatMoney(Number(r.total ?? 0)) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={String(r.status)} /> },
  ],
  searchKeys: ['id', 'customer'],
  showLineItems: true,
  kpi: (rows) => docKpi(rows, 'Quotes'),
  list: listQuotations,
  create: createQuotation,
  update: updateQuotation,
  delete: (state, id) => {
    const maps = getCrmMaps(state);
    delete maps.quotationsById[id];
    setCrmMaps(state, maps);
    return { ok: true };
  },
  onConvert: convertQuotationToOrder,
  convertLabel: 'Convert to Order',
};

export const ORDERS_CONFIG: SalesDocumentConfig = {
  title: 'Sales Orders',
  subtitle: 'Manage confirmed orders, fulfillment, and invoicing.',
  addLabel: 'New Order',
  idPrefix: 'SO',
  statusOptions: ['draft', 'confirmed', 'processing', 'fulfilled', 'cancelled'],
  columns: [
    { key: 'id', label: 'Order #' },
    { key: 'customer', label: 'Customer' },
    { key: 'date', label: 'Date' },
    { key: 'total', label: 'Total', render: (r) => formatMoney(Number(r.total ?? 0)) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={String(r.status)} /> },
  ],
  searchKeys: ['id', 'customer'],
  showLineItems: true,
  kpi: (rows) => docKpi(rows, 'Orders'),
  list: listSalesOrders,
  create: createSalesOrder,
  update: updateSalesOrder,
  delete: (state, id) => {
    const maps = getCrmMaps(state);
    delete maps.salesOrdersById[id];
    setCrmMaps(state, maps);
    return deleteFromState(state, 'salesOrders', id);
  },
};

export const DELIVERIES_CONFIG: SalesDocumentConfig = {
  title: 'Delivery Challan',
  subtitle: 'Create delivery challans linked to sales orders.',
  addLabel: 'New Challan',
  idPrefix: 'DC',
  statusOptions: ['draft', 'dispatched', 'delivered', 'cancelled'],
  columns: [
    { key: 'id', label: 'Challan #' },
    { key: 'customer', label: 'Customer' },
    { key: 'orderId', label: 'Order' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={String(r.status)} /> },
  ],
  searchKeys: ['id', 'customer', 'orderId'],
  showLineItems: true,
  kpi: (rows) => docKpi(rows, 'Deliveries'),
  list: listDeliveries,
  create: createDelivery,
  update: updateDelivery,
  delete: (state, id) => deleteFromState(state, 'salesDeliveries', id),
};

export const DISPATCH_CONFIG: SalesDocumentConfig = {
  title: 'Dispatch',
  subtitle: 'Track vehicle dispatch, routes, and delivery status.',
  addLabel: 'New Dispatch',
  idPrefix: 'DSP',
  statusOptions: ['open', 'in-transit', 'completed', 'cancelled'],
  columns: [
    { key: 'id', label: 'Dispatch #' },
    { key: 'route', label: 'Route' },
    { key: 'vehicle', label: 'Vehicle' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={String(r.status)} /> },
  ],
  searchKeys: ['id', 'route', 'vehicle'],
  kpi: (rows) => docKpi(rows, 'Dispatches'),
  list: listDispatches,
  create: createDispatch,
  update: updateDispatch,
  delete: (state, id) => deleteFromState(state, 'dispatches', id),
  customerField: false,
};

export const RETURNS_CONFIG: SalesDocumentConfig = {
  title: 'Sales Returns',
  subtitle: 'Process returns linked to invoices and orders.',
  addLabel: 'New Return',
  idPrefix: 'SR',
  statusOptions: ['draft', 'approved', 'processed', 'rejected'],
  columns: [
    { key: 'id', label: 'Return #' },
    { key: 'customer', label: 'Customer' },
    { key: 'invoiceId', label: 'Invoice' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={String(r.status)} /> },
  ],
  searchKeys: ['id', 'customer', 'invoiceId'],
  showLineItems: true,
  kpi: (rows) => docKpi(rows, 'Returns'),
  list: listReturns,
  create: createReturn,
  update: updateReturn,
  delete: (state, id) => deleteFromState(state, 'salesReturns', id),
};

export const PAYMENTS_CONFIG: SalesDocumentConfig = {
  title: 'Payments',
  subtitle: 'Record customer payments and allocate to invoices.',
  addLabel: 'Record Payment',
  idPrefix: 'PAY',
  statusOptions: ['pending', 'completed', 'failed', 'refunded'],
  columns: [
    { key: 'id', label: 'Payment #' },
    { key: 'customer', label: 'Customer' },
    { key: 'amount', label: 'Amount', render: (r) => formatMoney(Number(r.amount ?? r.total ?? 0)) },
    { key: 'method', label: 'Method' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={String(r.status)} /> },
  ],
  searchKeys: ['id', 'customer'],
  kpi: (rows) => docKpi(rows, 'Payments'),
  list: listPayments,
  create: (state, payload) => {
    const r = createPaymentRecord(state, payload);
    return r.ok ? { ok: true, id: r.paymentId } : { ok: false, error: 'Payment failed' };
  },
  update: (state, id, payload) => {
    const maps = getCrmMaps(state);
    if (maps.paymentsById[id]) {
      maps.paymentsById[id] = { ...maps.paymentsById[id], ...payload };
      setCrmMaps(state, maps);
      return { ok: true };
    }
    return updateInState(state, 'salesPayments', id, payload);
  },
  customerField: true,
};

export function listInvoices(state: AppState) {
  return Array.isArray(state.invoices) ? [...state.invoices] : [];
}

export const INVOICES_CONFIG: SalesDocumentConfig = {
  title: 'Invoices',
  subtitle: 'Manage invoices, approvals, and payment collection.',
  addLabel: 'New Invoice',
  idPrefix: 'INV',
  statusOptions: ['draft', 'pending', 'paid', 'overdue', 'cancelled'],
  columns: [
    { key: 'id', label: 'Invoice #' },
    { key: 'customerId', label: 'Customer' },
    { key: 'date', label: 'Date' },
    { key: 'amount', label: 'Amount', render: (r) => formatMoney(Number(r.amount ?? 0)) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={String(r.status)} /> },
  ],
  searchKeys: ['id'],
  showLineItems: true,
  kpi: (rows) => {
    const totalDue = rows.reduce((s, r) => s + Number(r.due ?? 0), 0);
    const overdueCount = rows.filter((r) => String(r.status).toLowerCase() === 'overdue').length;
    return [
      { key: 'total', label: 'Total Invoices', value: String(rows.length) },
      { key: 'due', label: 'Outstanding', value: formatMoney(totalDue) },
      { key: 'overdue', label: 'Overdue', value: String(overdueCount), alert: overdueCount > 0 },
    ];
  },
  list: listInvoices,
  create: (state, payload) => {
    const items = payload.items;
    const amount = Number(payload.total ?? 0);
    const id = String(payload.id ?? `INV-${Date.now()}`);
    const row = { ...payload, id, amount, items, status: payload.status || 'pending' };
    state.invoices = [...listInvoices(state), row];
    return { ok: true, id };
  },
  update: (state, id, payload) => {
    const rows = listInvoices(state);
    const idx = rows.findIndex((r) => String(r.id) === id);
    if (idx < 0) return { ok: false, error: 'Not found' };
    rows[idx] = { ...rows[idx], ...payload, amount: Number(payload.total ?? payload.amount ?? rows[idx].amount) };
    state.invoices = rows;
    return { ok: true };
  },
  delete: (state, id) => {
    state.invoices = listInvoices(state).filter((r) => String(r.id) !== id);
    return { ok: true };
  },
};
