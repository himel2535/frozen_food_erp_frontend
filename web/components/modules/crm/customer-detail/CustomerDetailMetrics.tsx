'use client';

import { Icon } from '@iconify/react';
import {
  CD_METRIC_LABEL,
  CD_METRIC_VALUE,
} from '@/components/modules/crm/customer-detail/customer-detail-styles';
import { formatMoney } from '@/lib/services/sales-service';

type Metrics = {
  totalSales: number;
  totalPaid: number;
  totalDue: number;
  totalOrders: number;
  avgOrderValue: number;
  creditLimit: number;
  creditRemaining: number;
};

const METRIC_CONFIG = [
  { key: 'totalSales', label: 'Total Sales', sub: 'This Year', icon: 'flat-color-icons:line-chart' },
  { key: 'totalPaid', label: 'Total Paid', sub: 'This Year', icon: 'flat-color-icons:paid' },
  { key: 'totalDue', label: 'Total Due', sub: 'Overdue', icon: 'flat-color-icons:document', alert: true },
  { key: 'totalOrders', label: 'Total Orders', sub: 'All Time', icon: 'flat-color-icons:shop' },
  { key: 'avgOrderValue', label: 'Average Order Value', sub: '', icon: 'flat-color-icons:pie-chart' },
  { key: 'creditLimit', label: 'Credit Limit', sub: 'remaining', icon: 'flat-color-icons:currency-exchange' },
] as const;

export function CustomerDetailMetrics({ metrics }: { metrics: Metrics }) {
  const values: Record<string, { value: string; sub?: string; alert?: boolean }> = {
    totalSales: { value: formatMoney(metrics.totalSales), sub: 'This Year' },
    totalPaid: { value: formatMoney(metrics.totalPaid), sub: 'This Year' },
    totalDue: {
      value: formatMoney(metrics.totalDue),
      sub: metrics.totalDue > 0 ? 'Overdue' : 'Clear',
      alert: metrics.totalDue > 0,
    },
    totalOrders: { value: String(metrics.totalOrders), sub: 'All Time' },
    avgOrderValue: { value: formatMoney(metrics.avgOrderValue) },
    creditLimit: {
      value: formatMoney(metrics.creditLimit),
      sub: `Remaining: ${formatMoney(metrics.creditRemaining)}`,
    },
  };

  return (
    <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {METRIC_CONFIG.map((item) => {
        const data = values[item.key];
        const isOverdue = item.key === 'totalDue' && data.alert;
        return (
          <div
            key={item.key}
            className={`premium-card premium-shadow p-4 flex items-center justify-between gap-3 min-h-[84px] transition-all hover:border-blue-200/60 hover:shadow-md ${
              isOverdue ? 'bg-rose-50/40 border-rose-100/80' : ''
            }`}
          >
            <div className="min-w-0 flex-1">
              <span className={CD_METRIC_LABEL}>{item.label}</span>
              <div className={`${CD_METRIC_VALUE} mt-0.5 ${data.alert ? 'text-rose-600' : ''}`}>
                {data.value}
              </div>
              {data.sub ? (
                <span className={`text-xs font-bold block mt-0.5 ${data.alert ? 'text-rose-500' : 'text-slate-500'}`}>
                  {data.sub}
                </span>
              ) : null}
            </div>
            <Icon icon={item.icon} width={40} height={40} className="shrink-0" />
          </div>
        );
      })}
    </section>
  );
}
