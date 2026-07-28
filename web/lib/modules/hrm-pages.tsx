'use client';

import { DedicatedModule } from '@/components/modules/shared/DedicatedModule';
import { getLegacyParityConfig } from '@/lib/modules/legacy-parity-configs';

function cfg(id: string) {
  return getLegacyParityConfig(id);
}

export function EmployeesPage() { return <DedicatedModule config={cfg('hrm-employees')} />; }
export function DepartmentsPage() { return <DedicatedModule config={cfg('hrm-departments')} />; }
export function DesignationsPage() { return <DedicatedModule config={cfg('hrm-designations')} />; }
export function AttendancePage() { return <DedicatedModule config={cfg('hrm-attendance')} />; }
export function LeavePage() { return <DedicatedModule config={cfg('hrm-leave')} />; }
export function PayrollStructuresPage() { return <DedicatedModule config={cfg('payroll-structures')} />; }
export function PayrollRunsPage() { return <DedicatedModule config={cfg('payroll-runs')} />; }
export function PayrollSlipsPage() { return <DedicatedModule config={cfg('payroll-slips')} />; }
