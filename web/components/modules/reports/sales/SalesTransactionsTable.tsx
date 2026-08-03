'use client';

import { Icon } from '@iconify/react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAppStore } from '@/lib/state/app-store';
import { formatCurrency } from '@/lib/services/domain-service';
import { ReportDataTable } from '@/components/modules/reports/shared/ReportDataTable';
import {
  customerInitials,
  formatReportDate,
  paymentMethodIcon,
  type SalesReportRow,
} from '@/components/modules/reports/sales/sales-report-utils';

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
];

export function SalesTransactionsTable({
  rows,
  onPrint,
  printLabel,
}: {
  rows: SalesReportRow[];
  onPrint?: () => void;
  printLabel?: string;
}) {
  const t = useAppStore((s) => s.t);

  return (
    <ReportDataTable
      title={t('reports.sales_transactions')}
      icon={<Icon icon="fluent-color:table-24" width={22} height={22} className="shrink-0" />}
      onPrint={onPrint}
      printLabel={printLabel ?? t('reports.print_section')}
      rows={rows}
      rowKey={(row) => row.id}
      emptyMessage={t('reports.sales_no_records')}
      columns={[
        {
          key: 'date',
          label: t('reports.sales_col_date'),
          render: (row) => formatReportDate(row.date),
        },
        {
          key: 'ref',
          label: t('reports.sales_col_reference'),
          render: (row) => (
            <span className="text-blue-600 font-bold cursor-pointer hover:text-blue-700">{row.ref}</span>
          ),
        },
        {
          key: 'customer',
          label: t('reports.sales_col_customer'),
          render: (row, idx) => (
            <span className="inline-flex items-center gap-2 min-w-0">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 ${
                  AVATAR_COLORS[idx % AVATAR_COLORS.length]
                }`}
              >
                {customerInitials(row.customer)}
              </span>
              <span className="truncate font-semibold text-slate-800">{row.customer}</span>
            </span>
          ),
        },
        {
          key: 'status',
          label: t('reports.sales_col_status'),
          render: (row) => <StatusBadge status={row.status} />,
        },
        {
          key: 'paymentMethod',
          label: t('reports.sales_col_payment'),
          render: (row) => (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Icon icon={paymentMethodIcon(row.paymentMethod)} width={18} height={18} className="shrink-0" />
              {row.paymentMethod}
            </span>
          ),
        },
        {
          key: 'total',
          label: t('reports.sales_col_total'),
          align: 'right',
          render: (row) => (
            <span className="font-extrabold text-slate-900 tabular-nums">{formatCurrency(row.total)}</span>
          ),
        },
      ]}
    />
  );
}
