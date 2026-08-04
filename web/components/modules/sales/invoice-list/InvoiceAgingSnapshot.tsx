'use client';

import { useLocaleFormat } from '@/hooks/useLocaleFormat';

type AgingSummary = {
  current: number;
  bucket0to30: number;
  bucket31to60: number;
  bucket61to90: number;
  bucket90plus: number;
};

const BUCKETS = [
  { key: 'current', label: 'Current', border: 'border-t-slate-400', valueClass: 'text-slate-800' },
  { key: 'bucket0to30', label: '1-30', border: 'border-t-amber-400', valueClass: 'text-amber-700' },
  { key: 'bucket31to60', label: '31-60', border: 'border-t-orange-500', valueClass: 'text-orange-600' },
  { key: 'bucket61to90', label: '61-90', border: 'border-t-rose-400', valueClass: 'text-rose-600' },
  { key: 'bucket90plus', label: '90+', border: 'border-t-rose-700', valueClass: 'text-rose-700' },
] as const;

export function InvoiceAgingSnapshot({ aging }: { aging: AgingSummary }) {
  const { formatMoney } = useLocaleFormat();

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">AR Aging Snapshot</h3>
        <p className="text-xs font-medium text-slate-500 mt-0.5">
          Current and overdue balances bucketed by age.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {BUCKETS.map((bucket) => (
          <div
            key={bucket.key}
            className={`premium-card premium-shadow p-4 border-t-4 ${bucket.border} min-h-[72px] flex flex-col justify-center`}
          >
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{bucket.label}</span>
            <span className={`text-lg font-extrabold mt-1 ${bucket.valueClass}`}>
              {formatMoney(aging[bucket.key], { decimals: 2 })}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
