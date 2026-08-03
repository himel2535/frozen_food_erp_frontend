'use client';

import { Icon } from '@iconify/react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAppStore } from '@/lib/state/app-store';
import { formatCurrency } from '@/lib/services/domain-service';
import { ReportDataTable } from '@/components/modules/reports/shared/ReportDataTable';
import { formatDisplayDate, type CustomerRecentActivityRow } from '@/components/modules/reports/customers/customer-report-utils';

export function CustomerRecentActivity({
  rows,
  onPrint,
}: {
  rows: CustomerRecentActivityRow[];
  onPrint?: () => void;
}) {
  const t = useAppStore((s) => s.t);

  return (
    <ReportDataTable
      title={t('reports.customers_recent_activity')}
      icon={<Icon icon="fluent-color:receipt-24" width={22} height={22} className="shrink-0" />}
      onPrint={onPrint}
      printLabel={t('reports.print_section')}
      rows={rows}
      rowKey={(row) => row.id}
      emptyMessage={t('reports.customers_no_records')}
      columns={[
        {
          key: 'date',
          label: t('reports.customers_activity_date'),
          render: (row) => formatDisplayDate(row.date),
        },
        { key: 'ref', label: t('reports.customers_activity_invoice'), render: (row) => <span className="font-bold text-slate-800">{row.ref}</span> },
        { key: 'customer', label: t('reports.customers_col_customer'), render: (row) => row.customer },
        {
          key: 'total',
          label: t('reports.customers_activity_amount'),
          align: 'right',
          render: (row) => <span className="font-extrabold tabular-nums">{formatCurrency(row.total)}</span>,
        },
        {
          key: 'status',
          label: t('reports.customers_activity_payment'),
          render: (row) => <StatusBadge status={row.status} />,
        },
      ]}
    />
  );
}
