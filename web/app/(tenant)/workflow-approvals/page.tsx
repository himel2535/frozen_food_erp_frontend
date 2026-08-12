import { WorkflowApprovalsPage } from '@/lib/modules/settings-pages';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage('workflowApprovals', <WorkflowApprovalsPage />);
}
