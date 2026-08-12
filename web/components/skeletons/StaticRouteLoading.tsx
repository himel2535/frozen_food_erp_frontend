import { ModuleKpiSkeleton } from '@/components/shared/ModuleKpiSkeleton';
import { ModuleTableSkeleton } from '@/components/shared/ModuleTableSkeleton';
import { getModuleKpiLayout } from '@/lib/ui/module-kpi-layout';
import { DashboardLoadingSkeleton } from '@/components/skeletons/DashboardLoadingSkeleton';
import { LeadsLoadingSkeleton } from '@/components/skeletons/LeadsLoadingSkeleton';

type StaticRouteLoadingProps = {
  route: string;
};

/** Route-specific loading shell — layout matches real page KPI grid + table columns. */
export function StaticRouteLoading({ route }: StaticRouteLoadingProps) {
  if (route === '/dashboard') {
    return <DashboardLoadingSkeleton />;
  }
  if (route === '/crm/leads') {
    return <LeadsLoadingSkeleton />;
  }

  const layout = getModuleKpiLayout(route);

  return (
    <div className="flex-1 min-h-[360px] space-y-1 flex flex-col" aria-busy="true" aria-label="Loading page">
      <ModuleKpiSkeleton count={layout.count} gridClassName={layout.gridClassName} />
      <ModuleTableSkeleton columns={layout.tableColumns} />
    </div>
  );
}
