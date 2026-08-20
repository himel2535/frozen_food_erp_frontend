'use client';

import { ModuleFilterBar } from '@/components/shared/ModuleFilterBar';
import { SlidersHorizontal } from 'lucide-react';
import { SUPPLIER_PILL_ACTIVE, SUPPLIER_PILL_INACTIVE } from './suppliers-styles';
import { MODULE_FILTER_INPUT } from '@/lib/ui/module-chrome-styles';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'payable', label: 'Payable' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'inactive', label: 'Inactive' },
] as const;

const SORT_OPTIONS = [
  { id: 'recent', label: 'Recent' },
  { id: 'name', label: 'Name' },
  { id: 'payable', label: 'Payable (High)' },
] as const;

const CATEGORY_OPTIONS = [
  { id: 'all', label: 'All Categories' },
  { id: 'Raw Materials', label: 'Raw Materials' },
  { id: 'Chemicals', label: 'Chemicals' },
  { id: 'Packaging', label: 'Packaging' },
  { id: 'Components', label: 'Components' },
  { id: 'Metals', label: 'Metals' },
  { id: 'Electronics', label: 'Electronics' },
  { id: 'Hardware', label: 'Hardware' },
] as const;

export function SuppliersFilterBar({
  search,
  tab,
  sort,
  category,
  onSearchChange,
  onTabChange,
  onSortChange,
  onCategoryChange,
}: {
  search: string;
  tab: string;
  sort: string;
  category: string;
  onSearchChange: (v: string) => void;
  onTabChange: (v: string) => void;
  onSortChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
}) {
  return (
    <ModuleFilterBar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search supplier, phone, code..."
      filters={
        <>
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                tab === item.id ? 'bg-slate-100 text-slate-800' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="relative shrink-0">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              aria-label="Category"
              className={`${MODULE_FILTER_INPUT} appearance-none pl-8 pr-8 min-w-[140px]`}
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            aria-label="Sort"
            className={`${MODULE_FILTER_INPUT} min-w-[130px]`}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>Sort: {opt.label}</option>
            ))}
          </select>
        </>
      }
    />
  );
}
