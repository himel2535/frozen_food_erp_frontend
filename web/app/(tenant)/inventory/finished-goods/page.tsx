import { FinishedGoodsPage } from '@/components/modules/inventory/FinishedGoodsPage';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage('finishedGoods', <FinishedGoodsPage />, 30, 10);
}
