import { StockOutPage } from '@/components/modules/inventory/StockOutPage';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage('stockOut', <StockOutPage />);
}
