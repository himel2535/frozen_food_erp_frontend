'use client';

import { Icon } from '@iconify/react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAppStore } from '@/lib/state/app-store';
import { formatCurrency } from '@/lib/services/domain-service';
import { ReportDataTable } from '@/components/modules/reports/shared/ReportDataTable';
import { calcNetProfit, type FinancialReportRow } from '@/components/modules/reports/financial/financial-report-utils';

export function FinancialSummaryTable({
  rows,
  onPrint,
}: {
  rows: FinancialReportRow[];
  onPrint?: () => void;
}) {
  const t = useAppStore((s) => s.t);
  const netProfit = calcNetProfit(rows);

  return (
    <ReportDataTable
      title={t('reports.financial_summary')}
      icon={<Icon icon="fluent-color:table-24" width={22} height={22} className="shrink-0" />}
      onPrint={onPrint}
      printLabel={t('reports.print_section')}
      sectionClassName="xl:col-span-2"
      rows={rows}
      rowKey={(row) => row.id}
      emptyMessage={t('reports.financial_no_records')}
      footer={
        rows.length ? (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-emerald-50/60">
            <span className="text-xs font-extrabold text-emerald-800">{t('reports.financial_net_profit')}</span>
            <span className="text-sm font-extrabold text-emerald-700 tabular-nums">{formatCurrency(netProfit)}</span>
          </div>
        ) : null
      }
      columns={[
        { key: 'line', label: t('reports.financial_col_line'), render: (row) => <span className="font-semibold text-slate-800">{row.line}</span> },
        { key: 'category', label: t('reports.financial_col_category'), render: (row) => <StatusBadge status={row.category} /> },
        {
          key: 'amount',
          label: t('reports.financial_col_amount'),
          align: 'right',
          render: (row) => <span className="font-extrabold tabular-nums">{formatCurrency(row.amount)}</span>,
        },
        { key: 'period', label: t('reports.financial_col_period'), render: (row) => row.period },
      ]}
    />
  );
}
