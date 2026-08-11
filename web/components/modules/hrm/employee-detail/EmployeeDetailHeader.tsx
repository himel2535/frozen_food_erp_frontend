'use client';

import { Briefcase, Building2, Calendar, Mail, Phone, User } from 'lucide-react';
import { InventoryItemThumb } from '@/components/shared/InventoryItemThumb';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  ED_ACCENT_BAR,
  ED_BODY,
  ED_CAPTION,
  ED_CARD,
} from '@/components/modules/hrm/employee-detail/employee-detail-styles';
import {
  employeeAvatarClass,
  employeeInitials,
  formatEmployeeDate,
} from '@/components/modules/hrm/employee-detail/employee-detail-utils';

type EmployeeDetailHeaderProps = {
  employee: Record<string, unknown>;
  departmentInfo: Record<string, unknown> | null;
};

export function EmployeeDetailHeader({ employee, departmentInfo }: EmployeeDetailHeaderProps) {
  const name = String(employee.name ?? 'Employee');
  const imageUrl = String(employee.imageUrl ?? '');
  const department = String(employee.department ?? '—');
  const designation = String(employee.designation ?? '—');
  const manager = String(employee.manager ?? '—');

  return (
    <div className={`relative overflow-hidden ${ED_CARD}`}>
        <div className={ED_ACCENT_BAR} />
        <div className="flex flex-col lg:flex-row lg:items-start gap-5 pt-1">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <InventoryItemThumb
              imageUrl={imageUrl}
              alt={name}
              className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover shrink-0 ring-4 ring-white shadow-md"
              fallback={
                <div
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-lg md:text-xl font-extrabold shrink-0 ring-4 ring-white shadow-md ${employeeAvatarClass(name)}`}
                >
                  {employeeInitials(name)}
                </div>
              }
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">{name}</h1>
                <StatusBadge status={String(employee.status ?? 'active')} />
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 text-xs font-bold border border-violet-100">
                  <Building2 className="w-3.5 h-3.5" />
                  {department}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                  <Briefcase className="w-3.5 h-3.5" />
                  {designation}
                </span>
                {employee.employeeCode ? (
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                    {String(employee.employeeCode)}
                  </span>
                ) : null}
              </div>
              <div className={`flex flex-wrap gap-4 mt-3 ${ED_CAPTION}`}>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Joined: {formatEmployeeDate(employee.joiningDate)}
                </span>
                {employee.id ? (
                  <span className="inline-flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    ID: {String(employee.id)}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-4 mt-3 bg-slate-50/80 rounded-xl px-4 py-2.5">
                {employee.phone ? (
                  <span className={`inline-flex items-center gap-1.5 ${ED_BODY}`}>
                    <Phone className="w-4 h-4 text-slate-400" />
                    {String(employee.phone)}
                  </span>
                ) : null}
                {employee.email ? (
                  <span className={`inline-flex items-center gap-1.5 ${ED_BODY}`}>
                    <Mail className="w-4 h-4 text-slate-400" />
                    {String(employee.email)}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="lg:w-60 shrink-0 premium-card p-4 border border-blue-100/80 bg-gradient-to-br from-blue-50/90 to-white">
            <p className={`${ED_CAPTION} uppercase tracking-wide`}>Reports To</p>
            <div className="flex items-center gap-3 mt-2">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold ring-2 ring-white shadow-sm ${employeeAvatarClass(manager)}`}>
                {employeeInitials(manager)}
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900">{manager}</p>
                <p className={ED_CAPTION}>
                  {departmentInfo?.head ? `Dept Head: ${String(departmentInfo.head)}` : department}
                </p>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
