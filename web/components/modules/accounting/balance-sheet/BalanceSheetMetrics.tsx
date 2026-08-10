'use client';

import { Icon } from '@iconify/react';
import { ModuleKpiSection } from '@/components/shared/ModuleKpiSection';
import type { KpiCardItem } from '@/components/shared/KpiCards';
import { formatBsMoney, formatBsPercent, type BalanceSheetMetrics } from '@/lib/services/balance-sheet-service';

export function BalanceSheetMetrics({ metrics }: { metrics: BalanceSheetMetrics }) {
  const items: KpiCardItem[] = [
    {
      key: 'total-assets',
      label: 'Total Assets',
      value: formatBsMoney(metrics.totalAssets),
      sub: `${formatBsPercent(metrics.assetsPercent)} of total`,
      icon: <Icon icon="flat-color-icons:safe" width={38} height={38} className="shrink-0" />,
    },
    {
      key: 'total-liabilities',
      label: 'Total Liabilities',
      value: formatBsMoney(metrics.totalLiabilities),
      sub: `${formatBsPercent(metrics.liabilitiesPercent)} of total`,
      icon: <Icon icon="flat-color-icons:debt" width={38} height={38} className="shrink-0" />,
    },
    {
      key: 'total-equity',
      label: 'Total Equity',
      value: formatBsMoney(metrics.totalEquity),
      sub: `${formatBsPercent(metrics.equityPercent)} of total`,
      icon: <Icon icon="flat-color-icons:bullish" width={38} height={38} className="shrink-0" />,
    },
    {
      key: 'balance-status',
      label: 'Balance Status',
      value: metrics.isBalanced ? 'Balanced' : 'Out of balance',
      sub: 'Assets = Liabilities + Equity',
      alert: !metrics.isBalanced,
      icon: metrics.isBalanced ? (
        <Icon icon="flat-color-icons:approval" width={38} height={38} className="shrink-0" />
      ) : (
        <Icon icon="fluent-color:alert-badge-24" width={38} height={38} className="shrink-0 text-rose-500" />
      ),
    },
  ];

  return <ModuleKpiSection items={items} gridClassName="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2" />;
}
