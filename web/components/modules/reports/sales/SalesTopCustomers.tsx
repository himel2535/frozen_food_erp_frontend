'use client';

import { Icon } from '@iconify/react';
import { useAppStore } from '@/lib/state/app-store';
import { formatCurrency } from '@/lib/services/domain-service';
import { SR_CARD } from '@/components/modules/reports/sales/sales-report-styles';
import { ReportSectionHeader } from '@/components/modules/reports/shared/ReportSectionHeader';
import type { SalesTopCustomer } from '@/components/modules/reports/sales/sales-report-utils';

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
];

export function SalesTopCustomers({
  customers,
  onPrint,
}: {
  customers: SalesTopCustomer[];
  onPrint?: () => void;
}) {
  const t = useAppStore((s) => s.t);

  return (
    <div className={`${SR_CARD} flex flex-col`}>
      <ReportSectionHeader
        icon={<Icon icon="fluent-color:people-24" width={24} height={24} className="shrink-0" />}
        title={t('reports.sales_top_customers')}
        onPrint={onPrint}
        printLabel={t('reports.print_section')}
      />

      <div className="space-y-2 flex-1">
        {customers.length ? (
          customers.map((customer, idx) => (
            <div
              key={customer.name}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50/80 transition-colors"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 ${
                  AVATAR_COLORS[idx % AVATAR_COLORS.length]
                }`}
              >
                {customer.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 truncate">{customer.name}</p>
                <p className="text-[11px] font-medium text-slate-500">
                  {t('reports.sales_orders_count', { n: customer.orderCount })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-extrabold text-slate-900 tabular-nums">{formatCurrency(customer.totalSpent)}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-[11px] font-medium text-slate-400 text-center py-4">{t('reports.sales_no_customers')}</p>
        )}
      </div>
    </div>
  );
}
