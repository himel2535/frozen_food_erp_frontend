import { redirect } from 'next/navigation';
import { StockOutPage } from '@/components/modules/inventory/StockOutPage';
import { isModuleFeatureEnabled } from '@/lib/config/module-feature-flags';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  if (!isModuleFeatureEnabled('inventoryStockOut')) {
    redirect('/inventory/products');
  }
  return prefetchModulePage('stockOut', <StockOutPage />);
}
