import { redirect } from 'next/navigation';
import { StockInPage } from '@/components/modules/inventory/StockInPage';
import { isModuleFeatureEnabled } from '@/lib/config/module-feature-flags';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  if (!isModuleFeatureEnabled('inventoryStockIn')) {
    redirect('/inventory/products');
  }
  return prefetchModulePage('stockIn', <StockInPage />);
}
