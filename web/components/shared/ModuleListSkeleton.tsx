import { PageSkeleton } from '@/components/shared/PageSkeleton';

/** Matches module list order: header → KPIs → search card → table. */
export function ModuleListSkeleton() {
  return <PageSkeleton variant="module-list" label="Loading module" />;
}
