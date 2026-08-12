import { PurchaseRmPage } from '@/components/modules/purchases/PurchaseRmPage';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage('purchaseRm', <PurchaseRmPage />);
}
