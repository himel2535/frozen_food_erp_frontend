'use client';

import { ModuleKpiSection } from '@/components/shared/ModuleKpiSection';
import { formatMoney } from '@/lib/services/salary-sheet-service';

export function SalarySheetKpiBar({
  metrics,
}: {
  metrics: {
    totalEmployees: number;
    presentManDays: number;
    absentManDays: number;
    otHours: number;
    otAmount: number;
    productionBonus: number;
    netPayable: number;
  };
}) {
  return (
    <ModuleKpiSection
      gridClassName="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-7 gap-2"
      items={[
        { key: 'employees', label: 'Total Employees', value: String(metrics.totalEmployees), iconify: 'flat-color-icons:manager' },
        { key: 'present', label: 'Present', value: `${metrics.presentManDays} Man Days`, iconify: 'flat-color-icons:ok' },
        { key: 'absent', label: 'Absent', value: `${metrics.absentManDays} Man Days`, iconify: 'flat-color-icons:clock' },
        { key: 'otHours', label: 'Total Overtime', value: `${metrics.otHours} Hours`, iconify: 'flat-color-icons:rules' },
        { key: 'otAmount', label: 'OT Amount', value: formatMoney(metrics.otAmount), iconify: 'flat-color-icons:paid' },
        { key: 'bonus', label: 'Production Bonus', value: formatMoney(metrics.productionBonus), iconify: 'flat-color-icons:sales-performance' },
        { key: 'net', label: 'Net Payable', value: formatMoney(metrics.netPayable), iconify: 'flat-color-icons:currency-exchange' },
      ]}
    />
  );
}
