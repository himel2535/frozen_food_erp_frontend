'use client';

import { DedicatedModule } from '@/components/modules/shared/DedicatedModule';
import { getLegacyParityConfig } from '@/lib/modules/legacy-parity-configs';

export function NotificationsPage() {
  return <DedicatedModule config={getLegacyParityConfig('notifications')} />;
}

export function SuperAdminPage() {
  return <DedicatedModule config={getLegacyParityConfig('super-admin')} />;
}

export function DesignSystemPage() {
  return <DedicatedModule config={getLegacyParityConfig('design-system')} />;
}
