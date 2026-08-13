export const dynamic = 'force-dynamic';

import { TenantShell } from '@/components/layout/TenantShell';

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return <TenantShell>{children}</TenantShell>;
}
