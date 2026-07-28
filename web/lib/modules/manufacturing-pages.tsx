'use client';

import { DedicatedModule } from '@/components/modules/shared/DedicatedModule';
import { getLegacyParityConfig } from '@/lib/modules/legacy-parity-configs';

function cfg(id: string) {
  return getLegacyParityConfig(id);
}

export function ManufacturingOrdersPage() { return <DedicatedModule config={cfg('manufacturing-orders')} />; }
export function BomPage() { return <DedicatedModule config={cfg('manufacturing-bom')} />; }
export function MachineMaintenancePage() { return <DedicatedModule config={cfg('manufacturing-machine-maintenance')} />; }
export function MoldManagementPage() { return <DedicatedModule config={cfg('manufacturing-mold-management')} />; }
export function WastagePage() { return <DedicatedModule config={cfg('manufacturing-wastage')} />; }
export function PackingPage() { return <DedicatedModule config={cfg('manufacturing-packing')} />; }
