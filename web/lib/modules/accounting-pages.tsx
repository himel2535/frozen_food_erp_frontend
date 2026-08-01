'use client';

import { DedicatedModule } from '@/components/modules/shared/DedicatedModule';
import { DueManagementPage } from '@/components/modules/accounting/DueManagementPage';
import { CustomerDuePage } from '@/components/modules/accounting/CustomerDuePage';
import { SupplierDuePage } from '@/components/modules/accounting/SupplierDuePage';
import { getLegacyParityConfig } from '@/lib/modules/legacy-parity-configs';

function cfg(id: string) {
  return getLegacyParityConfig(id);
}

export function DuesPage() { return <DueManagementPage />; }
export { DueManagementPage };
export function ReceivablesPage() { return <CustomerDuePage />; }
export { CustomerDuePage };
export function PayablesPage() { return <SupplierDuePage />; }
export { SupplierDuePage };
export function JournalsPage() { return <DedicatedModule config={cfg('accounting-journals')} />; }
export function LedgerPage() { return <DedicatedModule config={cfg('accounting-ledger')} />; }
export function TrialPage() { return <DedicatedModule config={cfg('accounting-trial')} />; }
export function PlPage() { return <DedicatedModule config={cfg('accounting-pl')} />; }
export function BalancePage() { return <DedicatedModule config={cfg('accounting-balance')} />; }
export { CashboxPage } from '@/components/modules/accounting/CashboxPage';
