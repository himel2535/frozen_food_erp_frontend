import { DispatchPage } from '@/components/modules/sales/DispatchPage';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage('dispatch', <DispatchPage />);
}
