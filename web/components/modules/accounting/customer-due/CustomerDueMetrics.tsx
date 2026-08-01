'use client';

import { Icon } from '@iconify/react';
import { KpiCards, type KpiCardItem } from '@/components/shared/KpiCards';
import { formatDueMoney, type CustomerReceivableMetrics } from '@/lib/services/customer-receivables-service';

export function CustomerDueMetrics({ metrics }: { metrics: CustomerReceivableMetrics }) {
  const items: KpiCardItem[] = [
    {
      key: 'total-receivable',
      label: 'Total Receivable',
      value: formatDueMoney(metrics.totalReceivable),
      sub: `From ${metrics.customerCount} customer${metrics.customerCount === 1 ? '' : 's'}`,
      icon: <Icon icon="flat-color-icons:positive-dynamic" width={38} height={38} className="shrink-0" />,
    },
    {
      key: 'overdue',
      label: 'Overdue Amount',
      value: formatDueMoney(metrics.overdueAmount),
      sub: `${metrics.overdueCustomerCount} overdue customer${metrics.overdueCustomerCount === 1 ? '' : 's'}`,
      icon: <Icon icon="fluent-color:alert-badge-24" width={38} height={38} className="shrink-0 text-rose-500" />,
    },
    {
      key: 'due-this-week',
      label: 'Due This Week',
      value: formatDueMoney(metrics.dueThisWeek),
      sub: `${metrics.dueThisWeekCount} customer${metrics.dueThisWeekCount === 1 ? '' : 's'}`,
      icon: <Icon icon="flat-color-icons:clock" width={38} height={38} className="shrink-0 text-amber-500" />,
    },
    {
      key: 'collected',
      label: 'Collected This Month',
      value: formatDueMoney(metrics.collectedThisMonth),
      sub: `${metrics.paymentCount} payment${metrics.paymentCount === 1 ? '' : 's'}`,
      icon: <Icon icon="flat-color-icons:currency-exchange" width={38} height={38} className="shrink-0 text-emerald-500" />,
    },
  ];

  return <KpiCards items={items} gridClassName="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2" />;
}
