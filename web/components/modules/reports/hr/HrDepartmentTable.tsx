'use client';

import { useMemo } from 'react';
import { Icon } from '@iconify/react';
import { useAppStore } from '@/lib/state/app-store';
import { ReportDataTable } from '@/components/modules/reports/shared/ReportDataTable';
import { sumDepartmentTotals, type HrDepartmentRow } from '@/components/modules/reports/hr/hr-report-utils';

const TOTAL_ROW_ID = '__total__';

function isTotalRow(row: HrDepartmentRow) {
  return row.id === TOTAL_ROW_ID;
}

export function HrDepartmentTable({
  rows,
  onPrint,
}: {
  rows: HrDepartmentRow[];
  onPrint?: () => void;
}) {
  const t = useAppStore((s) => s.t);
  const totals = sumDepartmentTotals(rows);

  const displayRows = useMemo(() => {
    if (!rows.length) return rows;
    return [
      ...rows,
      {
        id: TOTAL_ROW_ID,
        department: t('reports.hr_total'),
        total: totals.total,
        male: totals.male,
        female: totals.female,
        joined: totals.joined,
        left: totals.left,
        netChange: totals.netChange,
      },
    ];
  }, [rows, totals, t]);

  return (
    <ReportDataTable
      title={t('reports.hr_departments')}
      icon={<Icon icon="fluent-color:building-people-24" width={22} height={22} className="shrink-0" />}
      onPrint={onPrint}
      printLabel={t('reports.print_section')}
      rows={displayRows}
      rowKey={(row) => row.id}
      emptyMessage={t('reports.hr_no_records')}
      rowClassName={(row) => (isTotalRow(row) ? 'bg-slate-50/80 border-t border-slate-100 font-extrabold' : '')}
      columns={[
        {
          key: 'department',
          label: t('reports.hr_col_department'),
          render: (row) => (
            <span className={isTotalRow(row) ? 'font-extrabold text-slate-800' : 'font-semibold text-slate-800'}>
              {row.department}
            </span>
          ),
        },
        {
          key: 'total',
          label: t('reports.hr_col_total'),
          align: 'right',
          render: (row) => <span className="font-extrabold tabular-nums">{row.total}</span>,
        },
        {
          key: 'male',
          label: t('reports.hr_col_male'),
          align: 'right',
          render: (row) => <span className="tabular-nums">{row.male}</span>,
        },
        {
          key: 'female',
          label: t('reports.hr_col_female'),
          align: 'right',
          render: (row) => <span className="tabular-nums">{row.female}</span>,
        },
        {
          key: 'joined',
          label: t('reports.hr_col_joined'),
          align: 'right',
          render: (row) => <span className="tabular-nums text-emerald-600">{row.joined}</span>,
        },
        {
          key: 'left',
          label: t('reports.hr_col_left'),
          align: 'right',
          render: (row) => <span className="tabular-nums text-rose-600">{row.left}</span>,
        },
        {
          key: 'netChange',
          label: t('reports.hr_col_net_change'),
          align: 'right',
          render: (row) => (
            <span className={`font-bold tabular-nums ${row.netChange > 0 ? 'text-emerald-600' : row.netChange < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
              {row.netChange > 0 ? `+${row.netChange}` : row.netChange}
            </span>
          ),
        },
      ]}
    />
  );
}
