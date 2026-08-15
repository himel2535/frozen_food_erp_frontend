'use client';

import { ReportDonutChart } from '@/components/modules/reports/shared/ReportDonutChart';
import { PSR_CARD } from '@/components/modules/reports/product-sales/product-sales-report-styles';
import {
  getProductSliceColors,
  PRODUCT_SLICE_COLORS,
  type ProductSalesSlice,
} from '@/components/modules/reports/product-sales/product-sales-report-utils';

export function ProductSalesShareDonut({
  title,
  slices,
  totalAmount,
  onPrint,
  printLabel,
  totalLabel,
}: {
  title: string;
  slices: ProductSalesSlice[];
  totalAmount: number;
  onPrint?: () => void;
  printLabel?: string;
  totalLabel: string;
}) {
  return (
    <ReportDonutChart
      title={title}
      icon="fluent-color:data-pie-24"
      slices={slices}
      totalAmount={totalAmount}
      colorMap={PRODUCT_SLICE_COLORS}
      cardClass={`${PSR_CARD} lg:col-span-2`}
      onPrint={onPrint}
      printLabel={printLabel}
      totalLabel={totalLabel}
      prefix="psr"
      getSliceColors={getProductSliceColors}
    />
  );
}
