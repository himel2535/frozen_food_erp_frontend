'use client';

import { Icon } from '@iconify/react';
import { KpiCards, type KpiCardItem } from '@/components/shared/KpiCards';
import { formatDueMoney, type SupplierPayableMetrics } from '@/lib/services/supplier-payables-service';

export function SupplierDueMetrics({ metrics }: { metrics: SupplierPayableMetrics }) {
  const items: KpiCardItem[] = [
    {
      key: 'total-payable',
      label: 'Total Payable',
      value: formatDueMoney(metrics.totalPayable),
      sub: `${metrics.supplierCount} supplier${metrics.supplierCount === 1 ? '' : 's'}`,
      icon: <Icon icon="flat-color-icons:negative-dynamic" width={38} height={38} className="shrink-0" />,
    },
    {
      key: 'overdue',
      label: 'Overdue Amount',
      value: formatDueMoney(metrics.overdueAmount),
      sub: `${metrics.overdueSupplierCount} supplier${metrics.overdueSupplierCount === 1 ? '' : 's'}`,
      icon: <Icon icon="fluent-color:alert-badge-24" width={38} height={38} className="shrink-0 text-rose-500" />,
    },
    {
      key: 'due-this-week',
      label: 'Due This Week',
      value: formatDueMoney(metrics.dueThisWeek),
      sub: `${metrics.dueThisWeekCount} supplier${metrics.dueThisWeekCount === 1 ? '' : 's'}`,
      icon: <Icon icon="flat-color-icons:clock" width={38} height={38} className="shrink-0 text-amber-500" />,
    },
    {
      key: 'paid',
      label: 'Paid This Month',
      value: formatDueMoney(metrics.paidThisMonth),
      sub: `${metrics.paymentCount} payment${metrics.paymentCount === 1 ? '' : 's'}`,
      icon: <Icon icon="flat-color-icons:currency-exchange" width={38} height={38} className="shrink-0 text-emerald-500" />,
    },
  ];

  return <KpiCards items={items} gridClassName="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2" />;
}
