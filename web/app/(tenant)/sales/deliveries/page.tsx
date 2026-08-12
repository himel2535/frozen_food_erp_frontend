import { DeliveriesPage } from '@/components/modules/sales/DeliveriesPage';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage('deliveries', <DeliveriesPage />);
}
