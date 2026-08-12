import { PosPage } from '@/components/modules/sales/PosPage';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage(['products', 'pos'], <PosPage />);
}
