import { EmployeesPage } from '@/lib/modules/hrm-pages';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage('employees', <EmployeesPage />);
}
