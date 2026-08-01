'use client';

import { Landmark, Scale, Wallet } from 'lucide-react';
import { formatBsMoney, type BalanceSheetMetrics } from '@/lib/services/balance-sheet-service';

export function BalanceSheetEquationBar({ metrics }: { metrics: BalanceSheetMetrics }) {
  return (
    <div className="premium-card premium-shadow px-4 py-3">
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-semibold">
        <span className="inline-flex items-center gap-1.5 text-blue-700">
          <Wallet className="w-4 h-4" />
          Assets {formatBsMoney(metrics.totalAssets)}
        </span>
        <span className="text-slate-400 font-bold">=</span>
        <span className="inline-flex items-center gap-1.5 text-rose-700">
          <Landmark className="w-4 h-4" />
          Liabilities {formatBsMoney(metrics.totalLiabilities)}
        </span>
        <span className="text-slate-400 font-bold">+</span>
        <span className="inline-flex items-center gap-1.5 text-emerald-700">
          <Scale className="w-4 h-4" />
          Equity {formatBsMoney(metrics.totalEquity)}
        </span>
      </div>
    </div>
  );
}
