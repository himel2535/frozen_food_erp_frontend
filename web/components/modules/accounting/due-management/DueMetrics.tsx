'use client';

import { Icon } from '@iconify/react';
import { KpiCards, type KpiCardItem } from '@/components/shared/KpiCards';
import { formatDueMoney, type DueMetrics } from '@/lib/services/due-management-service';

export function DueMetrics({ metrics }: { metrics: DueMetrics }) {
  const items: KpiCardItem[] = [
    {
      key: 'customer-due',
      label: 'Customer Due',
      value: formatDueMoney(metrics.customerDue),
      sub: `Total from ${metrics.customerCount} customer${metrics.customerCount === 1 ? '' : 's'}`,
      icon: <Icon icon="flat-color-icons:positive-dynamic" width={38} height={38} className="shrink-0" />,
    },
    {
      key: 'supplier-due',
      label: 'Supplier Due',
      value: formatDueMoney(metrics.supplierDue),
      sub: `Total from ${metrics.supplierCount} supplier${metrics.supplierCount === 1 ? '' : 's'}`,
      icon: <Icon icon="flat-color-icons:negative-dynamic" width={38} height={38} className="shrink-0" />,
    },
    {
      key: 'overdue',
      label: 'Overdue',
      value: formatDueMoney(metrics.overdueTotal),
      sub: `${metrics.overdueCount} overdue invoice${metrics.overdueCount === 1 ? '' : 's'}`,
      icon: <Icon icon="fluent-color:alert-badge-24" width={38} height={38} className="shrink-0 text-rose-500" />,
    },
  ];

  return <KpiCards items={items} gridClassName="grid grid-cols-1 md:grid-cols-3 gap-2" />;
}
