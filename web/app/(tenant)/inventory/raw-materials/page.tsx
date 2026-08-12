import { RawMaterialsPage } from '@/components/modules/inventory/RawMaterialsPage';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage('rawMaterials', <RawMaterialsPage />);
}
