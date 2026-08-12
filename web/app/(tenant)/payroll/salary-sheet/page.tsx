import { SalarySheetPage } from '@/components/modules/payroll/salary-sheet/SalarySheetPage';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage('salarySheet', <SalarySheetPage />);
}
