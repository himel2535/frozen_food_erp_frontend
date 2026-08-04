'use client';

import { Icon } from '@iconify/react';
import { KpiCards, type KpiCardItem } from '@/components/shared/KpiCards';
import { formatPlMoney, formatPlPercent, type ProfitLossMetrics } from '@/lib/services/profit-loss-service';

export function ProfitLossMetrics({ metrics }: { metrics: ProfitLossMetrics }) {
  const items: KpiCardItem[] = [
    {
      key: 'total-revenue',
      label: 'Total Revenue',
      value: formatPlMoney(metrics.totalRevenue),
      icon: <Icon icon="flat-color-icons:line-chart" width={38} height={38} className="shrink-0" />,
    },
    {
      key: 'total-expense',
      label: 'Total Expense',
      value: formatPlMoney(metrics.totalExpense),
      icon: <Icon icon="flat-color-icons:donate" width={38} height={38} className="shrink-0" />,
    },
    {
      key: 'net-profit',
      label: 'Net Profit',
      value: formatPlMoney(metrics.netProfit),
      alert: metrics.netProfit < 0,
      icon: <Icon icon="flat-color-icons:positive-dynamic" width={38} height={38} className="shrink-0" />,
    },
    {
      key: 'profit-margin',
      label: 'Profit Margin',
      value: formatPlPercent(metrics.profitMargin),
      sub: 'Net profit as % of revenue',
      icon: <Icon icon="flat-color-icons:pie-chart" width={38} height={38} className="shrink-0" />,
    },
  ];

  return <KpiCards items={items} gridClassName="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2" />;
}
