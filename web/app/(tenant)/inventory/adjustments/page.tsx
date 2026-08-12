import { AdjustmentsPage } from '@/components/modules/inventory/AdjustmentsPage';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage('stockAdjustments', <AdjustmentsPage />);
}
