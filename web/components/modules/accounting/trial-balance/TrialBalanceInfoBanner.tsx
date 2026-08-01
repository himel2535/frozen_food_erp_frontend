'use client';

import { Info } from 'lucide-react';

export function TrialBalanceInfoBanner({ generatedAt }: { generatedAt: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-3 text-xs text-sky-900">
      <div className="flex items-start gap-2 flex-1">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
        <p>
          Trial Balance shows all ledger accounts and their balance (debit/credit) as on the selected date.
        </p>
      </div>
      <span className="text-[11px] font-semibold text-sky-700 shrink-0">
        Generated on: {generatedAt}
      </span>
    </div>
  );
}
