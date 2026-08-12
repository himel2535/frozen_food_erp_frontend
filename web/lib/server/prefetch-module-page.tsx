import { ModuleInitialDataProvider, type ModuleInitialRows } from '@/components/providers/ModuleInitialDataProvider';
import { ServerSnapshotHydrator } from '@/components/providers/ServerSnapshotHydrator';
import {
  isModuleApiMode,
  isMongoDbBackend,
  type ApiModule,
} from '@/lib/config/data-source';
import { fetchModulesSnapshot } from '@/lib/server/fetch-modules';

/** Server-side prefetch wrapper — seeds client cache before interactive module mounts. */
export async function prefetchModulePage(
  modules: ApiModule | ApiModule[],
  children: React.ReactNode,
  revalidateSeconds = 30,
) {
  const modList = Array.isArray(modules) ? modules : [modules];
  const shouldFetch = isMongoDbBackend() && modList.some((mod) => isModuleApiMode(mod));

  let snapshot: ModuleInitialRows | null = null;
  if (shouldFetch) {
    const active = modList.filter((mod) => isModuleApiMode(mod));
    snapshot = await fetchModulesSnapshot(active, revalidateSeconds);
  }

  return (
    <>
      {snapshot && Object.keys(snapshot).length > 0 ? (
        <ServerSnapshotHydrator snapshot={snapshot} />
      ) : null}
      <ModuleInitialDataProvider rows={snapshot}>
        {children}
      </ModuleInitialDataProvider>
    </>
  );
}
