'use client';

import { RotateCcw, Search } from 'lucide-react';
import { SS_FILTER_INPUT_CLS } from '@/components/modules/payroll/salary-sheet/salary-sheet-styles';
import type { SheetFilterState } from '@/components/modules/payroll/salary-sheet/salary-sheet-types';

export function SalarySheetFilters({
  filters,
  departments,
  designations,
  onChange,
  onReset,
}: {
  filters: SheetFilterState;
  departments: string[];
  designations: string[];
  onChange: (patch: Partial<SheetFilterState>) => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="month"
          value={filters.period}
          onChange={(e) => onChange({ period: e.target.value })}
          className={SS_FILTER_INPUT_CLS}
        />
        <select
          value={filters.department}
          onChange={(e) => onChange({ department: e.target.value })}
          className={`${SS_FILTER_INPUT_CLS} cursor-pointer`}
        >
          <option value="all">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={filters.designation}
          onChange={(e) => onChange({ designation: e.target.value })}
          className={`${SS_FILTER_INPUT_CLS} cursor-pointer`}
        >
          <option value="all">All Designations</option>
          {designations.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Search employee by name or ID..."
            className={`${SS_FILTER_INPUT_CLS} pl-9 w-full`}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5" /> Reset
      </button>
    </div>
  );
}
