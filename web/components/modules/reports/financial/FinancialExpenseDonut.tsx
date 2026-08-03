'use client';

import { SupplierBreakdownDonut } from '@/components/modules/reports/suppliers/SupplierBreakdownDonut';
import { FR_EXPENSE_SLICE } from '@/components/modules/reports/financial/financial-report-styles';
import type { FinancialBreakdownSlice } from '@/components/modules/reports/financial/financial-report-utils';

export function FinancialExpenseDonut({
  title,
  slices,
  totalAmount,
  onPrint,
  printLabel,
  totalLabel,
}: {
  title: string;
  slices: FinancialBreakdownSlice[];
  totalAmount: number;
  onPrint?: () => void;
  printLabel?: string;
  totalLabel: string;
}) {
  return (
    <SupplierBreakdownDonut
      title={title}
      icon="fluent-color:pie-single-24"
      slices={slices}
      totalAmount={totalAmount}
      colorMap={FR_EXPENSE_SLICE}
      onPrint={onPrint}
      printLabel={printLabel}
      totalLabel={totalLabel}
      prefix="fr-expense"
    />
  );
}
