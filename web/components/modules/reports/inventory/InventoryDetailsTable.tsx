'use client';

import Image from 'next/image';
import { Icon } from '@iconify/react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAppStore } from '@/lib/state/app-store';
import { formatCurrency } from '@/lib/services/domain-service';
import { ReportDataTable } from '@/components/modules/reports/shared/ReportDataTable';
import type { InventoryReportRow } from '@/components/modules/reports/inventory/inventory-report-utils';

export function InventoryDetailsTable({
  rows,
  onPrint,
}: {
  rows: InventoryReportRow[];
  onPrint?: () => void;
}) {
  const t = useAppStore((s) => s.t);

  return (
    <ReportDataTable
      title={t('reports.inventory_details')}
      icon={<Icon icon="fluent-color:table-24" width={22} height={22} className="shrink-0" />}
      onPrint={onPrint}
      printLabel={t('reports.print_section')}
      rows={rows}
      rowKey={(row) => row.id}
      emptyMessage={t('reports.inventory_no_records')}
      paginate={10}
      paginationLabel={({ from, to, total }) => t('reports.inventory_pagination', { from, to, total })}
      columns={({ pageOffset }) => [
        {
          key: 'sl',
          label: t('reports.inventory_col_sl'),
          render: (_row, idx) => String(pageOffset + idx + 1),
        },
        { key: 'sku', label: t('reports.inventory_col_sku'), render: (row) => <span className="font-bold text-slate-800">{row.sku}</span> },
        {
          key: 'name',
          label: t('reports.inventory_col_product'),
          render: (row) => (
            <span className="inline-flex items-center gap-2 min-w-0">
              {row.image ? (
                <Image src={row.image} alt="" width={32} height={32} className="w-8 h-8 rounded-lg object-cover shrink-0" unoptimized />
              ) : (
                <span className="w-8 h-8 rounded-lg bg-slate-100 shrink-0" />
              )}
              <span className="truncate font-semibold text-slate-800">{row.name}</span>
            </span>
          ),
        },
        {
          key: 'category',
          label: t('reports.inventory_col_category'),
          render: (row) => <StatusBadge status={row.category} />,
        },
        { key: 'warehouse', label: t('reports.inventory_col_warehouse'), render: (row) => row.warehouse },
        {
          key: 'qty',
          label: t('reports.inventory_col_qty'),
          align: 'right',
          render: (row) => <span className="font-semibold tabular-nums">{row.qty.toLocaleString('en-US')}</span>,
        },
        {
          key: 'cost',
          label: t('reports.inventory_col_cost'),
          align: 'right',
          render: (row) => <span className="tabular-nums">{formatCurrency(row.cost)}</span>,
        },
        {
          key: 'value',
          label: t('reports.inventory_col_value'),
          align: 'right',
          render: (row) => <span className="font-extrabold text-slate-900 tabular-nums">{formatCurrency(row.value)}</span>,
        },
        {
          key: 'reorderLevel',
          label: t('reports.inventory_col_reorder'),
          align: 'right',
          render: (row) => <span className="tabular-nums">{row.reorderLevel.toLocaleString('en-US')}</span>,
        },
        {
          key: 'status',
          label: t('reports.inventory_col_status'),
          render: (row) => <StatusBadge status={row.status} />,
        },
      ]}
    />
  );
}
