import { ModuleInitialDataProvider, type ModuleInitialRows } from '@/components/providers/ModuleInitialDataProvider';
import type { ApiModule } from '@/lib/config/data-source';

/**
 * Tenant list pages — do not await Railway before HTML.
 * `usePaginatedApiResource` is the source of truth on the client.
 */
export async function prefetchModulePage(
  _modules: ApiModule | ApiModule[],
  children: React.ReactNode,
  _revalidateSeconds = 30,
  _limit?: number,
) {
  const snapshot: ModuleInitialRows | null = null;

  return (
    <ModuleInitialDataProvider rows={snapshot}>
      {children}
    </ModuleInitialDataProvider>
  );
}
