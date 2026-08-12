import { PurchasePaymentsPage } from '@/lib/modules/purchases-pages';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage('purchasePayments', <PurchasePaymentsPage />);
}
