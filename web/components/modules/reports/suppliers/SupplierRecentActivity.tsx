'use client';

import { Icon } from '@iconify/react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAppStore } from '@/lib/state/app-store';
import { formatCurrency } from '@/lib/services/domain-service';
import { ReportDataTable } from '@/components/modules/reports/shared/ReportDataTable';
import { formatDisplayDate, type SupplierRecentActivityRow } from '@/components/modules/reports/suppliers/supplier-report-utils';

export function SupplierRecentActivity({
  rows,
  onPrint,
}: {
  rows: SupplierRecentActivityRow[];
  onPrint?: () => void;
}) {
  const t = useAppStore((s) => s.t);

  return (
    <ReportDataTable
      title={t('reports.suppliers_recent_activity')}
      icon={<Icon icon="fluent-color:receipt-24" width={22} height={22} className="shrink-0" />}
      onPrint={onPrint}
      printLabel={t('reports.print_section')}
      sectionClassName="lg:col-span-2"
      rows={rows}
      rowKey={(row) => row.id}
      emptyMessage={t('reports.suppliers_no_records')}
      columns={[
        {
          key: 'date',
          label: t('reports.suppliers_activity_date'),
          render: (row) => formatDisplayDate(row.date),
        },
        { key: 'ref', label: t('reports.suppliers_activity_po'), render: (row) => <span className="font-bold text-slate-800">{row.ref}</span> },
        { key: 'supplier', label: t('reports.suppliers_col_supplier'), render: (row) => row.supplier },
        { key: 'items', label: t('reports.suppliers_activity_items'), render: (row) => <span className="text-[11px] text-slate-600">{row.items}</span> },
        {
          key: 'total',
          label: t('reports.suppliers_activity_amount'),
          align: 'right',
          render: (row) => <span className="font-extrabold tabular-nums">{formatCurrency(row.total)}</span>,
        },
        {
          key: 'status',
          label: t('reports.suppliers_activity_payment'),
          render: (row) => <StatusBadge status={row.status} />,
        },
      ]}
    />
  );
}
