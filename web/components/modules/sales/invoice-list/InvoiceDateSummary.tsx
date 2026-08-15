'use client';

import { Calendar, FileText, Wallet } from 'lucide-react';
import { formatAppDate } from '@/lib/i18n/locale-format';

type InvoiceDateSummaryProps = {
  date: string;
  count: number;
  totalAmount: number;
  collected: number;
  due: number;
  formatMoney: (value: number, options?: { decimals?: number }) => string;
  formatCount: (value: number) => string;
};

export function InvoiceDateSummary({
  date,
  count,
  totalAmount,
  collected,
  due,
  formatMoney,
  formatCount,
}: InvoiceDateSummaryProps) {
  const displayDate = formatAppDate(`${date}T00:00:00`, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-blue-100/80 bg-blue-50/60 px-4 py-3 text-xs">
      <div className="inline-flex items-center gap-1.5 font-bold text-blue-900">
        <Calendar className="w-3.5 h-3.5 shrink-0" />
        <span>{displayDate}</span>
      </div>
      <div className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
        <FileText className="w-3.5 h-3.5 shrink-0 text-slate-500" />
        <span>
          {formatCount(count)} invoice{count === 1 ? '' : 's'}
        </span>
      </div>
      <div className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
        <Wallet className="w-3.5 h-3.5 shrink-0 text-slate-500" />
        <span>Total: {formatMoney(totalAmount, { decimals: 2 })}</span>
      </div>
      <span className="font-semibold text-emerald-700">Collected: {formatMoney(collected, { decimals: 2 })}</span>
      <span className="font-semibold text-rose-700">Due: {formatMoney(due, { decimals: 2 })}</span>
    </div>
  );
}
