'use client';

import { ArrowDown, ArrowUp, CheckCircle2, Scale } from 'lucide-react';
import { formatTrialMoney, type TrialBalanceMetrics } from '@/lib/services/trial-balance-service';

function MetricCard({
  label,
  value,
  sub,
  cardClassName,
  subClassName,
  icon,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  cardClassName: string;
  subClassName?: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border p-3.5 flex items-center justify-between gap-3 transition-all hover:shadow-md min-h-[72px] ${cardClassName}`}
    >
      <div className="flex flex-col justify-center gap-0.5 min-w-0 flex-1">
        <span className="text-xs font-bold text-slate-500 tracking-wide leading-tight">{label}</span>
        <span className="text-lg font-extrabold tracking-tight text-slate-900 leading-tight mt-0.5">{value}</span>
        {sub ? (
          <div className={`text-[11px] font-medium block truncate ${subClassName ?? 'text-slate-500'}`}>
            {sub}
          </div>
        ) : null}
      </div>
      <div className="flex items-center justify-center shrink-0">{icon}</div>
    </div>
  );
}

export function TrialBalanceMetricsCards({ metrics }: { metrics: TrialBalanceMetrics }) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      <MetricCard
        label="TOTAL DEBIT"
        value={formatTrialMoney(metrics.totalDebit)}
        sub="Total Debit Balance"
        subClassName="text-emerald-600 font-bold"
        cardClassName="bg-emerald-50/80 border-emerald-100/80"
        icon={
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
            <ArrowDown className="h-5 w-5" />
          </span>
        }
      />
      <MetricCard
        label="TOTAL CREDIT"
        value={formatTrialMoney(metrics.totalCredit)}
        sub="Total Credit Balance"
        subClassName="text-blue-600 font-bold"
        cardClassName="bg-blue-50/80 border-blue-100/80"
        icon={
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white">
            <ArrowUp className="h-5 w-5" />
          </span>
        }
      />
      <MetricCard
        label="DIFFERENCE"
        value={formatTrialMoney(metrics.difference)}
        sub={
          metrics.isBalanced ? (
            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Balanced
            </span>
          ) : (
            'Out of balance'
          )
        }
        subClassName={metrics.isBalanced ? undefined : 'text-rose-600 font-bold'}
        cardClassName="bg-violet-50/80 border-violet-100/80"
        icon={
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-violet-500 text-white">
            <Scale className="h-5 w-5" />
          </span>
        }
      />
    </section>
  );
}
