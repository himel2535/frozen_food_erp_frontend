import { redirect } from 'next/navigation';
import { LeavePage } from '@/lib/modules/hrm-pages';
import { isModuleFeatureEnabled } from '@/lib/config/module-feature-flags';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  if (!isModuleFeatureEnabled('hrmLeave')) {
    redirect('/hrm/employees');
  }
  return prefetchModulePage('leaveRequests', <LeavePage />);
}
