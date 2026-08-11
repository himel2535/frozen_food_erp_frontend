import type { SalesDocumentConfig } from '@/components/modules/sales/SalesDocumentModule';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { TranslateFn } from '@/lib/i18n/resolve-label';

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
    convertLabel: t('sales.convert_to_order'),
    apiModule: 'quotations',
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
    customerField: false,
    apiModule: 'dispatch',
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
    apiModule: 'returns',
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
    customerField: true,
    apiModule: 'payments',
  };
}
