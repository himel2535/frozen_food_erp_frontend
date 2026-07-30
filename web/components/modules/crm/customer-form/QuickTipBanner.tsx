'use client';

import { useState } from 'react';
import { Lightbulb, X } from 'lucide-react';

export function QuickTipBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="flex items-start gap-2.5 max-w-sm p-3 rounded-xl border border-blue-200/80 bg-blue-50/90 shrink-0">
      <Lightbulb className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-extrabold text-blue-800">Quick Tip</p>
        <p className="text-[11px] font-semibold text-blue-700/90 mt-0.5 leading-relaxed">
          Fill only the required fields to quickly add a customer.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="p-1 rounded-lg text-blue-600 hover:bg-blue-100 cursor-pointer shrink-0"
        aria-label="Dismiss tip"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
