'use client';

import { Icon } from '@iconify/react';
import { ModuleKpiSection } from '@/components/shared/ModuleKpiSection';
import type { KpiCardItem } from '@/components/shared/KpiCards';
import { formatDueMoney, type SupplierListMetrics } from '@/lib/services/suppliers-service';

export function SuppliersMetrics({ metrics }: { metrics: SupplierListMetrics }) {
  const items: KpiCardItem[] = [
    {
      key: 'total-suppliers',
      label: 'Total Suppliers',
      value: String(metrics.totalSuppliers),
      sub: `${metrics.activeCount} Active • ${metrics.inactiveCount} Inactive`,
      icon: <Icon icon="fluent-color:people-team-24" width={38} height={38} className="shrink-0" />,
    },
    {
      key: 'total-payable',
      label: 'Total Payable',
      value: formatDueMoney(metrics.totalPayable),
      sub: `Across ${metrics.payableSupplierCount} supplier${metrics.payableSupplierCount === 1 ? '' : 's'}`,
      icon: <Icon icon="flat-color-icons:currency-exchange" width={38} height={38} className="shrink-0" />,
    },
    {
      key: 'overdue',
      label: 'Overdue',
      value: formatDueMoney(metrics.overdueAmount),
      sub: `${metrics.overdueSupplierCount} supplier${metrics.overdueSupplierCount === 1 ? '' : 's'} need attention`,
      alert: metrics.overdueSupplierCount > 0,
      icon: <Icon icon="fluent-color:alert-24" width={38} height={38} className="shrink-0" />,
    },
    {
      key: 'due-week',
      label: 'Due This Week',
      value: formatDueMoney(metrics.dueThisWeek),
      sub: 'Next 7 days',
      icon: <Icon icon="flat-color-icons:calendar" width={38} height={38} className="shrink-0" />,
    },
  ];

  return <ModuleKpiSection items={items} gridClassName="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2" />;
}
