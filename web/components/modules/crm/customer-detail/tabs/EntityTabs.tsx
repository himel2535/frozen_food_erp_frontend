'use client';

import { useMemo } from 'react';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CD_CARD } from '@/components/modules/crm/customer-detail/customer-detail-styles';
import { formatDetailDate } from '@/components/modules/crm/customer-detail/customer-detail-utils';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

type MoneyFn = (value: number, options?: { decimals?: number }) => string;

function buildTxColumns(formatMoney: MoneyFn): AppTableColumn<Record<string, unknown>>[] {
  return [
    { key: 'type', label: 'Type', render: (row) => <span className="font-bold">{String(row.type)}</span> },
    { key: 'docNo', label: 'Doc No.' },
    { key: 'date', label: 'Date', render: (row) => formatDetailDate(row.date) },
    { key: 'amount', label: 'Amount', render: (row) => formatMoney(Number(row.amount ?? 0), { decimals: 2 }) },
    { key: 'paid', label: 'Paid', render: (row) => formatMoney(Number(row.paid ?? 0), { decimals: 2 }) },
    {
      key: 'due',
      label: 'Due',
      render: (row) => (
        <span className={Number(row.due) > 0 ? 'text-rose-600 font-bold' : ''}>
          {formatMoney(Number(row.due ?? 0), { decimals: 2 })}
        </span>
      ),
    },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={String(row.status)} /> },
  ];
}

export function TransactionsTab({ transactions }: { transactions: Array<Record<string, unknown>> }) {
  const { formatMoney } = useLocaleFormat();
  const columns = useMemo(() => buildTxColumns(formatMoney), [formatMoney]);
  return (
    <div className={CD_CARD}>
      <AppTable columns={columns} rows={transactions} emptyMessage="No transactions found." />
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

export function getInvoiceColumns(formatMoney: MoneyFn): AppTableColumn<Record<string, unknown>>[] {
  return [
    { key: 'id', label: 'Invoice #' },
    { key: 'date', label: 'Date', render: (row) => formatDetailDate(row.date ?? row.issueDate) },
    { key: 'amount', label: 'Amount', render: (row) => formatMoney(Number(row.amount ?? row.total ?? 0), { decimals: 2 }) },
    { key: 'paid', label: 'Paid', render: (row) => formatMoney(Number(row.paid ?? row.paidAmount ?? 0), { decimals: 2 }) },
    { key: 'due', label: 'Due', render: (row) => formatMoney(Number(row.due ?? row.dueAmount ?? 0), { decimals: 2 }) },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={String(row.status)} /> },
  ];
}

export function getOrderColumns(formatMoney: MoneyFn): AppTableColumn<Record<string, unknown>>[] {
  return [
    { key: 'id', label: 'Order #' },
    { key: 'date', label: 'Date', render: (row) => formatDetailDate(row.date) },
    { key: 'total', label: 'Total', render: (row) => formatMoney(Number(row.total ?? row.amount ?? 0), { decimals: 2 }) },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={String(row.status)} /> },
  ];
}

export function getPaymentColumns(formatMoney: MoneyFn): AppTableColumn<Record<string, unknown>>[] {
  return [
    { key: 'id', label: 'Payment #' },
    { key: 'date', label: 'Date', render: (row) => formatDetailDate(row.date) },
    { key: 'amount', label: 'Amount', render: (row) => formatMoney(Number(row.amount ?? 0), { decimals: 2 }) },
    { key: 'method', label: 'Method', render: (row) => String(row.method ?? row.paymentMethod ?? '—') },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={String(row.status ?? 'paid')} /> },
  ];
}

export function getQuoteColumns(formatMoney: MoneyFn): AppTableColumn<Record<string, unknown>>[] {
  return [
    { key: 'id', label: 'Quote #' },
    { key: 'date', label: 'Date', render: (row) => formatDetailDate(row.date) },
    { key: 'total', label: 'Total', render: (row) => formatMoney(Number(row.total ?? row.amount ?? 0), { decimals: 2 }) },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={String(row.status)} /> },
  ];
}

export function getDeliveryColumns(): AppTableColumn<Record<string, unknown>>[] {
  return [
    { key: 'id', label: 'Challan #' },
    { key: 'date', label: 'Date', render: (row) => formatDetailDate(row.date ?? row.createdAt) },
    { key: 'customer', label: 'Customer', render: (row) => String(row.customer ?? row.customerName ?? '—') },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={String(row.status ?? 'pending')} /> },
  ];
}

export function getReturnColumns(formatMoney: MoneyFn): AppTableColumn<Record<string, unknown>>[] {
  return [
    { key: 'id', label: 'Return #' },
    { key: 'date', label: 'Date', render: (row) => formatDetailDate(row.date ?? row.createdAt) },
    { key: 'amount', label: 'Amount', render: (row) => formatMoney(Number(row.amount ?? row.total ?? 0), { decimals: 2 }) },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={String(row.status ?? 'pending')} /> },
  ];
}

/** @deprecated Prefer getInvoiceColumns(formatMoney) */
export const INVOICE_COLUMNS = getInvoiceColumns((n) => `৳${n}`);
/** @deprecated Prefer getOrderColumns(formatMoney) */
export const ORDER_COLUMNS = getOrderColumns((n) => `৳${n}`);
/** @deprecated Prefer getPaymentColumns(formatMoney) */
export const PAYMENT_COLUMNS = getPaymentColumns((n) => `৳${n}`);
/** @deprecated Prefer getQuoteColumns(formatMoney) */
export const QUOTE_COLUMNS = getQuoteColumns((n) => `৳${n}`);
export const DELIVERY_COLUMNS = getDeliveryColumns();
export const RETURN_COLUMNS = getReturnColumns((n) => `৳${n}`);
