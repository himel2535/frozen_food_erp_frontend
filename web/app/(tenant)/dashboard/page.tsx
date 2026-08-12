import { DashboardView } from '@/components/modules/DashboardView';
import { ServerSnapshotHydrator } from '@/components/providers/ServerSnapshotHydrator';
import { isMongoDbBackend } from '@/lib/config/data-source';
import { fetchDashboardSnapshot } from '@/lib/server/dashboard-snapshot';

export default async function DashboardPage() {
  const snapshot = isMongoDbBackend() ? await fetchDashboardSnapshot() : null;

  return (
    <>
      {snapshot ? <ServerSnapshotHydrator snapshot={snapshot} /> : null}
      <DashboardView serverSnapshot={snapshot} />
    </>
  );
}
