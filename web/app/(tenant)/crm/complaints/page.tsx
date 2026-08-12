import { ComplaintsPage } from '@/components/modules/crm/ComplaintsPage';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage('complaints', <ComplaintsPage />);
}
