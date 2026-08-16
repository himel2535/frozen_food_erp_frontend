import { SemiFinishedProductsPage } from '@/components/modules/inventory/SemiFinishedProductsPage';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage('semiFinishedProducts', <SemiFinishedProductsPage />, 30, 10);
}
