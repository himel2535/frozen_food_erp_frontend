import { ReportsSalesPage } from '@/lib/modules/reports-pages';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage(['salesOrders', 'invoices', 'customers'], <ReportsSalesPage />);
}
