'use client';

import { Plus } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  SS_CARD_CLS,
  SS_SECTION_TITLE_CLS,
} from '@/components/modules/payroll/salary-setup-form/salary-setup-form-styles';
import { employeeAvatarClass, employeeInitials } from '@/lib/services/hrm-service';

type EmployeeRow = Record<string, unknown>;

export function AssignedEmployeesCard({
  employees,
  totalCount,
}: {
  employees: EmployeeRow[];
  totalCount: number;
}) {
  return (
    <div className={SS_CARD_CLS}>
      <div className="flex items-center justify-between gap-2">
        <h4 className={SS_SECTION_TITLE_CLS}>Assigned Employees ({totalCount})</h4>
        <button type="button" className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer">
          View All
        </button>
      </div>
      <ul className="space-y-2">
        {employees.length ? employees.slice(0, 5).map((emp) => {
          const name = String(emp.name ?? 'Employee');
          return (
            <li key={String(emp.id)} className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${employeeAvatarClass(name)}`}>
                  {employeeInitials(name)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{name}</p>
                  <p className="text-[11px] font-medium text-slate-500">{String(emp.designation ?? emp.employeeType ?? 'Worker')}</p>
                </div>
              </div>
              <StatusBadge status={String(emp.status ?? 'active')} />
            </li>
          );
        }) : (
          <li className="text-xs font-medium text-slate-500 py-2">No employees assigned yet.</li>
        )}
      </ul>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer mt-2"
        onClick={() => window.alert('Assign Employees picker coming soon.')}
      >
        <Plus className="w-4 h-4" /> Assign Employees
      </button>
    </div>
  );
}
