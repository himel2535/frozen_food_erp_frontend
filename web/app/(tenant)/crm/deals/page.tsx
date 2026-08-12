import { DealsPage } from '@/components/modules/crm/DealsPage';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage('deals', <DealsPage />);
}
