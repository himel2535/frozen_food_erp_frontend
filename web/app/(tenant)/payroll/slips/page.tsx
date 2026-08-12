import { PayrollSlipsPage } from '@/lib/modules/hrm-pages';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage('payrollSlips', <PayrollSlipsPage />);
}
