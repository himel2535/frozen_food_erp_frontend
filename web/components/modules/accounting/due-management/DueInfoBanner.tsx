'use client';

import { Info, ChevronRight } from 'lucide-react';

export function DueInfoBanner() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-3 text-xs text-sky-900">
      <div className="flex items-start gap-2 flex-1">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
        <p>
          Dues are created automatically from unpaid invoices and bills. Receive payment or make payment to clear dues.
        </p>
      </div>
      <button
        type="button"
        className="inline-flex items-center gap-1 font-bold text-sky-700 hover:text-sky-900 cursor-pointer shrink-0"
        onClick={() => window.alert('Reports coming soon.')}
      >
        View Reports
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
