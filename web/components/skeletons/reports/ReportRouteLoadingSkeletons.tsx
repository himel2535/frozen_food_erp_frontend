import type { ReactNode } from 'react';
import { ModuleKpiSkeleton } from '@/components/shared/ModuleKpiSkeleton';
import { SkeletonText } from '@/components/skeletons/SkeletonText';
import { MODULE_FILTER_BAR, MODULE_FILTER_BAR_STACKED } from '@/lib/ui/module-chrome-styles';
import {
  ReportBarChartSkeleton,
  ReportDonutSkeleton,
  ReportKeyMetricsSkeleton,
  ReportLineChartSkeleton,
  ReportPanelSkeleton,
  ReportTableSkeleton,
  ReportTopListSkeleton,
} from '@/components/modules/reports/shared/ReportSectionSkeleton';
import { SR_CHARTS_ROW, SR_GRID_5 } from '@/components/modules/reports/sales/sales-report-styles';
import { PR_CHARTS_ROW } from '@/components/modules/reports/purchases/purchase-report-styles';
import { IR_ANALYTICS_ROW } from '@/components/modules/reports/inventory/inventory-report-styles';
import { CR_ANALYTICS_ROW } from '@/components/modules/reports/customers/customer-report-styles';
import { SR_ANALYTICS_ROW, SR_BOTTOM_ROW } from '@/components/modules/reports/suppliers/supplier-report-styles';
import { FR_MIDDLE_ROW, FR_BOTTOM_ROW } from '@/components/modules/reports/financial/financial-report-styles';
import { HR_CHARTS_ROW, HR_BOTTOM_ROW } from '@/components/modules/reports/hr/hr-report-styles';

function ReportFilterBarSkeleton({ filters = 4 }: { filters?: number }) {
  return (
    <div className={`${MODULE_FILTER_BAR} ${MODULE_FILTER_BAR_STACKED}`}>
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
        <SkeletonText className="h-10 flex-1 max-w-md rounded-xl" />
        <div className="flex items-center gap-2 flex-wrap">
          {Array.from({ length: filters }).map((_, index) => (
            <SkeletonText key={`report-filter-${index}`} className="h-9 w-24 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportRouteShell({
  label,
  kpiCount,
  kpiGridClassName,
  children,
}: {
  label: string;
  kpiCount: number;
  kpiGridClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex-1 min-h-[360px] space-y-2 flex flex-col" aria-busy="true" aria-label={label}>
      <ModuleKpiSkeleton count={kpiCount} gridClassName={kpiGridClassName} />
      <ReportFilterBarSkeleton filters={4} />
      {children}
    </div>
  );
}

export function SalesReportLoadingSkeleton() {
  return (
    <ReportRouteShell label="Loading sales report" kpiCount={5} kpiGridClassName={SR_GRID_5}>
      <div className={SR_CHARTS_ROW}>
        <ReportLineChartSkeleton />
        <ReportDonutSkeleton />
        <ReportTopListSkeleton />
      </div>
      <ReportTableSkeleton columns={7} />
    </ReportRouteShell>
  );
}

export function ProductSalesReportLoadingSkeleton() {
  return (
    <ReportRouteShell label="Loading product sales report" kpiCount={5} kpiGridClassName={SR_GRID_5}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        <ReportDonutSkeleton />
        <ReportDonutSkeleton />
        <ReportTopListSkeleton />
      </div>
      <ReportTableSkeleton columns={7} />
    </ReportRouteShell>
  );
}

export function PurchaseReportLoadingSkeleton() {
  return (
    <ReportRouteShell label="Loading purchase report" kpiCount={5} kpiGridClassName={SR_GRID_5}>
      <div className={PR_CHARTS_ROW}>
        <ReportLineChartSkeleton />
        <ReportDonutSkeleton />
        <ReportTopListSkeleton />
      </div>
      <ReportTableSkeleton columns={6} />
    </ReportRouteShell>
  );
}

export function InventoryReportLoadingSkeleton() {
  return (
    <ReportRouteShell label="Loading inventory report" kpiCount={4}>
      <div className={IR_ANALYTICS_ROW}>
        <ReportDonutSkeleton />
        <ReportDonutSkeleton />
        <ReportPanelSkeleton lines={4} />
      </div>
      <ReportTableSkeleton columns={6} />
      <ReportPanelSkeleton lines={4} />
    </ReportRouteShell>
  );
}

export function CustomerReportLoadingSkeleton() {
  return (
    <ReportRouteShell label="Loading customer report" kpiCount={5} kpiGridClassName={SR_GRID_5}>
      <div className={CR_ANALYTICS_ROW}>
        <ReportDonutSkeleton />
        <ReportDonutSkeleton />
        <ReportDonutSkeleton />
      </div>
      <ReportTableSkeleton columns={5} />
      <ReportPanelSkeleton lines={5} />
    </ReportRouteShell>
  );
}

export function SupplierReportLoadingSkeleton() {
  return (
    <ReportRouteShell label="Loading supplier report" kpiCount={5} kpiGridClassName={SR_GRID_5}>
      <div className={SR_ANALYTICS_ROW}>
        <ReportDonutSkeleton />
        <ReportDonutSkeleton />
        <ReportDonutSkeleton />
      </div>
      <ReportTableSkeleton columns={5} />
      <div className={SR_BOTTOM_ROW}>
        <ReportPanelSkeleton lines={5} />
        <ReportPanelSkeleton lines={4} />
      </div>
    </ReportRouteShell>
  );
}

export function FinancialReportLoadingSkeleton() {
  return (
    <ReportRouteShell label="Loading financial report" kpiCount={4}>
      <div className={FR_MIDDLE_ROW}>
        <ReportTableSkeleton columns={4} />
        <ReportLineChartSkeleton className="lg:col-span-2" />
      </div>
      <div className={FR_BOTTOM_ROW}>
        <ReportDonutSkeleton />
        <ReportPanelSkeleton lines={5} />
        <ReportPanelSkeleton lines={5} />
      </div>
    </ReportRouteShell>
  );
}

export function HrReportLoadingSkeleton() {
  return (
    <ReportRouteShell label="Loading HR report" kpiCount={4}>
      <ReportKeyMetricsSkeleton />
      <div className={HR_CHARTS_ROW}>
        <ReportDonutSkeleton />
        <ReportDonutSkeleton />
        <ReportBarChartSkeleton />
      </div>
      <ReportTableSkeleton columns={4} />
      <div className={HR_BOTTOM_ROW}>
        <ReportPanelSkeleton lines={5} />
        <ReportPanelSkeleton lines={5} />
        <ReportPanelSkeleton lines={5} />
      </div>
    </ReportRouteShell>
  );
}

const REPORT_LOADING_BY_ROUTE: Record<string, () => ReactNode> = {
  '/reports/sales': () => <SalesReportLoadingSkeleton />,
  '/reports/product-sales': () => <ProductSalesReportLoadingSkeleton />,
  '/reports/purchases': () => <PurchaseReportLoadingSkeleton />,
  '/reports/inventory': () => <InventoryReportLoadingSkeleton />,
  '/reports/customers': () => <CustomerReportLoadingSkeleton />,
  '/reports/suppliers': () => <SupplierReportLoadingSkeleton />,
  '/reports/financial': () => <FinancialReportLoadingSkeleton />,
  '/reports/hr': () => <HrReportLoadingSkeleton />,
};

export function getReportRouteLoadingSkeleton(route: string): ReactNode | null {
  const normalized = route.split('?')[0].split('#')[0].replace(/\/$/, '');
  const render = REPORT_LOADING_BY_ROUTE[normalized];
  return render ? render() : null;
}
