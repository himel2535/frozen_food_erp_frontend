'use client';

import { ModuleFilterBar } from '@/components/shared/ModuleFilterBar';
import { BS_SECTION_OPTIONS, BS_TYPE_OPTIONS, type BalanceSheetFilterState } from './balance-sheet-types';
import { MODULE_FILTER_INPUT } from '@/lib/ui/module-chrome-styles';

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
    <ModuleFilterBar
      search={filters.search}
      onSearchChange={(value) => set('search', value)}
      searchPlaceholder="Search line items..."
      filters={
        <>
          <select value={filters.section} onChange={(e) => set('section', e.target.value)} className={MODULE_FILTER_INPUT}>
            {BS_SECTION_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <select value={filters.type} onChange={(e) => set('type', e.target.value)} className={MODULE_FILTER_INPUT}>
            {BS_TYPE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer whitespace-nowrap shrink-0">
            <input
              type="checkbox"
              checked={filters.showZeroBalance}
              onChange={(e) => set('showZeroBalance', e.target.checked)}
              className="rounded border-slate-300 cursor-pointer"
            />
            Show Zero Balance
          </label>
        </>
      }
    />
  );
}
