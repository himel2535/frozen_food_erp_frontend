import { PayablesPage } from '@/lib/modules/accounting-pages';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage(['vendorBills', 'purchasePayments', 'cashbox'], <PayablesPage />);
}
