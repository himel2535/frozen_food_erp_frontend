'use client';

import { ArrowDownLeft, ArrowUpRight, Scale, Info } from 'lucide-react';
import { formatCashboxMoney } from '@/lib/services/cashbox-service';

function SummaryBox({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: 'in' | 'out' | 'net-positive' | 'net-negative';
}) {
  const toneStyles = {
    in: {
      card: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white',
      iconWrap: 'bg-emerald-100 text-emerald-600',
      value: 'text-emerald-700',
      accent: 'bg-emerald-500',
    },
    out: {
      card: 'border-rose-200 bg-gradient-to-br from-rose-50 to-white',
      iconWrap: 'bg-rose-100 text-rose-600',
      value: 'text-rose-700',
      accent: 'bg-rose-500',
    },
    'net-positive': {
      card: 'border-violet-200 bg-gradient-to-br from-violet-50 to-white',
      iconWrap: 'bg-violet-100 text-violet-600',
      value: 'text-violet-700',
      accent: 'bg-violet-500',
    },
    'net-negative': {
      card: 'border-amber-200 bg-gradient-to-br from-amber-50 to-white',
      iconWrap: 'bg-amber-100 text-amber-600',
      value: 'text-amber-700',
      accent: 'bg-amber-500',
    },
  }[tone];

  return (
    <div className={`relative overflow-hidden rounded-xl border premium-shadow p-4 ${toneStyles.card}`}>
      <span className={`absolute left-0 top-0 h-full w-1 ${toneStyles.accent}`} aria-hidden />
      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
          <p className={`mt-1.5 text-xl font-extrabold tracking-tight sm:text-2xl ${toneStyles.value}`}>{value}</p>
          <p className="mt-1 text-[11px] font-medium text-slate-500">Filtered entries total</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneStyles.iconWrap}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function CashboxFooterBar({
  totalIn,
  totalOut,
  netTotal,
}: {
  totalIn: number;
  totalOut: number;
  netTotal: number;
}) {
  const netTone = netTotal >= 0 ? 'net-positive' : 'net-negative';

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-xs text-emerald-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <div>
          <span className="mb-0.5 block font-bold">Cashbox TIP</span>
          Record every cash movement immediately. Use categories consistently so reports stay accurate. Transfer between cash and bank via the Transfer action when ready.
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryBox
          label="Total Cash In"
          value={formatCashboxMoney(totalIn)}
          icon={<ArrowDownLeft className="h-5 w-5" />}
          tone="in"
        />
        <SummaryBox
          label="Total Cash Out"
          value={formatCashboxMoney(totalOut)}
          icon={<ArrowUpRight className="h-5 w-5" />}
          tone="out"
        />
        <SummaryBox
          label="Net Total"
          value={formatCashboxMoney(netTotal)}
          icon={<Scale className="h-5 w-5" />}
          tone={netTone}
        />
      </div>
    </div>
  );
}
