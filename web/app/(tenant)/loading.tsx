import { ModuleRouteSkeleton } from '@/components/shared/ModuleListSkeleton';

/** KPI + table skeleton while the next page chunk loads. Filters render with the page. */
export default function TenantLoading() {
  return <ModuleRouteSkeleton />;
}
