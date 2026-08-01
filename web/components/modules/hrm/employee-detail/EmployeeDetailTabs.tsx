'use client';

import { EMPLOYEE_DETAIL_TABS, type EmployeeDetailTabId } from '@/components/modules/hrm/employee-detail/employee-detail-utils';

export function EmployeeDetailTabs({
  active,
  onChange,
}: {
  active: EmployeeDetailTabId;
  onChange: (id: EmployeeDetailTabId) => void;
}) {
  return (
    <div className="premium-card premium-shadow px-2 pt-2 overflow-x-auto">
      <div className="flex gap-1 min-w-max border-b border-slate-100">
        {EMPLOYEE_DETAIL_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`px-5 py-3 text-sm font-bold border-b-2 -mb-px whitespace-nowrap cursor-pointer transition-colors rounded-t-lg ${
              active === tab.id
                ? 'border-blue-600 text-blue-600 bg-blue-50/80'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
