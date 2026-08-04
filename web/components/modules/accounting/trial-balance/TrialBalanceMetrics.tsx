'use client';

import { Icon } from '@iconify/react';
import { KpiCards, type KpiCardItem } from '@/components/shared/KpiCards';
import { formatTrialMoney, type TrialBalanceMetrics } from '@/lib/services/trial-balance-service';

export function TrialBalanceMetricsCards({ metrics }: { metrics: TrialBalanceMetrics }) {
  const items: KpiCardItem[] = [
    {
      key: 'total-debit',
      label: 'Total Debit',
      value: formatTrialMoney(metrics.totalDebit),
      sub: 'Total Debit Balance',
      icon: <Icon icon="flat-color-icons:download" width={38} height={38} className="shrink-0" />,
    },
    {
      key: 'total-credit',
      label: 'Total Credit',
      value: formatTrialMoney(metrics.totalCredit),
      sub: 'Total Credit Balance',
      icon: <Icon icon="flat-color-icons:upload" width={38} height={38} className="shrink-0" />,
    },
    {
      key: 'difference',
      label: 'Difference',
      value: formatTrialMoney(metrics.difference),
      sub: metrics.isBalanced ? 'Balanced' : 'Out of balance',
      alert: !metrics.isBalanced,
      icon: <Icon icon="flat-color-icons:neutral-trading" width={38} height={38} className="shrink-0" />,
    },
    {
      key: 'accounts',
      label: 'Accounts',
      value: String(metrics.accountCount),
      sub: 'Active trial balance lines',
      icon: <Icon icon="flat-color-icons:database" width={38} height={38} className="shrink-0" />,
    },
  ];

  return <KpiCards items={items} gridClassName="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2" />;
}
