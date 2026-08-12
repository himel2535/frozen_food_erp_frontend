import { RolesAdminPage } from '@/components/modules/settings/roles/RolesAdminPage';
import { prefetchModulePage } from '@/lib/server/prefetch-module-page';

export default async function Page() {
  return prefetchModulePage('roles', <RolesAdminPage />);
}
