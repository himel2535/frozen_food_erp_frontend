import { StockInPage } from '@/components/modules/inventory/StockInPage';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage('stockIn', <StockInPage />);
}
