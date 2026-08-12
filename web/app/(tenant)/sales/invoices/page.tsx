import { InvoicesPage } from '@/components/modules/sales/InvoicesPage';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage('invoices', <InvoicesPage />);
}
