'use client';

import { CheckCircle2, Landmark, Scale, ShieldCheck, Wallet } from 'lucide-react';
import { formatBsMoney, formatBsPercent, type BalanceSheetMetrics } from '@/lib/services/balance-sheet-service';

function MetricCard({
  label,
  value,
  sub,
  cardClassName,
  valueClassName,
  subClassName,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  cardClassName: string;
  valueClassName?: string;
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

export function BalanceSheetMetrics({ metrics }: { metrics: BalanceSheetMetrics }) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
      <MetricCard
        label="Total Assets"
        value={formatBsMoney(metrics.totalAssets)}
        sub={`${formatBsPercent(metrics.assetsPercent)} of total`}
        cardClassName="bg-blue-50/80 border-blue-100/80"
        valueClassName="text-blue-700"
        subClassName="text-blue-600 font-bold"
        icon={<span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white"><Wallet className="h-5 w-5" /></span>}
      />
      <MetricCard
        label="Total Liabilities"
        value={formatBsMoney(metrics.totalLiabilities)}
        sub={`${formatBsPercent(metrics.liabilitiesPercent)} of total`}
        cardClassName="bg-rose-50/80 border-rose-100/80"
        valueClassName="text-rose-700"
        subClassName="text-rose-600 font-bold"
        icon={<span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-rose-500 text-white"><Landmark className="h-5 w-5" /></span>}
      />
      <MetricCard
        label="Total Equity"
        value={formatBsMoney(metrics.totalEquity)}
        sub={`${formatBsPercent(metrics.equityPercent)} of total`}
        cardClassName="bg-emerald-50/80 border-emerald-100/80"
        valueClassName="text-emerald-700"
        subClassName="text-emerald-600 font-bold"
        icon={<span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white"><Scale className="h-5 w-5" /></span>}
      />
      <MetricCard
        label="Balance Status"
        value={metrics.isBalanced ? 'Balanced' : 'Out of balance'}
        sub="Assets = Liabilities + Equity"
        cardClassName="bg-emerald-50/60 border-emerald-100/80"
        valueClassName={metrics.isBalanced ? 'text-emerald-700' : 'text-rose-700'}
        subClassName="text-slate-600"
        icon={
          <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-white ${metrics.isBalanced ? 'bg-emerald-500' : 'bg-rose-500'}`}>
            {metrics.isBalanced ? <ShieldCheck className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
          </span>
        }
      />
    </section>
  );
}
