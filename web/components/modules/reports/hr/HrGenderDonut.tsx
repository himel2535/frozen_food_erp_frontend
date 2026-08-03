'use client';

import { useAppStore } from '@/lib/state/app-store';
import { SupplierBreakdownDonut } from '@/components/modules/reports/suppliers/SupplierBreakdownDonut';
import { HR_GENDER_SLICE } from '@/components/modules/reports/hr/hr-report-styles';
import type { HrBreakdownSlice } from '@/components/modules/reports/hr/hr-report-utils';

export function HrGenderDonut({
  slices,
  totalHeadcount,
  onPrint,
}: {
  slices: HrBreakdownSlice[];
  totalHeadcount: number;
  onPrint?: () => void;
}) {
  const t = useAppStore((s) => s.t);

  return (
    <SupplierBreakdownDonut
      title={t('reports.hr_gender_chart')}
      icon="fluent-color:people-team-24"
      slices={slices}
      totalAmount={totalHeadcount}
      colorMap={HR_GENDER_SLICE}
      onPrint={onPrint}
      printLabel={t('reports.print_section')}
      totalLabel={t('reports.hr_total_label')}
      formatCenter={(amount) => String(amount)}
      prefix="hr-gender"
    />
  );
}
