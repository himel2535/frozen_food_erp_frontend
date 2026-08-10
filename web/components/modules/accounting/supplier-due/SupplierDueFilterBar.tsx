'use client';

import { toast } from '@/lib/ui/feedback';
import { ChevronDown } from 'lucide-react';
import { ModuleFilterBar } from '@/components/shared/ModuleFilterBar';
import { FilterTabs } from '@/components/shared/FilterTabs';
import { MODULE_SECONDARY_BTN } from '@/lib/ui/module-chrome-styles';
import { SUPPLIER_DUE_STATUS_TABS } from './supplier-due-options';

export function SupplierDueFilterBar({
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
    <ModuleFilterBar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search supplier, phone, PO, invoice…"
      filters={
        <>
          <FilterTabs tabs={SUPPLIER_DUE_STATUS_TABS} active={statusFilter} onChange={onStatusChange} />
          <button
            type="button"
            className={MODULE_SECONDARY_BTN}
            onClick={() => toast.info('Feature coming soon', { module: 'Supplier Due', description: 'More filters coming soon.' })}
          >
            More Filters
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </>
      }
    />
  );
}
