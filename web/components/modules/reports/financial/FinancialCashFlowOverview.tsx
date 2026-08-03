'use client';

import { Icon } from '@iconify/react';
import { useAppStore } from '@/lib/state/app-store';
import { formatCurrency } from '@/lib/services/domain-service';
import { ReportSectionHeader } from '@/components/modules/reports/shared/ReportSectionHeader';
import { FR_CARD } from '@/components/modules/reports/financial/financial-report-styles';
import type { FinancialCashFlow } from '@/components/modules/reports/financial/financial-report-utils';

export function FinancialCashFlowOverview({
  cashFlow,
  onPrint,
}: {
  cashFlow: FinancialCashFlow;
  onPrint?: () => void;
}) {
  const t = useAppStore((s) => s.t);

  const items = [
    { key: 'inflow', label: t('reports.financial_cash_inflow'), value: formatCurrency(cashFlow.inflow), icon: 'flat-color-icons:download', color: 'text-emerald-600' },
    { key: 'outflow', label: t('reports.financial_cash_outflow'), value: formatCurrency(cashFlow.outflow), icon: 'flat-color-icons:upload', color: 'text-rose-600' },
    { key: 'net', label: t('reports.financial_cash_net'), value: formatCurrency(cashFlow.net), icon: 'flat-color-icons:currency-exchange', color: 'text-blue-600' },
    { key: 'closing', label: t('reports.financial_cash_closing'), value: formatCurrency(cashFlow.closing), icon: 'fluent-color:building-bank-24', color: 'text-violet-600' },
  ];

  return (
    <section className="space-y-2">
      <ReportSectionHeader
        icon={<Icon icon="fluent-color:money-hand-24" width={22} height={22} className="shrink-0" />}
        title={t('reports.financial_cash_flow')}
        onPrint={onPrint}
        printLabel={t('reports.print_section')}
      />
      <div className={`${FR_CARD} grid grid-cols-2 gap-2`}>
        {items.map((item) => (
          <div key={item.key} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 flex flex-col gap-1 min-h-[72px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-slate-500 leading-tight">{item.label}</span>
              <Icon icon={item.icon} width={22} height={22} className="shrink-0" />
            </div>
            <span className={`text-sm font-extrabold tabular-nums ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
