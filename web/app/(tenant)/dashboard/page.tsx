import { DashboardView } from '@/components/modules/DashboardView';
import { isMongoDbBackend } from '@/lib/config/data-source';
import { fetchDashboardSnapshot } from '@/lib/server/dashboard-snapshot';

export default async function DashboardPage() {
  const payload = isMongoDbBackend() ? await fetchDashboardSnapshot() : null;

  return <DashboardView serverPayload={payload} />;
}
