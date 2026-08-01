'use client';

import { CheckCircle2 } from 'lucide-react';
import type { BalanceSheetMetrics } from '@/lib/services/balance-sheet-service';

export function BalanceSheetStatusBanner({
  metrics,
  generatedAt,
}: {
  metrics: BalanceSheetMetrics;
  generatedAt: string;
}) {
  return (
    <div className="space-y-2">
      {metrics.isBalanced ? (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-xs text-emerald-900">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <p>This balance sheet is balanced. Assets equal the sum of liabilities and equity.</p>
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs text-rose-900">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <p>This balance sheet is out of balance. Review assets, liabilities, and equity lines.</p>
        </div>
      )}
      <div className="text-[11px] text-slate-500 font-medium text-right">
        Generated on {generatedAt}
      </div>
    </div>
  );
}
