'use client';

import { toast } from '@/lib/ui/feedback';
import { ChevronDown, LayoutGrid, List } from 'lucide-react';
import { ModuleFilterBar } from '@/components/shared/ModuleFilterBar';
import { FilterTabs } from '@/components/shared/FilterTabs';
import { MODULE_SECONDARY_BTN } from '@/lib/ui/module-chrome-styles';
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
    <ModuleFilterBar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search by customer, phone, invoice…"
      filters={
        <>
          <FilterTabs tabs={CUSTOMER_DUE_STATUS_TABS} active={statusFilter} onChange={onStatusChange} />
          <button
            type="button"
            className={MODULE_SECONDARY_BTN}
            onClick={() => toast.info('Feature coming soon', { module: 'Customer Due', description: 'More filters coming soon.' })}
          >
            More Filters
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <div className="inline-flex items-center rounded-lg border border-blue-200/70 bg-white/45 p-0.5 shrink-0">
            <button
              type="button"
              title="List view"
              className={`inline-flex h-7 w-7 items-center justify-center rounded-md cursor-pointer ${viewMode === 'list' ? 'bg-blue-100 text-blue-800' : 'text-slate-500 hover:bg-blue-50'}`}
              onClick={() => onViewModeChange('list')}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Grid view"
              className={`inline-flex h-7 w-7 items-center justify-center rounded-md cursor-pointer ${viewMode === 'grid' ? 'bg-blue-100 text-blue-800' : 'text-slate-500 hover:bg-blue-50'}`}
              onClick={() => {
                onViewModeChange('grid');
                toast.info('Feature coming soon', { module: 'Customer Due', description: 'Grid view coming soon.' });
              }}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      }
    />
  );
}
