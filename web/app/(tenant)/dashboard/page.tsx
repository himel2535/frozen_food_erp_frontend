import { DashboardViewLazy } from '@/components/modules/dashboard/DashboardViewLazy';
import { fetchDashboardSnapshot } from '@/lib/server/dashboard-snapshot';

export default async function DashboardPage() {
  const serverPayload = await fetchDashboardSnapshot();
  return <DashboardViewLazy serverPayload={serverPayload} />;
}
