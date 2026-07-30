'use client';

import { ChevronDown } from 'lucide-react';

export function AdvancedDetailsToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100/80 hover:border-blue-200 cursor-pointer transition-colors"
    >
      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      Show Advanced Details
    </button>
  );
}
