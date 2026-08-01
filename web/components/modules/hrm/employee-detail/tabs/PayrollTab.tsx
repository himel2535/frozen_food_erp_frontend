'use client';

import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ED_CARD_COMPACT, ED_TITLE } from '@/components/modules/hrm/employee-detail/employee-detail-styles';
import { formatEmployeeDate } from '@/components/modules/hrm/employee-detail/employee-detail-utils';
import { formatMoney } from '@/lib/services/hrm-service';

type PayrollTabProps = {
  rows: Array<Record<string, unknown>>;
};

const COLUMNS: AppTableColumn<Record<string, unknown>>[] = [
  { key: 'id', label: 'Slip ID', headerClassName: 'bg-indigo-50' },
  { key: 'date', label: 'Pay Date', headerClassName: 'bg-indigo-50', render: (row) => formatEmployeeDate(row.date) },
  { key: 'base', label: 'Base', headerClassName: 'bg-indigo-50', render: (row) => formatMoney(Number(row.base ?? 0)) },
  { key: 'allowances', label: 'Allowances', headerClassName: 'bg-indigo-50', render: (row) => formatMoney(Number(row.allowances ?? 0)) },
  { key: 'deductions', label: 'Deductions', headerClassName: 'bg-indigo-50', render: (row) => formatMoney(Number(row.deductions ?? 0)) },
  { key: 'net', label: 'Net Pay', headerClassName: 'bg-indigo-50', render: (row) => formatMoney(Number(row.net ?? 0)) },
  {
    key: 'status',
    label: 'Status',
    headerClassName: 'bg-indigo-50',
    render: (row) => <StatusBadge status={String(row.status ?? '—')} />,
  },
];

export function PayrollTab({ rows }: PayrollTabProps) {
  return (
    <div className={`${ED_CARD_COMPACT} space-y-3`}>
      <h3 className={ED_TITLE}>Payroll Slips</h3>
      <AppTable
        columns={COLUMNS}
        rows={rows}
        emptyMessage="No payroll slips for this employee."
      />
    </div>
  );
}
