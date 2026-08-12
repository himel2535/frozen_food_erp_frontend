import { UsersAdminPage } from '@/components/modules/settings/users/UsersAdminPage';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage('users', <UsersAdminPage />);
}
