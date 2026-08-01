'use client';

import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ED_CARD_COMPACT, ED_TITLE } from '@/components/modules/hrm/employee-detail/employee-detail-styles';
import { formatEmployeeDate } from '@/components/modules/hrm/employee-detail/employee-detail-utils';

type AttendanceTabProps = {
  rows: Array<Record<string, unknown>>;
};

const COLUMNS: AppTableColumn<Record<string, unknown>>[] = [
  { key: 'date', label: 'Date', headerClassName: 'bg-indigo-50', render: (row) => formatEmployeeDate(row.date) },
  { key: 'checkIn', label: 'Check In', headerClassName: 'bg-indigo-50' },
  { key: 'checkOut', label: 'Check Out', headerClassName: 'bg-indigo-50' },
  { key: 'workingHours', label: 'Hours', headerClassName: 'bg-indigo-50', render: (row) => String(row.workingHours ?? '—') },
  {
    key: 'status',
    label: 'Status',
    headerClassName: 'bg-indigo-50',
    render: (row) => <StatusBadge status={String(row.status ?? '—')} />,
  },
];

export function AttendanceTab({ rows }: AttendanceTabProps) {
  return (
    <div className={`${ED_CARD_COMPACT} space-y-3`}>
      <h3 className={ED_TITLE}>Attendance Records</h3>
      <AppTable
        columns={COLUMNS}
        rows={rows}
        emptyMessage="No attendance records for this employee."
      />
    </div>
  );
}
