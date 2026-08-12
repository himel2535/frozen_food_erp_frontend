'use client';

import { ReportDonutChart } from '@/components/modules/reports/shared/ReportDonutChart';
import { SR_CARD } from '@/components/modules/reports/suppliers/supplier-report-styles';
import type { SupplierBreakdownSlice } from '@/components/modules/reports/suppliers/supplier-report-utils';
import { getSliceColors } from '@/components/modules/reports/suppliers/supplier-report-utils';

export function SupplierBreakdownDonut({
  title,
  icon,
  slices,
  totalAmount,
  colorMap,
  onPrint,
  printLabel,
  totalLabel,
  formatCenter,
  prefix = 'sr',
}: {
  title: string;
  icon: string;
  slices: SupplierBreakdownSlice[];
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
      cardClass={SR_CARD}
      onPrint={onPrint}
      printLabel={printLabel}
      totalLabel={totalLabel}
      formatCenter={formatCenter}
      prefix={prefix}
      getSliceColors={getSliceColors}
    />
  );
}
