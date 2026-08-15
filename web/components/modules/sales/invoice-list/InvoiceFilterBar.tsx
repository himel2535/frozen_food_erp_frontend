'use client';

import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { DateInput } from '@/components/shared/DateInput';
import { FilterTabs } from '@/components/shared/FilterTabs';
import { ModuleFilterBar } from '@/components/shared/ModuleFilterBar';
import { MODULE_FILTER_INPUT } from '@/lib/ui/module-chrome-styles';

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'pending', label: 'Pending' },
  { id: 'paid', label: 'Paid' },
  { id: 'overdue', label: 'Overdue' },
];

export function InvoiceFilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  dateFilter,
  onDateFilterChange,
  dateSummary,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
  dateSummary?: ReactNode;
}) {
  return (
    <ModuleFilterBar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search invoice, customer..."
      filters={
        <>
          <DateInput
            value={dateFilter}
            onChange={onDateFilterChange}
            className={`${MODULE_FILTER_INPUT} w-[140px]`}
            aria-label="Filter by invoice date"
          />
          {dateFilter ? (
            <button
              type="button"
              onClick={() => onDateFilterChange('')}
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl border border-slate-200 bg-white/70 text-[11px] font-bold text-slate-600 hover:bg-slate-50 cursor-pointer shrink-0"
              aria-label="Clear date filter"
            >
              <X className="w-3.5 h-3.5" />
              Clear date
            </button>
          ) : null}
          <FilterTabs tabs={STATUS_TABS} active={statusFilter} onChange={onStatusChange} />
        </>
      }
      footer={dateSummary ? <div className="mt-3">{dateSummary}</div> : undefined}
    />
  );
}
