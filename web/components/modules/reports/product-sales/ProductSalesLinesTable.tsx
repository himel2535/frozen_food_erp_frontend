'use client';

import { Icon } from '@iconify/react';
import { useAppStore } from '@/lib/state/app-store';
import { formatCurrency } from '@/lib/services/domain-service';
import { ReportDataTable } from '@/components/modules/reports/shared/ReportDataTable';
import {
  formatProductSaleDate,
  type ProductSaleLine,
} from '@/components/modules/reports/product-sales/product-sales-report-utils';

export function ProductSalesLinesTable({
  rows,
  onPrint,
  printLabel,
}: {
  rows: ProductSaleLine[];
  onPrint?: () => void;
  printLabel?: string;
}) {
  const t = useAppStore((s) => s.t);

  return (
    <ReportDataTable
      title={t('reports.product_sales_lines')}
      icon={<Icon icon="fluent-color:table-24" width={22} height={22} className="shrink-0" />}
      onPrint={onPrint}
      printLabel={printLabel ?? t('reports.print_section')}
      rows={rows}
      rowKey={(row) => row.id}
      emptyMessage={t('reports.product_sales_no_records')}
      columns={[
        {
          key: 'date',
          label: t('reports.product_sales_col_date'),
          render: (row) => (
            <span className="font-semibold text-slate-700">{formatProductSaleDate(row.date)}</span>
          ),
        },
        {
          key: 'invoice',
          label: t('reports.product_sales_col_invoice'),
          render: (row) => (
            <span className="font-bold text-blue-600">{row.invoiceRef || '—'}</span>
          ),
        },
        {
          key: 'customer',
          label: t('reports.product_sales_col_customer'),
          render: (row) => (
            <span className="font-semibold text-slate-800 truncate">{row.customer || '—'}</span>
          ),
        },
        {
          key: 'qty',
          label: t('reports.product_sales_col_qty'),
          align: 'right',
          render: (row) => <span className="tabular-nums font-bold text-slate-800">{row.qty}</span>,
        },
        {
          key: 'unit',
          label: t('reports.product_sales_col_unit'),
          align: 'right',
          render: (row) => (
            <span className="tabular-nums font-semibold text-slate-700">{formatCurrency(row.unitPrice)}</span>
          ),
        },
        {
          key: 'revenue',
          label: t('reports.product_sales_col_revenue'),
          align: 'right',
          render: (row) => (
            <span className="tabular-nums font-extrabold text-slate-900">{formatCurrency(row.revenue)}</span>
          ),
        },
      ]}
    />
  );
}
