'use client';

import { Briefcase, Heart, Phone, User } from 'lucide-react';
import {
  ED_BODY,
  ED_CARD_COMPACT,
  ED_LABEL,
  ED_SECTION_HEADER_COMPACT,
  ED_TITLE,
} from '@/components/modules/hrm/employee-detail/employee-detail-styles';
import {
  employeeStatusLabel,
  formatEmployeeDate,
} from '@/components/modules/hrm/employee-detail/employee-detail-utils';
import { formatMoney } from '@/lib/services/hrm-service';

type OverviewTabProps = {
  employee: Record<string, unknown>;
  departmentInfo: Record<string, unknown> | null;
  projects: Array<Record<string, unknown>>;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-2 py-1.5 border-b border-slate-50 last:border-0">
      <span className={ED_LABEL}>{label}</span>
      <span className={ED_BODY}>{value}</span>
    </div>
  );
}

export function OverviewTab({ employee, departmentInfo, projects }: OverviewTabProps) {
  const address = [employee.address, employee.city].filter(Boolean).join(', ') || '—';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div className={ED_CARD_COMPACT}>
        <div className={ED_SECTION_HEADER_COMPACT}>
          <User className="w-4 h-4 text-blue-500" />
          <h3 className={ED_TITLE}>Personal Information</h3>
        </div>
        <InfoRow label="Full Name" value={String(employee.name ?? '—')} />
        <InfoRow label="Gender" value={String(employee.gender ?? '—')} />
        <InfoRow label="Blood Group" value={String(employee.bloodGroup ?? '—')} />
        <InfoRow label="NID / ID No." value={String(employee.nid ?? '—')} />
        <InfoRow label="Address" value={address} />
      </div>

      <div className={ED_CARD_COMPACT}>
        <div className={ED_SECTION_HEADER_COMPACT}>
          <Briefcase className="w-4 h-4 text-blue-500" />
          <h3 className={ED_TITLE}>Employment Details</h3>
        </div>
        <InfoRow label="Employee Code" value={String(employee.employeeCode ?? employee.id ?? '—')} />
        <InfoRow label="Department" value={String(employee.department ?? '—')} />
        <InfoRow label="Designation" value={String(employee.designation ?? '—')} />
        <InfoRow label="Manager" value={String(employee.manager ?? '—')} />
        <InfoRow label="Joining Date" value={formatEmployeeDate(employee.joiningDate)} />
        <InfoRow label="Status" value={employeeStatusLabel(employee.status)} />
        <InfoRow label="Monthly Salary" value={employee.salary ? formatMoney(Number(employee.salary)) : '—'} />
        {departmentInfo ? (
          <InfoRow label="Dept Head" value={String(departmentInfo.head ?? '—')} />
        ) : null}
      </div>

      <div className={ED_CARD_COMPACT}>
        <div className={ED_SECTION_HEADER_COMPACT}>
          <Phone className="w-4 h-4 text-blue-500" />
          <h3 className={ED_TITLE}>Contact</h3>
        </div>
        <InfoRow label="Phone" value={String(employee.phone ?? '—')} />
        <InfoRow label="Email" value={String(employee.email ?? '—')} />
      </div>

      <div className={ED_CARD_COMPACT}>
        <div className={ED_SECTION_HEADER_COMPACT}>
          <Heart className="w-4 h-4 text-blue-500" />
          <h3 className={ED_TITLE}>Emergency Contact</h3>
        </div>
        <InfoRow label="Contact Name" value={String(employee.emergencyContact ?? '—')} />
        <InfoRow label="Contact Phone" value={String(employee.emergencyPhone ?? '—')} />
      </div>

      {projects.length > 0 ? (
        <div className={`${ED_CARD_COMPACT} xl:col-span-2`}>
          <div className={ED_SECTION_HEADER_COMPACT}>
            <Briefcase className="w-4 h-4 text-blue-500" />
            <h3 className={ED_TITLE}>Assigned Projects</h3>
          </div>
          <ul className="space-y-2">
            {projects.map((project) => (
              <li key={String(project.id)} className="flex items-center justify-between gap-3 py-2 border-b border-slate-50 last:border-0">
                <div>
                  <p className={ED_BODY}>{String(project.name ?? project.id)}</p>
                  <p className="text-xs text-slate-500 font-medium">{String(project.status ?? '—')}</p>
                </div>
                <span className="text-xs font-bold text-slate-500">{String(project.deadline ?? '—')}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
