'use client';

import { RotateCcw } from 'lucide-react';
import { ModuleFilterBar } from '@/components/shared/ModuleFilterBar';
import { MODULE_FILTER_INPUT } from '@/lib/ui/module-chrome-styles';
import type { PaymentsDueFilterState } from '@/components/modules/payroll/payments-due/payments-due-types';

export function PaymentsDueFilters({
  filters,
  departments,
  designations,
  onChange,
  onReset,
}: {
  filters: PaymentsDueFilterState;
  departments: string[];
  designations: string[];
  onChange: (patch: Partial<PaymentsDueFilterState>) => void;
  onReset: () => void;
}) {
  return (
    <ModuleFilterBar
      search={filters.search}
      onSearchChange={(search) => onChange({ search })}
      searchPlaceholder="Search by employee name or ID..."
      filters={
        <>
          <input
            type="month"
            value={filters.period}
            onChange={(e) => onChange({ period: e.target.value })}
            className={MODULE_FILTER_INPUT}
            aria-label="Pay period"
          />
          <select
            value={filters.department}
            onChange={(e) => onChange({ department: e.target.value })}
            className={MODULE_FILTER_INPUT}
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            value={filters.designation}
            onChange={(e) => onChange({ designation: e.target.value })}
            className={MODULE_FILTER_INPUT}
          >
            <option value="all">All Designations</option>
            {designations.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => onChange({ status: e.target.value as PaymentsDueFilterState['status'] })}
            className={MODULE_FILTER_INPUT}
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="notProcessed">Not Processed</option>
          </select>
        </>
      }
      actions={
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      }
    />
  );
}
