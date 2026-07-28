'use client';

import { ChevronDown } from 'lucide-react';

export function AdvancedDetailsToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-xs font-bold cursor-pointer">
      <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      Show Advanced Details
    </button>
  );
}
