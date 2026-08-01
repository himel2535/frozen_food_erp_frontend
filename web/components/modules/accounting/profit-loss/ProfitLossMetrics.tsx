'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import { formatPlMoney, formatPlPercent, type ProfitLossMetrics } from '@/lib/services/profit-loss-service';

function MetricCard({
  label,
  value,
  sub,
  valueClassName,
  cardClassName,
  subClassName,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  valueClassName?: string;
  cardClassName: string;
  subClassName?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border p-3.5 flex items-center justify-between gap-3 transition-all hover:shadow-md min-h-[72px] ${cardClassName}`}>
      <div className="flex flex-col justify-center gap-0.5 min-w-0 flex-1">
        <span className="text-xs font-bold text-slate-500 tracking-wide leading-tight">{label}</span>
        <span className={`text-lg font-extrabold tracking-tight leading-tight mt-0.5 ${valueClassName ?? 'text-slate-900'}`}>{value}</span>
        {sub ? <span className={`text-[11px] font-medium block truncate ${subClassName ?? 'text-slate-500'}`}>{sub}</span> : null}
      </div>
      <div className="flex items-center justify-center shrink-0">{icon}</div>
    </div>
  );
}

export function ProfitLossMetrics({ metrics }: { metrics: ProfitLossMetrics }) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      <MetricCard
        label="Total Revenue"
        value={formatPlMoney(metrics.totalRevenue)}
        cardClassName="bg-slate-50/90 border-slate-200/80"
        icon={
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-500 text-white">
            <TrendingUp className="h-5 w-5" />
          </span>
        }
      />
      <MetricCard
        label="Total Expense"
        value={formatPlMoney(metrics.totalExpense)}
        valueClassName="text-rose-600"
        cardClassName="bg-rose-50/80 border-rose-100/80"
        icon={
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-rose-500 text-white">
            <TrendingDown className="h-5 w-5" />
          </span>
        }
      />
      <MetricCard
        label="Net Profit"
        value={formatPlMoney(metrics.netProfit)}
        sub={`${formatPlPercent(metrics.profitMargin)} Profit Margin`}
        valueClassName="text-emerald-600"
        subClassName="text-emerald-600 font-bold"
        cardClassName="bg-emerald-50/80 border-emerald-100/80"
        icon={
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white text-lg font-bold">
            ৳
          </span>
        }
      />
    </section>
  );
}
