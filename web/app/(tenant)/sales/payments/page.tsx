import { PaymentsPage } from '@/components/modules/sales/PaymentsPage';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage('payments', <PaymentsPage />);
}
