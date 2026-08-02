'use client';

import { toast } from '@/lib/ui/feedback';

import { Search, ChevronDown } from 'lucide-react';
import { FilterTabs } from '@/components/shared/FilterTabs';
import { DUE_STATUS_TABS } from './due-options';

export function DueFilterBar({
  search,
  statusFilter,
  onSearchChange,
  onStatusChange,
}: {
  search: string;
  statusFilter: string;
  onSearchChange: (v: string) => void;
  onStatusChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-3 px-3 py-3 border-b border-slate-100">
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search customer or invoice..."
          className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <FilterTabs tabs={DUE_STATUS_TABS} active={statusFilter} onChange={onStatusChange} />
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
          onClick={() => toast.info('Feature coming soon', { module: 'Due Management', description: "More filters coming soon." })}
        >
          More Filters
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
