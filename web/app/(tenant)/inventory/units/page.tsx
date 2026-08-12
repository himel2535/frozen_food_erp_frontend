import { UnitsPage } from '@/components/modules/inventory/UnitsPage';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage('units', <UnitsPage />);
}
