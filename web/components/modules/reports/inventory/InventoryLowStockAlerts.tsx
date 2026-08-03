'use client';

import { Icon } from '@iconify/react';
import { useAppStore } from '@/lib/state/app-store';
import { formatCurrency } from '@/lib/services/domain-service';
import { ReportDataTable } from '@/components/modules/reports/shared/ReportDataTable';
import type { InventoryReportRow } from '@/components/modules/reports/inventory/inventory-report-utils';

export function InventoryLowStockAlerts({
  rows,
  onPrint,
}: {
  rows: InventoryReportRow[];
  onPrint?: () => void;
}) {
  const t = useAppStore((s) => s.t);

  if (!rows.length) return null;

  return (
    <ReportDataTable
      title={t('reports.inventory_low_stock_alerts')}
      icon={<Icon icon="fluent-color:alert-badge-24" width={22} height={22} className="shrink-0" />}
      onPrint={onPrint}
      printLabel={t('reports.print_section')}
      rows={rows}
      rowKey={(row) => row.id}
      emptyMessage={t('reports.inventory_no_records')}
      columns={[
        { key: 'sku', label: t('reports.inventory_col_sku'), render: (row) => <span className="font-bold text-slate-800">{row.sku}</span> },
        { key: 'name', label: t('reports.inventory_col_product'), render: (row) => <span className="font-semibold text-slate-700">{row.name}</span> },
        {
          key: 'qty',
          label: t('reports.inventory_col_qty'),
          align: 'right',
          render: (row) => <span className="font-extrabold text-rose-600 tabular-nums">{row.qty}</span>,
        },
        {
          key: 'reorderLevel',
          label: t('reports.inventory_col_reorder'),
          align: 'right',
          render: (row) => <span className="tabular-nums text-slate-600">{row.reorderLevel}</span>,
        },
        {
          key: 'value',
          label: t('reports.inventory_col_value'),
          align: 'right',
          render: (row) => <span className="font-semibold tabular-nums">{formatCurrency(row.value)}</span>,
        },
      ]}
    />
  );
}
