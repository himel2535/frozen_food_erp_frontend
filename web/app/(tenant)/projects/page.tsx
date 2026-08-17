import { PmOverviewPage } from '@/components/modules/project-management/PmOverviewPage';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage('pmProjects', <PmOverviewPage />);
}
