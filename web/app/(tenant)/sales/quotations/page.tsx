import { QuotationsPage } from '@/components/modules/sales/QuotationsPage';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage('quotations', <QuotationsPage />);
}
