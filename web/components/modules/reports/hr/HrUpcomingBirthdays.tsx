'use client';

import { Icon } from '@iconify/react';
import { useAppStore } from '@/lib/state/app-store';
import { ReportDataTable } from '@/components/modules/reports/shared/ReportDataTable';
import { formatDisplayDate, type HrBirthdayRow } from '@/components/modules/reports/hr/hr-report-utils';

export function HrUpcomingBirthdays({
  rows,
  onPrint,
}: {
  rows: HrBirthdayRow[];
  onPrint?: () => void;
}) {
  const t = useAppStore((s) => s.t);

  return (
    <ReportDataTable
      title={t('reports.hr_upcoming_birthdays')}
      icon={<Icon icon="fluent-color:gift-24" width={22} height={22} className="shrink-0" />}
      onPrint={onPrint}
      printLabel={t('reports.print_section')}
      rows={rows}
      rowKey={(row) => row.id}
      emptyMessage={t('reports.hr_no_birthdays')}
      columns={[
        { key: 'employeeId', label: t('reports.hr_col_employee_id'), render: (row) => <span className="font-semibold text-slate-700">{row.employeeId}</span> },
        { key: 'name', label: t('reports.hr_col_name'), render: (row) => <span className="font-semibold text-slate-800">{row.name}</span> },
        { key: 'department', label: t('reports.hr_col_department'), render: (row) => row.department },
        { key: 'birthDate', label: t('reports.hr_col_birth_date'), render: (row) => formatDisplayDate(row.birthDate) },
      ]}
    />
  );
}
