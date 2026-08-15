'use client';

import { FileBarChart } from 'lucide-react';
import { Icon } from '@iconify/react';
import { useAppStore } from '@/lib/state/app-store';
import { formatCurrency } from '@/lib/services/domain-service';
import { ReportDataTable } from '@/components/modules/reports/shared/ReportDataTable';
import { MODULE_SECONDARY_BTN } from '@/lib/ui/module-chrome-styles';
import type { ProductSalesRow } from '@/components/modules/reports/product-sales/product-sales-report-utils';

export function ProductSalesTable({
  rows,
  onPrint,
  printLabel,
  onGenerateReport,
}: {
  rows: ProductSalesRow[];
  onPrint?: () => void;
  printLabel?: string;
  onGenerateReport?: (row: ProductSalesRow) => void;
}) {
  const t = useAppStore((s) => s.t);

  return (
    <ReportDataTable
      title={t('reports.product_sales_table')}
      icon={<Icon icon="fluent-color:table-24" width={22} height={22} className="shrink-0" />}
      onPrint={onPrint}
      printLabel={printLabel ?? t('reports.print_section')}
      rows={rows}
      rowKey={(row) => row.key}
      emptyMessage={t('reports.product_sales_no_records')}
      actionsLabel={onGenerateReport ? t('reports.product_sales_generate') : undefined}
      renderActions={onGenerateReport ? (row) => (
        <button
          type="button"
          onClick={() => onGenerateReport(row)}
          className={MODULE_SECONDARY_BTN}
        >
          <FileBarChart className="w-3.5 h-3.5" />
          {t('reports.product_sales_generate')}
        </button>
      ) : undefined}
      columns={[
        {
          key: 'product',
          label: t('reports.product_sales_col_product'),
          render: (row) => (
            <span className="font-semibold text-slate-800 truncate">{row.productName}</span>
          ),
        },
        {
          key: 'sku',
          label: t('reports.product_sales_col_sku'),
          render: (row) => <span className="font-semibold text-slate-600">{row.sku || '—'}</span>,
        },
        {
          key: 'qty',
          label: t('reports.product_sales_col_qty'),
          align: 'right',
          render: (row) => <span className="tabular-nums font-bold text-slate-800">{row.qty}</span>,
        },
        {
          key: 'avg',
          label: t('reports.product_sales_col_avg'),
          align: 'right',
          render: (row) => (
            <span className="tabular-nums font-semibold text-slate-700">{formatCurrency(row.avgPrice)}</span>
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
        {
          key: 'invoices',
          label: t('reports.product_sales_col_invoices'),
          align: 'right',
          render: (row) => <span className="tabular-nums font-bold text-slate-800">{row.invoiceCount}</span>,
        },
        {
          key: 'share',
          label: t('reports.product_sales_col_share'),
          align: 'right',
          render: (row) => (
            <span className="tabular-nums font-bold text-blue-700">{row.sharePct.toFixed(1)}%</span>
          ),
        },
      ]}
    />
  );
}
