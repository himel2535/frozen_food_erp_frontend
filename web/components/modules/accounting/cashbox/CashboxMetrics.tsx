'use client';

import { Icon } from '@iconify/react';
import { KpiCards, type KpiCardItem } from '@/components/shared/KpiCards';
import { formatCashboxMoney } from '@/lib/services/cashbox-service';

export function CashboxMetrics({
  currentBalance,
  asOf,
  totalIn,
  totalOut,
  netTotal,
  inCount,
  outCount,
}: {
  currentBalance: number;
  asOf: string;
  totalIn: number;
  totalOut: number;
  netTotal: number;
  inCount: number;
  outCount: number;
}) {
  const items: KpiCardItem[] = [
    {
      key: 'balance',
      label: 'Current Balance',
      value: formatCashboxMoney(currentBalance),
      sub: `As of ${asOf}`,
      icon: <Icon icon="flat-color-icons:money-transfer" width={38} height={38} className="shrink-0" />,
    },
    {
      key: 'total-in',
      label: 'Total Cash In',
      value: formatCashboxMoney(totalIn),
      sub: `${inCount} transaction${inCount === 1 ? '' : 's'}`,
      icon: <Icon icon="mdi:arrow-down-bold-circle" width={38} height={38} className="shrink-0 text-emerald-500" />,
    },
    {
      key: 'total-out',
      label: 'Total Cash Out',
      value: formatCashboxMoney(totalOut),
      sub: `${outCount} transaction${outCount === 1 ? '' : 's'}`,
      icon: <Icon icon="mdi:arrow-up-bold-circle" width={38} height={38} className="shrink-0 text-rose-500" />,
    },
    {
      key: 'net-total',
      label: 'Net Total',
      value: formatCashboxMoney(netTotal),
      sub: netTotal >= 0 ? 'Positive flow' : 'Negative flow',
      icon: <Icon icon="fluent-color:data-trending-24" width={38} height={38} className="shrink-0 text-violet-500" />,
    },
  ];

  return <KpiCards items={items} />;
}
