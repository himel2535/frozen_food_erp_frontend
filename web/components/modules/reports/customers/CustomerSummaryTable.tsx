'use client';

import { Eye } from 'lucide-react';
import { Icon } from '@iconify/react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAppStore } from '@/lib/state/app-store';
import { formatCurrency } from '@/lib/services/domain-service';
import { toast } from '@/lib/ui/feedback';
import { ReportDataTable } from '@/components/modules/reports/shared/ReportDataTable';
import {
  formatDisplayDate,
  getCustomerAvatarClass,
  getCustomerInitials,
  type CustomerReportRow,
} from '@/components/modules/reports/customers/customer-report-utils';

export function CustomerSummaryTable({
  rows,
  onPrint,
}: {
  rows: CustomerReportRow[];
  onPrint?: () => void;
}) {
  const t = useAppStore((s) => s.t);

  const handleView = (row: CustomerReportRow) => {
    toast.info(t('reports.customers_view_soon', { name: row.name }), { module: 'Reports' });
  };

  return (
    <ReportDataTable
      title={t('reports.customers_summary')}
      icon={<Icon icon="fluent-color:people-24" width={22} height={22} className="shrink-0" />}
      onPrint={onPrint}
      printLabel={t('reports.print_section')}
      rows={rows}
      rowKey={(row) => row.id}
      emptyMessage={t('reports.customers_no_records')}
      paginate={10}
      paginationLabel={({ from, to, total }) => t('reports.customers_pagination', { from, to, total })}
      columns={({ pageOffset }) => [
        {
          key: 'sl',
          label: t('reports.customers_col_sl'),
          render: (_row, idx) => String(pageOffset + idx + 1),
        },
        {
          key: 'name',
          label: t('reports.customers_col_customer'),
          render: (row) => (
            <span className="inline-flex items-center gap-2 min-w-0">
              <span
                className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[10px] font-extrabold ${getCustomerAvatarClass(row.name)}`}
              >
                {getCustomerInitials(row.name)}
              </span>
              <span className="truncate font-semibold text-slate-800">{row.name}</span>
            </span>
          ),
        },
        { key: 'company', label: t('reports.customers_col_company'), render: (row) => row.company },
        {
          key: 'contact',
          label: t('reports.customers_col_contact'),
          render: (row) => (
            <div className="text-[11px] leading-relaxed">
              <div className="font-semibold text-slate-700">{row.phone || '—'}</div>
              <div className="text-slate-500">{row.email || '—'}</div>
            </div>
          ),
        },
        {
          key: 'sales',
          label: t('reports.customers_col_sales'),
          align: 'right',
          render: (row) => <span className="font-extrabold text-slate-900 tabular-nums">{formatCurrency(row.sales)}</span>,
        },
        {
          key: 'due',
          label: t('reports.customers_col_outstanding'),
          align: 'right',
          render: (row) => (
            <span className={`font-bold tabular-nums ${row.due > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
              {formatCurrency(row.due)}
            </span>
          ),
        },
        {
          key: 'lastSaleDate',
          label: t('reports.customers_col_last_sale'),
          render: (row) => formatDisplayDate(row.lastSaleDate),
        },
        {
          key: 'status',
          label: t('reports.customers_col_status'),
          render: (row) => (
            <StatusBadge status={row.status === 'overdue' ? 'Overdue' : 'Active'} />
          ),
        },
        {
          key: 'action',
          label: t('reports.customers_col_action'),
          render: (row) => (
            <button
              type="button"
              onClick={() => handleView(row)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
              aria-label={t('reports.customers_view')}
            >
              <Eye className="w-4 h-4" />
            </button>
          ),
        },
      ]}
    />
  );
}
