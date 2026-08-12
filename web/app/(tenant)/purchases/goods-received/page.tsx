import { GoodsReceivedPage } from '@/lib/modules/purchases-pages';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage('goodsReceived', <GoodsReceivedPage />);
}
