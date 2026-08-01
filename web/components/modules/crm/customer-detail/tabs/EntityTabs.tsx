'use client';

import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CD_CARD } from '@/components/modules/crm/customer-detail/customer-detail-styles';
import { formatDetailDate } from '@/components/modules/crm/customer-detail/customer-detail-utils';
import { formatMoney } from '@/lib/services/sales-service';

const TX_COLUMNS: AppTableColumn<Record<string, unknown>>[] = [
  { key: 'type', label: 'Type', render: (row) => <span className="font-bold">{String(row.type)}</span> },
  { key: 'docNo', label: 'Doc No.' },
  { key: 'date', label: 'Date', render: (row) => formatDetailDate(row.date) },
  { key: 'amount', label: 'Amount', render: (row) => formatMoney(Number(row.amount ?? 0)) },
  { key: 'paid', label: 'Paid', render: (row) => formatMoney(Number(row.paid ?? 0)) },
  {
    key: 'due',
    label: 'Due',
    render: (row) => (
      <span className={Number(row.due) > 0 ? 'text-rose-600 font-bold' : ''}>
        {formatMoney(Number(row.due ?? 0))}
      </span>
    ),
  },
  { key: 'status', label: 'Status', render: (row) => <StatusBadge status={String(row.status)} /> },
];

export function TransactionsTab({ transactions }: { transactions: Array<Record<string, unknown>> }) {
  return (
    <div className={CD_CARD}>
      <AppTable columns={TX_COLUMNS} rows={transactions} emptyMessage="No transactions found." />
    </div>
  );
}

export function EntityListTab({
  rows,
  columns,
  emptyMessage,
}: {
  rows: Array<Record<string, unknown>>;
  columns: AppTableColumn<Record<string, unknown>>[];
  emptyMessage: string;
}) {
  return (
    <div className={CD_CARD}>
      <AppTable columns={columns} rows={rows} emptyMessage={emptyMessage} />
    </div>
  );
}

export const INVOICE_COLUMNS: AppTableColumn<Record<string, unknown>>[] = [
  { key: 'id', label: 'Invoice #' },
  { key: 'date', label: 'Date', render: (row) => formatDetailDate(row.date ?? row.issueDate) },
  { key: 'amount', label: 'Amount', render: (row) => formatMoney(Number(row.amount ?? row.total ?? 0)) },
  { key: 'paid', label: 'Paid', render: (row) => formatMoney(Number(row.paid ?? row.paidAmount ?? 0)) },
  { key: 'due', label: 'Due', render: (row) => formatMoney(Number(row.due ?? row.dueAmount ?? 0)) },
  { key: 'status', label: 'Status', render: (row) => <StatusBadge status={String(row.status)} /> },
];

export const ORDER_COLUMNS: AppTableColumn<Record<string, unknown>>[] = [
  { key: 'id', label: 'Order #' },
  { key: 'date', label: 'Date', render: (row) => formatDetailDate(row.date) },
  { key: 'total', label: 'Total', render: (row) => formatMoney(Number(row.total ?? row.amount ?? 0)) },
  { key: 'status', label: 'Status', render: (row) => <StatusBadge status={String(row.status)} /> },
];

export const PAYMENT_COLUMNS: AppTableColumn<Record<string, unknown>>[] = [
  { key: 'id', label: 'Payment #' },
  { key: 'date', label: 'Date', render: (row) => formatDetailDate(row.date) },
  { key: 'amount', label: 'Amount', render: (row) => formatMoney(Number(row.amount ?? 0)) },
  { key: 'method', label: 'Method', render: (row) => String(row.method ?? row.paymentMethod ?? '—') },
  { key: 'status', label: 'Status', render: (row) => <StatusBadge status={String(row.status ?? 'paid')} /> },
];

export const QUOTE_COLUMNS: AppTableColumn<Record<string, unknown>>[] = [
  { key: 'id', label: 'Quote #' },
  { key: 'date', label: 'Date', render: (row) => formatDetailDate(row.date) },
  { key: 'total', label: 'Total', render: (row) => formatMoney(Number(row.total ?? row.amount ?? 0)) },
  { key: 'status', label: 'Status', render: (row) => <StatusBadge status={String(row.status)} /> },
];

export const DELIVERY_COLUMNS: AppTableColumn<Record<string, unknown>>[] = [
  { key: 'id', label: 'Challan #' },
  { key: 'date', label: 'Date', render: (row) => formatDetailDate(row.date ?? row.createdAt) },
  { key: 'customer', label: 'Customer', render: (row) => String(row.customer ?? row.customerName ?? '—') },
  { key: 'status', label: 'Status', render: (row) => <StatusBadge status={String(row.status ?? 'pending')} /> },
];

export const RETURN_COLUMNS: AppTableColumn<Record<string, unknown>>[] = [
  { key: 'id', label: 'Return #' },
  { key: 'date', label: 'Date', render: (row) => formatDetailDate(row.date ?? row.createdAt) },
  { key: 'amount', label: 'Amount', render: (row) => formatMoney(Number(row.amount ?? row.total ?? 0)) },
  { key: 'status', label: 'Status', render: (row) => <StatusBadge status={String(row.status ?? 'pending')} /> },
];
