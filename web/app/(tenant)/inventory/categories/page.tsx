import { CategoriesPage } from '@/components/modules/inventory/CategoriesPage';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage('categories', <CategoriesPage />);
}
