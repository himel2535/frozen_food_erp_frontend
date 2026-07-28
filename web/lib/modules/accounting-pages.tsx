'use client';

import { DedicatedModule } from '@/components/modules/shared/DedicatedModule';
import { getLegacyParityConfig } from '@/lib/modules/legacy-parity-configs';

function cfg(id: string) {
  return getLegacyParityConfig(id);
}

export function DuesPage() { return <DedicatedModule config={cfg('accounting-dues')} />; }
export function ReceivablesPage() { return <DedicatedModule config={cfg('accounting-receivables')} />; }
export function PayablesPage() { return <DedicatedModule config={cfg('accounting-payables')} />; }
export function JournalsPage() { return <DedicatedModule config={cfg('accounting-journals')} />; }
export function LedgerPage() { return <DedicatedModule config={cfg('accounting-ledger')} />; }
export function TrialPage() { return <DedicatedModule config={cfg('accounting-trial')} />; }
export function PlPage() { return <DedicatedModule config={cfg('accounting-pl')} />; }
export function BalancePage() { return <DedicatedModule config={cfg('accounting-balance')} />; }
