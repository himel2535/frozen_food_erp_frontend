'use client';

import { usePathname } from 'next/navigation';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { ModuleKpiSkeleton } from '@/components/shared/ModuleKpiSkeleton';
import { ModuleTableSkeleton } from '@/components/shared/ModuleTableSkeleton';
import { getModuleKpiLayout } from '@/lib/ui/module-kpi-layout';

/** Matches module list order: header → KPIs → search card → table. */
export function ModuleListSkeleton() {
  return <PageSkeleton variant="module-list" label="Loading module" />;
}

/** Route transition — uses each page's KPI count + grid from module-kpi-layout. */
export function ModuleRouteSkeleton() {
  const pathname = usePathname();
  const layout = getModuleKpiLayout(pathname);

  return (
    <div className="flex-1 min-h-[360px] space-y-1 flex flex-col" aria-busy="true" aria-label="Loading page">
      <ModuleKpiSkeleton count={layout.count} gridClassName={layout.gridClassName} />
      <ModuleTableSkeleton columns={layout.tableColumns} />
    </div>
  );
}
