'use client';

import { Search } from 'lucide-react';
import { BS_SECTION_OPTIONS, BS_TYPE_OPTIONS, type BalanceSheetFilterState } from './balance-sheet-types';

const SELECT_CLS =
  'rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer';

export function BalanceSheetFilterBar({
  filters,
  onChange,
}: {
  filters: BalanceSheetFilterState;
  onChange: (next: BalanceSheetFilterState) => void;
}) {
  const set = <K extends keyof BalanceSheetFilterState>(key: K, value: BalanceSheetFilterState[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="premium-card premium-shadow p-3 flex flex-col lg:flex-row lg:items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
          placeholder="Search line items..."
          className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>
      <select value={filters.section} onChange={(e) => set('section', e.target.value)} className={SELECT_CLS}>
        {BS_SECTION_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      <select value={filters.type} onChange={(e) => set('type', e.target.value)} className={SELECT_CLS}>
        {BS_TYPE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer whitespace-nowrap">
        <input
          type="checkbox"
          checked={filters.showZeroBalance}
          onChange={(e) => set('showZeroBalance', e.target.checked)}
          className="rounded border-slate-300 cursor-pointer"
        />
        Show Zero Balance
      </label>
    </div>
  );
}
