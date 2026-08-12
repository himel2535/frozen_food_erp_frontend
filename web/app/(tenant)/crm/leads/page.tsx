import { LeadsPage } from '@/components/modules/crm/LeadsPage';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function CrmLeadsRoute() {
  return prefetchModulePage('leads', <LeadsPage />);
}
