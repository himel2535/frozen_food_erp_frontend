'use client';

import { Icon } from '@iconify/react';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

type DashboardSummary = {
  monthlySales: number;
  collectedThisMonth: number;
  openReceivables: number;
  overdueReceivables: number;
  averageInvoiceValue: number;
  collectionRate: number;
};

const METRICS = [
  { key: 'monthlySales', label: 'Monthly Sales', icon: 'flat-color-icons:line-chart', valueClass: 'text-slate-900' },
  { key: 'collectedThisMonth', label: 'Collected This Month', icon: 'flat-color-icons:paid', valueClass: 'text-emerald-600' },
  { key: 'collectionRate', label: 'Collection Rate', icon: 'flat-color-icons:pie-chart', valueClass: 'text-slate-900', isPercent: true },
  { key: 'averageInvoiceValue', label: 'Avg Invoice Value', icon: 'flat-color-icons:currency-exchange', valueClass: 'text-slate-900' },
] as const;

export function InvoiceDashboardMetrics({
  summary,
  loading = false,
}: {
  summary: DashboardSummary;
  loading?: boolean;
}) {
  const { formatMoney, formatPercent } = useLocaleFormat();
  const values: Record<string, string> = {
    monthlySales: formatMoney(summary.monthlySales, { decimals: 2 }),
    collectedThisMonth: formatMoney(summary.collectedThisMonth, { decimals: 2 }),
    collectionRate: formatPercent(summary.collectionRate),
    averageInvoiceValue: formatMoney(summary.averageInvoiceValue, { decimals: 2 }),
  };

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {METRICS.map((item) => (
          <div
            key={item.key}
            className="premium-card premium-shadow p-4 flex items-center justify-between gap-3 min-h-[84px] transition-all hover:border-blue-200/60 hover:shadow-md"
          >
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-500 tracking-wide leading-tight block">{item.label}</span>
              <div className={`text-lg font-extrabold tracking-tight mt-0.5 ${item.valueClass}`}>
                {loading ? (
                  <span className="app-skeleton inline-block h-6 w-16 rounded" aria-hidden="true" />
                ) : (
                  values[item.key]
                )}
              </div>
            </div>
            <Icon icon={item.icon} width={40} height={40} className="shrink-0" />
          </div>
      ))}
    </section>
  );
}
