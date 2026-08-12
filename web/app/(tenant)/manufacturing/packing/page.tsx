import { PackingPage } from '@/lib/modules/manufacturing-pages';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage('packing', <PackingPage />);
}
