'use client';

import { toast } from '@/lib/ui/feedback';

import { Search, ChevronDown, LayoutGrid, List } from 'lucide-react';
import { FilterTabs } from '@/components/shared/FilterTabs';
import { CUSTOMER_DUE_STATUS_TABS } from './customer-due-options';
import type { CustomerDueViewMode } from './customer-due-types';

export function CustomerDueFilterBar({
  search,
  statusFilter,
  viewMode,
  onSearchChange,
  onStatusChange,
  onViewModeChange,
}: {
  search: string;
  statusFilter: string;
  viewMode: CustomerDueViewMode;
  onSearchChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onViewModeChange: (v: CustomerDueViewMode) => void;
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-3 px-3 py-3 border-b border-slate-100">
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by customer, phone, invoice…"
          className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <FilterTabs tabs={CUSTOMER_DUE_STATUS_TABS} active={statusFilter} onChange={onStatusChange} />
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
          onClick={() => toast.info('Feature coming soon', { module: 'Customer Due', description: 'More filters coming soon.' })}
        >
          More Filters
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <div className="inline-flex items-center rounded-lg border border-slate-200 p-0.5">
          <button
            type="button"
            title="List view"
            className={`inline-flex h-7 w-7 items-center justify-center rounded-md cursor-pointer ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
            onClick={() => onViewModeChange('list')}
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Grid view"
            className={`inline-flex h-7 w-7 items-center justify-center rounded-md cursor-pointer ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
            onClick={() => {
              onViewModeChange('grid');
              toast.info('Feature coming soon', { module: 'Customer Due', description: 'Grid view coming soon.' });
            }}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
