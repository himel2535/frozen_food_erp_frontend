'use client';

import { Search, SlidersHorizontal } from 'lucide-react';
import { SUPPLIER_PILL_ACTIVE, SUPPLIER_PILL_INACTIVE } from './suppliers-styles';

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
    <div className="flex flex-wrap items-center gap-2 lg:gap-3 p-4 border-b border-slate-100">
      <div className="relative w-full sm:w-[240px] lg:w-[260px] shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search supplier, phone, code..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              tab === item.id ? SUPPLIER_PILL_ACTIVE : SUPPLIER_PILL_INACTIVE
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:ml-auto">
        <div className="relative">
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="appearance-none bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl pl-8 pr-8 py-2 cursor-pointer"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-2 cursor-pointer"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>Sort: {opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
