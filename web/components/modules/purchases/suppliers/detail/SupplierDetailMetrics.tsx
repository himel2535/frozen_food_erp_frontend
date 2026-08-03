'use client';

import { Icon } from '@iconify/react';
import { formatDueMoney, type SupplierDetailMetrics } from '@/lib/services/suppliers-service';
import { SD_METRIC_LABEL, SD_METRIC_VALUE } from './supplier-detail-styles';

export function SupplierDetailMetrics({ metrics }: { metrics: SupplierDetailMetrics }) {
  const items = [
    {
      key: 'purchase',
      label: 'Total Purchase',
      value: formatDueMoney(metrics.totalPurchase),
      sub: `${metrics.purchaseCount} Purchases • ${metrics.itemCount} Items`,
      icon: 'flat-color-icons:shop',
    },
    {
      key: 'paid',
      label: 'Total Paid',
      value: formatDueMoney(metrics.totalPaid),
      sub: `${metrics.paymentCount} Payments`,
      icon: 'flat-color-icons:paid',
    },
    {
      key: 'payable',
      label: 'Current Payable',
      value: formatDueMoney(metrics.currentPayable),
      sub: `${metrics.billCount} Bills`,
      icon: 'flat-color-icons:currency-exchange',
    },
    {
      key: 'overdue',
      label: 'Overdue Amount',
      value: formatDueMoney(metrics.overdueAmount),
      sub: `${metrics.overdueBillCount} Overdue Bills`,
      icon: 'fluent-color:alert-24',
      alert: metrics.overdueAmount > 0,
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {items.map((item) => (
        <div
          key={item.key}
          className={`premium-card premium-shadow p-4 flex items-center justify-between gap-3 min-h-[84px] ${
            item.alert ? 'bg-rose-50/40 border-rose-100/80' : ''
          }`}
        >
          <div className="min-w-0 flex-1">
            <span className={SD_METRIC_LABEL}>{item.label}</span>
            <div className={`${SD_METRIC_VALUE} mt-0.5 ${item.alert ? 'text-rose-600' : ''}`}>{item.value}</div>
            {item.sub && <span className={`text-xs font-bold block mt-0.5 ${item.alert ? 'text-rose-500' : 'text-slate-500'}`}>{item.sub}</span>}
          </div>
          <Icon icon={item.icon} width={40} height={40} className="shrink-0" />
        </div>
      ))}
    </section>
  );
}
