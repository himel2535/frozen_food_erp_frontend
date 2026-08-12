'use client';

import { ReportDonutChart } from '@/components/modules/reports/shared/ReportDonutChart';
import { IR_CARD } from '@/components/modules/reports/inventory/inventory-report-styles';
import type { InventoryBreakdownSlice } from '@/components/modules/reports/inventory/inventory-report-utils';
import { getSliceColors } from '@/components/modules/reports/inventory/inventory-report-utils';

export function InventoryValueDonut({
  title,
  icon,
  slices,
  totalAmount,
  colorMap,
  onPrint,
  printLabel,
  totalLabel,
  prefix,
}: {
  title: string;
  icon: string;
  slices: InventoryBreakdownSlice[];
  totalAmount: number;
  colorMap: Record<string, { from: string; to: string }>;
  onPrint?: () => void;
  printLabel?: string;
  totalLabel: string;
  prefix: string;
}) {
  return (
    <ReportDonutChart
      title={title}
      icon={icon}
      slices={slices}
      totalAmount={totalAmount}
      colorMap={colorMap}
      cardClass={IR_CARD}
      onPrint={onPrint}
      printLabel={printLabel}
      totalLabel={totalLabel}
      prefix={prefix}
      getSliceColors={getSliceColors}
    />
  );
}
