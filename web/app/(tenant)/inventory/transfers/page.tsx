import { TransfersPage } from '@/components/modules/inventory/TransfersPage';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage('stockTransfers', <TransfersPage />);
}
