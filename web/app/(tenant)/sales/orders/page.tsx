import { SalesOrdersPage } from '@/components/modules/sales/SalesOrdersPage';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage('salesOrders', <SalesOrdersPage />);
}
