'use client';

import { ReportDonutChart } from '@/components/modules/reports/shared/ReportDonutChart';
import { CR_CARD } from '@/components/modules/reports/customers/customer-report-styles';
import type { CustomerBreakdownSlice } from '@/components/modules/reports/customers/customer-report-utils';
import { getSliceColors } from '@/components/modules/reports/customers/customer-report-utils';

export function CustomerBreakdownDonut({
  title,
  icon,
  slices,
  totalAmount,
  colorMap,
  onPrint,
  printLabel,
  totalLabel,
  formatCenter,
  prefix = 'cr',
}: {
  title: string;
  icon: string;
  slices: CustomerBreakdownSlice[];
  totalAmount: number;
  colorMap: Record<string, { from: string; to: string }>;
  onPrint?: () => void;
  printLabel?: string;
  totalLabel: string;
  formatCenter?: (amount: number) => string;
  prefix?: string;
}) {
  return (
    <ReportDonutChart
      title={title}
      icon={icon}
      slices={slices}
      totalAmount={totalAmount}
      colorMap={colorMap}
      cardClass={CR_CARD}
      onPrint={onPrint}
      printLabel={printLabel}
      totalLabel={totalLabel}
      formatCenter={formatCenter}
      prefix={prefix}
      getSliceColors={getSliceColors}
    />
  );
}
