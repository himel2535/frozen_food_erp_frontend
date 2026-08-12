import { ReturnsPage } from '@/components/modules/sales/ReturnsPage';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage('returns', <ReturnsPage />);
}
