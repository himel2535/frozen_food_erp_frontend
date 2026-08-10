'use client';

import { ModuleKpiSection } from '@/components/shared/ModuleKpiSection';
import { formatMoney } from '@/lib/services/salary-sheet-service';

export function PaymentsDueKpiBar({
  metrics,
}: {
  metrics: {
    totalEmployees: number;
    totalPayable: number;
    paidAmount: number;
    paidPercent: number;
    partialCount: number;
    unpaidCount: number;
    totalDue: number;
  };
}) {
  return (
    <ModuleKpiSection
      gridClassName="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2"
      items={[
        { key: 'employees', label: 'Total Employees', value: String(metrics.totalEmployees), iconify: 'flat-color-icons:manager' },
        { key: 'payable', label: 'Total Payable', value: formatMoney(metrics.totalPayable), sub: 'This Month', iconify: 'flat-color-icons:currency-exchange' },
        { key: 'paid', label: 'Paid Amount', value: formatMoney(metrics.paidAmount), sub: `${metrics.paidPercent.toFixed(2)}% of total`, iconify: 'flat-color-icons:paid' },
        { key: 'partial', label: 'Partial Paid', value: String(metrics.partialCount), sub: 'Employees', iconify: 'flat-color-icons:clock' },
        { key: 'unpaid', label: 'Unpaid', value: String(metrics.unpaidCount), sub: 'Employees', iconify: 'flat-color-icons:cancel' },
        { key: 'due', label: 'Total Due', value: formatMoney(metrics.totalDue), sub: 'Remaining due', iconify: 'flat-color-icons:document' },
      ]}
    />
  );
}
