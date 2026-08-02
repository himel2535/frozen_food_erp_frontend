'use client';

import { DedicatedModule } from '@/components/modules/shared/DedicatedModule';

export function NotificationsPage() {
  return <DedicatedModule configId="notifications" />;
}

export function SuperAdminPage() {
  return <DedicatedModule configId="super-admin" />;
}

export function DesignSystemPage() {
  return <DedicatedModule configId="design-system" />;
}
