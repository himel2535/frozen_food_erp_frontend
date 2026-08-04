import type { SalesDocumentConfig } from '@/components/modules/sales/SalesDocumentModule';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { AppState } from '@/lib/state/types';
import { deleteFromState, updateInState } from '@/lib/services/domain-service';
import type { TranslateFn } from '@/lib/i18n/resolve-label';
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
  getCrmMaps,
  setCrmMaps,
} from '@/lib/services/sales-service';
import { createPaymentRecord } from '@/lib/services/crm-service';

type MoneyFormatter = (value: number) => string;
type CountFormatter = (value: number) => string;

function docKpi(
  t: TranslateFn,
  rows: Record<string, unknown>[],
  label: string,
  formatMoney: MoneyFormatter,
  formatCount: CountFormatter,
) {
  const total = rows.reduce((s, r) => s + Number(r.total ?? 0), 0);
  const closedStatuses = ['fulfilled', 'paid', 'resolved', 'closed', 'accepted', 'delivered'];
  const open = rows.filter((r) => !closedStatuses.includes(String(r.status).toLowerCase())).length;
  const closed = rows.length - open;
  return [
    { key: 'count', label: t('sales.kpi_total_count', { label }), value: formatCount(rows.length), iconify: 'flat-color-icons:serial-tasks' },
    { key: 'open', label: t('sales.kpi_open'), value: formatCount(open), iconify: 'flat-color-icons:clock' },
    { key: 'value', label: t('sales.kpi_total_value'), value: formatMoney(total), iconify: 'flat-color-icons:currency-exchange' },
    { key: 'closed', label: t('sales.kpi_closed'), value: formatCount(closed), iconify: 'flat-color-icons:approval' },
  ];
}

function statusTabs(t: TranslateFn, statuses: string[]) {
  return [
    { id: 'all', label: t('common.all') },
    ...statuses.map((s) => ({ id: s, label: t(`status.${s}`) !== `status.${s}` ? t(`status.${s}`) : s })),
  ];
}

export function getQuotationsConfig(
  t: TranslateFn,
  formatMoney: MoneyFormatter,
  formatCount: CountFormatter = String,
): SalesDocumentConfig {
  return {
    title: t('sales.quotations_title'),
    subtitle: t('sales.quotations_subtitle'),
    addLabel: t('sales.new_quotation'),
    idPrefix: 'QUO',
    statusOptions: ['draft', 'sent', 'accepted', 'rejected'],
    statusFilterTabs: statusTabs(t, ['draft', 'sent', 'accepted', 'rejected']),
    columns: [
      { key: 'id', label: t('sales.col_quote_number') },
      { key: 'customer', label: t('sales.col_customer') },
      { key: 'date', label: t('sales.col_date') },
      { key: 'total', label: t('sales.col_total'), render: (r) => formatMoney(Number(r.total ?? 0)) },
      { key: 'status', label: t('sales.col_status'), render: (r) => <StatusBadge status={String(r.status)} /> },
    ],
    searchKeys: ['id', 'customer'],
    showLineItems: true,
    kpi: (rows) => docKpi(t, rows, t('sales.quotations_title'), formatMoney, formatCount),
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
    convertLabel: t('sales.convert_to_order'),
  };
}

