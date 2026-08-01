'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DedicatedModule } from '@/components/modules/shared/DedicatedModule';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { getLegacyParityConfig } from '@/lib/modules/legacy-parity-configs';
import { employeeAvatarClass, employeeInitials } from '@/lib/services/hrm-service';

function cfg(id: string) {
  return getLegacyParityConfig(id);
}

export function EmployeesPage() {
  const router = useRouter();
  const config = useMemo(() => ({
    ...cfg('hrm-employees'),
    kpiGridClassName: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2',
    columnRender: {
      name: (row: Record<string, unknown>) => {
        const name = String(row.name ?? '—');
        return (
          <span className="inline-flex items-center gap-2">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${employeeAvatarClass(name)}`}>
              {employeeInitials(name)}
            </span>
            <span className="font-semibold text-slate-800">{name}</span>
          </span>
        );
      },
    },
    onRowClick: (row: Record<string, unknown>) => {
      router.push(`/hrm/employees/${row.id}`);
    },
    rowClassName: 'cursor-pointer hover:bg-slate-50/80',
    rowActions: (row: Record<string, unknown>) => (
      <TableIconAction
        variant="view"
        label="View Details"
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/hrm/employees/${row.id}`);
        }}
      />
    ),
  }), [router]);

  return <DedicatedModule config={config} />;
}

export function DepartmentsPage() { return <DedicatedModule config={cfg('hrm-departments')} />; }
export function DesignationsPage() { return <DedicatedModule config={cfg('hrm-designations')} />; }
export function AttendancePage() { return <DedicatedModule config={cfg('hrm-attendance')} />; }
export function LeavePage() { return <DedicatedModule config={cfg('hrm-leave')} />; }
export function PayrollStructuresPage() { return <DedicatedModule config={cfg('payroll-structures')} />; }
export function PayrollRunsPage() { return <DedicatedModule config={cfg('payroll-runs')} />; }
export function PayrollSlipsPage() { return <DedicatedModule config={cfg('payroll-slips')} />; }
