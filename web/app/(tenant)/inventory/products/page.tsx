import { ProductsPage } from '@/components/modules/inventory/ProductsPage';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage('products', <ProductsPage />);
}
