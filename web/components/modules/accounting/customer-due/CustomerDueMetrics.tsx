'use client';

import { Icon } from '@iconify/react';
import { ModuleKpiSection } from '@/components/shared/ModuleKpiSection';
import type { KpiCardItem } from '@/components/shared/KpiCards';
import {
  formatDueMoney,
  type CustomerReceivableMetrics,
} from '@/lib/services/customer-receivables-service';

export function CustomerDueMetrics({ metrics }: { metrics: CustomerReceivableMetrics }) {
  const customerLabel = `${metrics.customerCount} customer${metrics.customerCount === 1 ? '' : 's'}`;
  const promiseLabel = `${metrics.promiseCount} payment promise${metrics.promiseCount === 1 ? '' : 's'}`;
  const paymentLabel = `${metrics.collectedTodayCount} payment${metrics.collectedTodayCount === 1 ? '' : 's'}`;

  const items: KpiCardItem[] = [
    {
      key: 'total-receivable',
      label: 'Total Receivable',
      value: formatDueMoney(metrics.totalReceivable),
      sub: `From ${customerLabel} · ${formatDueMoney(metrics.overdueAmount)} overdue`,
      icon: <Icon icon="flat-color-icons:positive-dynamic" width={38} height={38} className="shrink-0" />,
    },
    {
      key: 'expected-today',
      label: 'Expected Today',
      value: formatDueMoney(metrics.expectedToday),
      sub: `From ${promiseLabel}`,
      icon: <Icon icon="flat-color-icons:calendar" width={38} height={38} className="shrink-0" />,
    },
    {
      key: 'collected-today',
      label: 'Collected Today',
      value: formatDueMoney(metrics.collectedToday),
      sub: `From ${paymentLabel} · ${metrics.collectedTodayPct}% of expected`,
      icon: <Icon icon="flat-color-icons:paid" width={38} height={38} className="shrink-0" />,
    },
    {
      key: 'attention-needed',
      label: 'Attention Needed',
      value: `${metrics.attentionCustomers} Customers`,
      sub: `${metrics.missedFollowUps} missed follow-ups · ${metrics.brokenPromises} broken · ${metrics.criticalOverdue} critical`,
      icon: <Icon icon="fluent-color:alert-badge-24" width={38} height={38} className="shrink-0 text-rose-500" />,
    },
  ];

  return <ModuleKpiSection items={items} gridClassName="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2" />;
}
