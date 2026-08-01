'use client';

import { Briefcase, Calendar, DollarSign, UserCheck } from 'lucide-react';
import {
  ED_METRIC_LABEL,
  ED_METRIC_VALUE,
} from '@/components/modules/hrm/employee-detail/employee-detail-styles';
import type { EmployeeDetailMetrics as Metrics } from '@/lib/services/hrm-service';
import { formatMoney } from '@/lib/services/hrm-service';
import { formatEmployeeDate } from '@/components/modules/hrm/employee-detail/employee-detail-utils';

const METRIC_CONFIG = [
  { key: 'tenure', label: 'Tenure', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50/60' },
  { key: 'attendance', label: 'Attendance Rate', icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-50/60' },
  { key: 'payroll', label: 'Last Payroll', icon: DollarSign, color: 'text-violet-500', bg: 'bg-violet-50/60' },
  { key: 'projects', label: 'Active Projects', icon: Briefcase, color: 'text-amber-500', bg: 'bg-amber-50/60' },
] as const;

export function EmployeeDetailMetrics({ metrics }: { metrics: Metrics }) {
  const values: Record<string, { value: string; sub?: string }> = {
    tenure: { value: metrics.tenureLabel, sub: `${metrics.tenureMonths} months total` },
    attendance: {
      value: `${metrics.attendancePresentRate}%`,
      sub: metrics.attendancePresentRate >= 80 ? 'Good standing' : 'Needs review',
    },
    payroll: {
      value: formatMoney(metrics.lastPayrollNet),
      sub: metrics.lastPayrollDate !== '—' ? formatEmployeeDate(metrics.lastPayrollDate) : 'No slips yet',
    },
    projects: {
      value: String(metrics.assignedProjects),
      sub: metrics.assignedProjects === 1 ? 'Project lead' : 'Projects as lead',
    },
  };

  return (
    <section className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {METRIC_CONFIG.map((item) => {
        const data = values[item.key];
        const Icon = item.icon;
        return (
          <div
            key={item.key}
            className={`premium-card premium-shadow p-4 flex items-center justify-between gap-3 min-h-[84px] transition-all hover:border-blue-200/60 hover:shadow-md ${item.bg}`}
          >
            <div className="min-w-0 flex-1">
              <span className={ED_METRIC_LABEL}>{item.label}</span>
              <div className={`${ED_METRIC_VALUE} mt-0.5`}>{data.value}</div>
              {data.sub ? (
                <span className="text-xs font-bold block mt-0.5 text-slate-500">{data.sub}</span>
              ) : null}
            </div>
            <Icon className={`w-9 h-9 shrink-0 ${item.color}`} />
          </div>
        );
      })}
    </section>
  );
}
