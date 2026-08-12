import { CustomersPage } from '@/components/modules/crm/CustomersPage';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage('customers', <CustomersPage />);
}
