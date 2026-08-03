'use client';

import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';
import { Icon } from '@iconify/react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAppStore } from '@/lib/state/app-store';
import { toast } from '@/lib/ui/feedback';
import { formatCurrency } from '@/lib/services/domain-service';
import { ReportDataTable } from '@/components/modules/reports/shared/ReportDataTable';
import {
  formatReportDate,
  supplierInitials,
  type PurchaseReportRow,
} from '@/components/modules/reports/purchases/purchase-report-utils';

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
];

export function PurchaseOrdersTable({
  rows,
  onPrint,
}: {
  rows: PurchaseReportRow[];
  onPrint?: () => void;
}) {
  const t = useAppStore((s) => s.t);

  return (
    <ReportDataTable
      title={t('reports.purchases_orders')}
      icon={<Icon icon="fluent-color:table-24" width={22} height={22} className="shrink-0" />}
      onPrint={onPrint}
      printLabel={t('reports.print_section')}
      action={
        <Link href="/purchases/orders" className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer shrink-0">
          {t('reports.purchases_view_all_pos')}
        </Link>
      }
      rows={rows}
      rowKey={(row) => row.id}
      emptyMessage={t('reports.purchases_no_records')}
      actionsLabel={t('reports.purchases_actions')}
      renderActions={() => (
        <button
          type="button"
          onClick={() => toast.info(t('reports.purchases_actions_soon'), { module: 'Reports' })}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
          aria-label={t('reports.purchases_actions')}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      )}
      columns={[
        {
          key: 'date',
          label: t('reports.purchases_col_date'),
          render: (row) => formatReportDate(row.date),
        },
        {
          key: 'ref',
          label: t('reports.purchases_col_ref'),
          render: (row) => (
            <span className="text-blue-600 font-bold cursor-pointer hover:text-blue-700">{row.ref}</span>
          ),
        },
        {
          key: 'supplier',
          label: t('reports.purchases_col_supplier'),
          render: (row, idx) => (
            <span className="inline-flex items-center gap-2 min-w-0">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 ${
                  AVATAR_COLORS[idx % AVATAR_COLORS.length]
                }`}
              >
                {supplierInitials(row.supplier)}
              </span>
              <span className="truncate font-semibold text-slate-800">{row.supplier}</span>
            </span>
          ),
        },
        {
          key: 'total',
          label: t('reports.purchases_col_total'),
          align: 'right',
          render: (row) => (
            <span className="font-extrabold text-slate-900 tabular-nums">{formatCurrency(row.total)}</span>
          ),
        },
        {
          key: 'received',
          label: t('reports.purchases_col_received'),
          align: 'right',
          render: (row) => (
            <span className="font-semibold text-emerald-700 tabular-nums">{formatCurrency(row.received)}</span>
          ),
        },
        {
          key: 'pending',
          label: t('reports.purchases_col_pending'),
          align: 'right',
          render: (row) => (
            <span className="font-semibold text-amber-700 tabular-nums">{formatCurrency(row.pending)}</span>
          ),
        },
        {
          key: 'status',
          label: t('reports.purchases_col_status'),
          render: (row) => <StatusBadge status={row.status} />,
        },
        {
          key: 'paymentStatus',
          label: t('reports.purchases_col_payment_status'),
          render: (row) => <StatusBadge status={row.paymentStatus} />,
        },
      ]}
    />
  );
}
