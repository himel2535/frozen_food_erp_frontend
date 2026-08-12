import { ReportsCustomersPage } from '@/lib/modules/reports-pages';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage(['customers', 'salesOrders'], <ReportsCustomersPage />);
}
