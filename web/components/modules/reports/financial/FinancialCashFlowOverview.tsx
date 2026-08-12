'use client';

import { useMemo } from 'react';
import { Icon } from '@iconify/react';
import { useAppStore } from '@/lib/state/app-store';
import { formatCurrency } from '@/lib/services/domain-service';
import { ReportSectionHeader } from '@/components/modules/reports/shared/ReportSectionHeader';
import { ReportMetricBar } from '@/components/modules/reports/shared/ReportMetricBar';
import { buildMotionKey } from '@/components/modules/reports/shared/useReportChartIntro';
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
    { key: 'inflow', label: t('reports.financial_cash_inflow'), value: cashFlow.inflow, icon: 'flat-color-icons:download', from: '#10b981', to: '#059669' },
    { key: 'outflow', label: t('reports.financial_cash_outflow'), value: cashFlow.outflow, icon: 'flat-color-icons:upload', from: '#ef4444', to: '#dc2626' },
    { key: 'net', label: t('reports.financial_cash_net'), value: cashFlow.net, icon: 'flat-color-icons:currency-exchange', from: '#3b82f6', to: '#2563eb' },
    { key: 'closing', label: t('reports.financial_cash_closing'), value: cashFlow.closing, icon: 'fluent-color:building-bank-24', from: '#8b5cf6', to: '#7c3aed' },
  ];

  const maxValue = useMemo(
    () => Math.max(...items.map((item) => Math.abs(item.value)), 1),
    [items],
  );
  const motionKey = buildMotionKey(items.map((item) => `${item.key}:${item.value}`));

  return (
    <section className="space-y-2">
      <ReportSectionHeader
        icon={<Icon icon="fluent-color:money-hand-24" width={22} height={22} className="shrink-0" />}
        title={t('reports.financial_cash_flow')}
        onPrint={onPrint}
        printLabel={t('reports.print_section')}
      />
      <div className={`${FR_CARD} grid grid-cols-2 gap-2`}>
        {items.map((item, idx) => (
          <div key={item.key} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 flex flex-col gap-2 min-h-[84px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-slate-500 leading-tight">{item.label}</span>
              <Icon icon={item.icon} width={22} height={22} className="shrink-0" />
            </div>
            <span
              className="text-sm font-extrabold tabular-nums"
              style={{ color: item.from }}
            >
              {formatCurrency(item.value)}
            </span>
            <ReportMetricBar
              value={item.value}
              max={maxValue}
              from={item.from}
              to={item.to}
              delayMs={idx * 70}
              animateKey={motionKey}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