export function getOrdersConfig(
  t: TranslateFn,
  formatMoney: MoneyFormatter,
  formatCount: CountFormatter = String,
): SalesDocumentConfig {
  return {
    title: t('sales.orders_title'),
    subtitle: t('sales.orders_subtitle'),
    addLabel: t('sales.new_order'),
    idPrefix: 'SO',
    statusOptions: ['draft', 'confirmed', 'processing', 'fulfilled', 'cancelled'],
    statusFilterTabs: statusTabs(t, ['draft', 'confirmed', 'processing', 'fulfilled', 'cancelled']),
    columns: [
      { key: 'id', label: t('sales.col_order_number') },
      { key: 'customer', label: t('sales.col_customer') },
      { key: 'date', label: t('sales.col_date') },
      { key: 'total', label: t('sales.col_total'), render: (r) => formatMoney(Number(r.total ?? 0)) },
      { key: 'status', label: t('sales.col_status'), render: (r) => <StatusBadge status={String(r.status)} /> },
    ],
    searchKeys: ['id', 'customer'],
    showLineItems: true,
    kpi: (rows) => docKpi(t, rows, t('common.orders'), formatMoney, formatCount),
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
}

export function getDeliveriesConfig(
  t: TranslateFn,
  formatMoney: MoneyFormatter,
  formatCount: CountFormatter = String,
): SalesDocumentConfig {
  return {
    title: t('sales.deliveries_title'),
    subtitle: t('sales.deliveries_subtitle'),
    addLabel: t('sales.new_challan'),
    idPrefix: 'DC',
    statusOptions: ['draft', 'dispatched', 'delivered', 'cancelled'],
    statusFilterTabs: statusTabs(t, ['draft', 'dispatched', 'delivered', 'cancelled']),
    columns: [
      { key: 'id', label: t('sales.col_challan_number') },
      { key: 'customer', label: t('sales.col_customer') },
      { key: 'orderId', label: t('sales.col_order') },
      { key: 'status', label: t('sales.col_status'), render: (r) => <StatusBadge status={String(r.status)} /> },
    ],
    searchKeys: ['id', 'customer', 'orderId'],
    showLineItems: true,
    kpi: (rows) => docKpi(t, rows, t('sales.deliveries_title'), formatMoney, formatCount),
    list: listDeliveries,
    create: createDelivery,
    update: updateDelivery,
    delete: (state, id) => deleteFromState(state, 'salesDeliveries', id),
  };
}

export function getDispatchConfig(
  t: TranslateFn,
  formatMoney: MoneyFormatter,
  formatCount: CountFormatter = String,
): SalesDocumentConfig {
  return {
    title: t('sales.dispatch_title'),
    subtitle: t('sales.dispatch_subtitle'),
    addLabel: t('sales.new_dispatch'),
    idPrefix: 'DSP',
    statusOptions: ['open', 'in-transit', 'completed', 'cancelled'],
    statusFilterTabs: statusTabs(t, ['open', 'in-transit', 'completed', 'cancelled']),
    columns: [
      { key: 'id', label: t('sales.col_dispatch_number') },
      { key: 'route', label: t('sales.col_route') },
      { key: 'vehicle', label: t('sales.col_vehicle') },
      { key: 'status', label: t('sales.col_status'), render: (r) => <StatusBadge status={String(r.status)} /> },
    ],
    searchKeys: ['id', 'route', 'vehicle'],
    kpi: (rows) => docKpi(t, rows, t('sales.dispatch_title'), formatMoney, formatCount),
    list: listDispatches,
    create: createDispatch,
    update: updateDispatch,
    delete: (state, id) => deleteFromState(state, 'dispatches', id),
    customerField: false,
  };
}

export function getReturnsConfig(
  t: TranslateFn,
  formatMoney: MoneyFormatter,
  formatCount: CountFormatter = String,
): SalesDocumentConfig {
  return {
    title: t('sales.returns_title'),
    subtitle: t('sales.returns_subtitle'),
    addLabel: t('sales.new_return'),
    idPrefix: 'SR',
    statusOptions: ['draft', 'approved', 'processed', 'rejected'],
    statusFilterTabs: statusTabs(t, ['draft', 'approved', 'processed', 'rejected']),
    columns: [
      { key: 'id', label: t('sales.col_return_number') },
      { key: 'customer', label: t('sales.col_customer') },
      { key: 'invoiceId', label: t('sales.col_invoice') },
      { key: 'status', label: t('sales.col_status'), render: (r) => <StatusBadge status={String(r.status)} /> },
    ],
    searchKeys: ['id', 'customer', 'invoiceId'],
    showLineItems: true,
    kpi: (rows) => docKpi(t, rows, t('sales.returns_title'), formatMoney, formatCount),
    list: listReturns,
    create: createReturn,
    update: updateReturn,
    delete: (state, id) => deleteFromState(state, 'salesReturns', id),
  };
}

export function getPaymentsConfig(
  t: TranslateFn,
  formatMoney: MoneyFormatter,
  formatCount: CountFormatter = String,
): SalesDocumentConfig {
  return {
    title: t('sales.payments_title'),
    subtitle: t('sales.payments_subtitle'),
    addLabel: t('sales.record_payment'),
    idPrefix: 'PAY',
    statusOptions: ['pending', 'completed', 'failed', 'refunded'],
    statusFilterTabs: statusTabs(t, ['pending', 'completed', 'failed', 'refunded']),
    columns: [
      { key: 'id', label: t('sales.col_payment_number') },
      { key: 'customer', label: t('sales.col_customer') },
      { key: 'amount', label: t('sales.col_amount'), render: (r) => formatMoney(Number(r.amount ?? r.total ?? 0)) },
      { key: 'method', label: t('common.method') },
      { key: 'status', label: t('sales.col_status'), render: (r) => <StatusBadge status={String(r.status)} /> },
    ],
    searchKeys: ['id', 'customer'],
    kpi: (rows) => docKpi(t, rows, t('sales.payments_title'), formatMoney, formatCount),
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
}

export function listInvoices(state: AppState) {
  return Array.isArray(state.invoices) ? [...state.invoices] : [];
}

export function getInvoicesConfig(
  t: TranslateFn,
  formatMoney: MoneyFormatter,
  formatCount: CountFormatter = String,
): SalesDocumentConfig {
  return {
    title: t('sales.invoices_title'),
    subtitle: t('sales.invoices_subtitle'),
    addLabel: t('sales.new_invoice'),
    idPrefix: 'INV',
    statusOptions: ['draft', 'pending', 'paid', 'overdue', 'cancelled'],
    statusFilterTabs: statusTabs(t, ['draft', 'pending', 'paid', 'overdue', 'cancelled']),
    columns: [
      { key: 'id', label: t('sales.col_invoice_number') },
      { key: 'customerId', label: t('sales.col_customer') },
      { key: 'date', label: t('sales.col_date') },
      { key: 'amount', label: t('sales.col_amount'), render: (r) => formatMoney(Number(r.amount ?? 0)) },
      { key: 'status', label: t('sales.col_status'), render: (r) => <StatusBadge status={String(r.status)} /> },
    ],
    searchKeys: ['id'],
    showLineItems: true,
    kpi: (rows) => {
      const totalDue = rows.reduce((s, r) => s + Number(r.due ?? 0), 0);
      const overdueCount = rows.filter((r) => String(r.status).toLowerCase() === 'overdue').length;
      return [
        { key: 'total', label: t('sales.kpi_total_invoices'), value: formatCount(rows.length) },
        { key: 'due', label: t('sales.kpi_outstanding'), value: formatMoney(totalDue) },
        { key: 'overdue', label: t('sales.kpi_overdue'), value: formatCount(overdueCount), alert: overdueCount > 0 },
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
}
