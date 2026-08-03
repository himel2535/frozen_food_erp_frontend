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
  getSupplierAvatarClass,
  getSupplierInitials,
  type SupplierReportRow,
} from '@/components/modules/reports/suppliers/supplier-report-utils';

export function SupplierSummaryTable({
  rows,
  onPrint,
}: {
  rows: SupplierReportRow[];
  onPrint?: () => void;
}) {
  const t = useAppStore((s) => s.t);

  const handleView = (row: SupplierReportRow) => {
    toast.info(t('reports.suppliers_view_soon', { name: row.name }), { module: 'Reports' });
  };

  return (
    <ReportDataTable
      title={t('reports.suppliers_summary')}
      icon={<Icon icon="fluent-color:building-shop-24" width={22} height={22} className="shrink-0" />}
      onPrint={onPrint}
      printLabel={t('reports.print_section')}
      rows={rows}
      rowKey={(row) => row.id}
      emptyMessage={t('reports.suppliers_no_records')}
      paginate={10}
      paginationLabel={({ from, to, total }) => t('reports.suppliers_pagination', { from, to, total })}
      columns={({ pageOffset }) => [
        {
          key: 'sl',
          label: t('reports.suppliers_col_sl'),
          render: (_row, idx) => String(pageOffset + idx + 1),
        },
        {
          key: 'name',
          label: t('reports.suppliers_col_supplier'),
          render: (row) => (
            <span className="inline-flex items-center gap-2 min-w-0">
              <span
                className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[10px] font-extrabold ${getSupplierAvatarClass(row.name)}`}
              >
                {getSupplierInitials(row.name)}
              </span>
              <span className="truncate font-semibold text-slate-800">{row.name}</span>
            </span>
          ),
        },
        { key: 'contactPerson', label: t('reports.suppliers_col_contact_person'), render: (row) => row.contactPerson },
        { key: 'phone', label: t('reports.suppliers_col_phone'), render: (row) => row.phone || '—' },
        { key: 'email', label: t('reports.suppliers_col_email'), render: (row) => row.email || '—' },
        {
          key: 'purchases',
          label: t('reports.suppliers_col_purchases'),
          align: 'right',
          render: (row) => <span className="font-extrabold text-slate-900 tabular-nums">{formatCurrency(row.purchases)}</span>,
        },
        {
          key: 'due',
          label: t('reports.suppliers_col_payables'),
          align: 'right',
          render: (row) => (
            <span className={`font-bold tabular-nums ${row.due > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
              {formatCurrency(row.due)}
            </span>
          ),
        },
        {
          key: 'lastPurchaseDate',
          label: t('reports.suppliers_col_last_purchase'),
          render: (row) => formatDisplayDate(row.lastPurchaseDate),
        },
        {
          key: 'status',
          label: t('reports.suppliers_col_status'),
          render: (row) => (
            <StatusBadge status={row.status === 'inactive' ? 'Inactive' : 'Active'} />
          ),
        },
        {
          key: 'action',
          label: t('reports.suppliers_col_action'),
          render: (row) => (
            <button
              type="button"
              onClick={() => handleView(row)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
              aria-label={t('reports.suppliers_view')}
            >
              <Eye className="w-4 h-4" />
            </button>
          ),
        },
      ]}
    />
  );
}
