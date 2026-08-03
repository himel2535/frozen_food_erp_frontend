'use client';

import { useAppStore } from '@/lib/state/app-store';
import { IR_CATEGORY_SLICE } from '@/components/modules/reports/inventory/inventory-report-styles';
import { InventoryValueDonut } from '@/components/modules/reports/inventory/InventoryValueDonut';
import type { InventoryBreakdownSlice } from '@/components/modules/reports/inventory/inventory-report-utils';

export function InventoryCategoryDonut({
  slices,
  totalAmount,
  onPrint,
}: {
  slices: InventoryBreakdownSlice[];
  totalAmount: number;
  onPrint?: () => void;
}) {
  const t = useAppStore((s) => s.t);

  return (
    <InventoryValueDonut
      title={t('reports.inventory_by_category')}
      icon="fluent-color:pie-single-24"
      slices={slices}
      totalAmount={totalAmount}
      colorMap={IR_CATEGORY_SLICE}
      onPrint={onPrint}
      printLabel={t('reports.print_section')}
      totalLabel={t('reports.inventory_total_label')}
      prefix="inv-category"
    />
  );
}
