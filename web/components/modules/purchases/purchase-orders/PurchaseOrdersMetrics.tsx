'use client';

import { Icon } from '@iconify/react';
import { KpiCards, type KpiCardItem } from '@/components/shared/KpiCards';
import { formatMoney, type getPurchaseOrderMetrics } from '@/lib/services/purchases-service';

type Metrics = ReturnType<typeof getPurchaseOrderMetrics>;

export function PurchaseOrdersMetrics({ metrics }: { metrics: Metrics }) {
  const items: KpiCardItem[] = [
    {
      key: 'spend',
      label: 'Total Procured Spend',
      value: formatMoney(metrics.totalSpend),
      sub: `Across ${metrics.totalCount} order${metrics.totalCount === 1 ? '' : 's'}`,
      icon: <Icon icon="flat-color-icons:currency-exchange" width={38} height={38} className="shrink-0" />,
    },
    {
      key: 'total',
      label: 'Total POs',
      value: String(metrics.totalCount),
      sub: 'All purchase orders',
      icon: <Icon icon="fluent-color:document-add-24" width={38} height={38} className="shrink-0" />,
    },
    {
      key: 'sent',
      label: 'Sent POs',
      value: String(metrics.sent),
      sub: 'Awaiting receipt',
      icon: <Icon icon="fluent-color:send-24" width={38} height={38} className="shrink-0" />,
    },
    {
      key: 'received',
      label: 'Received POs',
      value: String(metrics.received),
      sub: 'Completed deliveries',
      icon: <Icon icon="fluent-color:box-checkmark-24" width={38} height={38} className="shrink-0" />,
    },
    {
      key: 'draft',
      label: 'Draft POs',
      value: String(metrics.draft),
      sub: 'Not yet sent',
      icon: <Icon icon="fluent-color:document-edit-24" width={38} height={38} className="shrink-0" />,
    },
    {
      key: 'avg',
      label: 'Avg Order Value',
      value: formatMoney(metrics.avgOrderValue),
      sub: 'Per PO average',
      icon: <Icon icon="fluent-color:data-bar-vertical-ascending-24" width={38} height={38} className="shrink-0" />,
    },
  ];

  return (
    <KpiCards
      items={items}
      gridClassName="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-2"
    />
  );
}
