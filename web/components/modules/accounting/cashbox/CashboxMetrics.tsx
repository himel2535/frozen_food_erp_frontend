'use client';

import { Icon } from '@iconify/react';
import { KpiCards, type KpiCardItem } from '@/components/shared/KpiCards';
import { formatCashboxMoney, type CashboxMetrics as Metrics } from '@/lib/services/cashbox-service';

export function CashboxMetrics({ metrics }: { metrics: Metrics }) {
  const items: KpiCardItem[] = [
    {
      key: 'balance',
      label: 'Current Balance',
      value: formatCashboxMoney(metrics.currentBalance),
      sub: `As of ${metrics.asOf}`,
      icon: <Icon icon="flat-color-icons:money-transfer" width={38} height={38} className="shrink-0" />,
    },
    {
      key: 'today-in',
      label: "Today's Cash In",
      value: formatCashboxMoney(metrics.todayInTotal),
      sub: `${metrics.todayInCount} transaction${metrics.todayInCount === 1 ? '' : 's'}`,
      icon: <Icon icon="mdi:arrow-down-bold-circle" width={38} height={38} className="shrink-0 text-emerald-500" />,
    },
    {
      key: 'today-out',
      label: "Today's Cash Out",
      value: formatCashboxMoney(metrics.todayOutTotal),
      sub: `${metrics.todayOutCount} transaction${metrics.todayOutCount === 1 ? '' : 's'}`,
      icon: <Icon icon="mdi:arrow-up-bold-circle" width={38} height={38} className="shrink-0 text-rose-500" />,
    },
    {
      key: 'net-today',
      label: 'Net Today',
      value: formatCashboxMoney(metrics.netToday),
      sub: metrics.netToday >= 0 ? 'Positive flow' : 'Negative flow',
      icon: <Icon icon="fluent-color:data-trending-24" width={38} height={38} className="shrink-0 text-violet-500" />,
    },
  ];

  return <KpiCards items={items} />;
}
