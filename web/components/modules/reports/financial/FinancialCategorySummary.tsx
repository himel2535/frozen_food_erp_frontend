'use client';

import { useMemo } from 'react';
import { Icon } from '@iconify/react';
import { useAppStore } from '@/lib/state/app-store';
import { formatCurrency } from '@/lib/services/domain-service';
import { ReportDataTable } from '@/components/modules/reports/shared/ReportDataTable';
import type { FinancialCategorySummaryRow } from '@/components/modules/reports/financial/financial-report-utils';

const TOTAL_ROW_KEY = '__total__';

function isTotalRow(row: FinancialCategorySummaryRow) {
  return row.category === TOTAL_ROW_KEY;
}

export function FinancialCategorySummary({
  rows,
  onPrint,
}: {
  rows: FinancialCategorySummaryRow[];
  onPrint?: () => void;
}) {
  const t = useAppStore((s) => s.t);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          revenue: acc.revenue + row.revenue,
          expenses: acc.expenses + row.expenses,
          net: acc.net + row.net,
        }),
        { revenue: 0, expenses: 0, net: 0 },
      ),
    [rows],
  );

  const displayRows = useMemo(() => {
    if (!rows.length) return rows;
    return [
      ...rows,
      {
        category: TOTAL_ROW_KEY,
        revenue: totals.revenue,
        expenses: totals.expenses,
        net: totals.net,
      },
    ];
  }, [rows, totals]);

  return (
    <ReportDataTable
      title={t('reports.financial_category_summary')}
      icon={<Icon icon="fluent-color:clipboard-data-bar-24" width={22} height={22} className="shrink-0" />}
      onPrint={onPrint}
      printLabel={t('reports.print_section')}
      rows={displayRows}
      rowKey={(row) => row.category}
      emptyMessage={t('reports.financial_no_records')}
      rowClassName={(row) => (isTotalRow(row) ? 'bg-slate-50/80 border-t border-slate-100 font-extrabold' : '')}
      columns={[
        {
          key: 'category',
          label: t('reports.financial_col_category'),
          render: (row) => (
            <span className={isTotalRow(row) ? 'font-extrabold text-slate-800' : 'font-semibold text-slate-800'}>
              {isTotalRow(row) ? t('reports.financial_total') : row.category}
            </span>
          ),
        },
        {
          key: 'revenue',
          label: t('reports.financial_col_revenue'),
          align: 'right',
          render: (row) => (
            <span className="tabular-nums">{row.revenue > 0 ? formatCurrency(row.revenue) : isTotalRow(row) ? formatCurrency(row.revenue) : '—'}</span>
          ),
        },
        {
          key: 'expenses',
          label: t('reports.financial_col_expenses'),
          align: 'right',
          render: (row) => (
            <span className="tabular-nums">{row.expenses > 0 ? formatCurrency(row.expenses) : isTotalRow(row) ? formatCurrency(row.expenses) : '—'}</span>
          ),
        },
        {
          key: 'net',
          label: t('reports.financial_col_net'),
          align: 'right',
          render: (row) => (
            <span className={`font-bold tabular-nums ${row.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(row.net)}
            </span>
          ),
        },
      ]}
    />
  );
}
