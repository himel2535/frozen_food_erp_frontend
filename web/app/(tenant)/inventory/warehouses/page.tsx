import { WarehousesPage } from '@/components/modules/inventory/WarehousesPage';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage('warehouses', <WarehousesPage />, 30, 10);
}
