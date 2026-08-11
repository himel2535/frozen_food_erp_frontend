'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import { DedicatedModule } from '@/components/modules/shared/DedicatedModule';
import { InventoryItemThumb } from '@/components/shared/InventoryItemThumb';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { useLegacyParityConfig } from '@/hooks/use-legacy-parity-config';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { employeeAvatarClass, employeeInitials } from '@/lib/services/hrm-service';
import { formatMoney } from '@/lib/services/payroll-service';
import { isModuleApiMode } from '@/lib/config/data-source';
import { EmployeesApiPage } from '@/components/modules/hrm/EmployeesApiPage';

function formatEffectiveDate(value: unknown, formatDateFn: (value: Date | string) => string) {
  const raw = String(value ?? '').split('T')[0];
  if (!raw) return '—';
  const d = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(d.getTime())) return raw;
  return formatDateFn(d);
}

function assignedCount(row: Record<string, unknown>) {
  return Array.isArray(row.assignedEmployeeIds) ? row.assignedEmployeeIds.length : 0;
}

function totalFixed(row: Record<string, unknown>) {
  const total = Number(row.totalFixed ?? 0);
  if (total) return total;
  return Number(row.base ?? 0) + Number(row.allowances ?? 0);
}

const EMPLOYEE_TYPE_STYLES: Record<string, string> = {
  Worker: 'bg-amber-50 text-amber-700 border-amber-100',
  Staff: 'bg-blue-50 text-blue-700 border-blue-100',
  Manager: 'bg-violet-50 text-violet-700 border-violet-100',
  Executive: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function EmployeesPage() {
  const router = useRouter();
  const apiMode = isModuleApiMode('employees');
  const base = useLegacyParityConfig('hrm-employees');
  const config = useMemo(() => {
    if (!base) return null;
    return {
    ...base,
    kpiGridClassName: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2',
    hideInlineForm: true,
    onAdd: () => router.push('/hrm/employees/new'),
    onEditRow: (row: Record<string, unknown>) => {
      router.push(`/hrm/employees/${row.id}/edit`);
    },
    columnRender: {
      name: (row: Record<string, unknown>) => {
        const name = String(row.name ?? '—');
        return (
          <span className="inline-flex items-center gap-2">
            <InventoryItemThumb
              imageUrl={String(row.imageUrl ?? '')}
              alt={name}
              className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0"
              fallback={
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${employeeAvatarClass(name)}`}>
                  {employeeInitials(name)}
                </span>
              }
            />
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
  };
  }, [base, router]);

  if (apiMode) return <EmployeesApiPage />;

  if (!config) return <DedicatedModule configId="hrm-employees" />;

  return <DedicatedModule config={config} />;
}

export function DepartmentsPage() { return <DedicatedModule configId="hrm-departments" />; }
export function DesignationsPage() { return <DedicatedModule configId="hrm-designations" />; }
export function AttendancePage() { return <DedicatedModule configId="hrm-attendance" />; }
export function LeavePage() { return <DedicatedModule configId="hrm-leave" />; }
export function PayrollStructuresPage() {
  const router = useRouter();
  const { formatDate } = useLocaleFormat();
  const base = useLegacyParityConfig('payroll-structures');
  const config = useMemo(() => {
    if (!base) return null;
    return {
    ...base,
    addLabel: 'Add Structure',
    kpiGridClassName: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2',
    hideInlineForm: true,
    onAdd: () => router.push('/payroll/structures/new'),
    onRowClick: (row: Record<string, unknown>) => {
      router.push(`/payroll/structures/${row.id}/edit`);
    },
    onEditRow: (row: Record<string, unknown>) => {
      router.push(`/payroll/structures/${row.id}/edit`);
    },
    rowClassName: 'cursor-pointer hover:bg-slate-50/80',
    columnRender: {
      name: (row: Record<string, unknown>) => {
        const name = String(row.name ?? '—');
        const code = String(row.code ?? '');
        return (
          <span className="inline-flex items-center gap-2.5 min-w-0">
            <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${employeeAvatarClass(name)}`}>
              {employeeInitials(name)}
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-slate-800 truncate">{name}</span>
              {code ? <span className="block text-[11px] font-medium text-slate-500 truncate">{code}</span> : null}
            </span>
          </span>
        );
      },
      employeeType: (row: Record<string, unknown>) => {
        const type = String(row.employeeType ?? 'Worker');
        const style = EMPLOYEE_TYPE_STYLES[type] ?? 'bg-slate-50 text-slate-600 border-slate-100';
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[11px] font-bold ${style}`}>
            {type}
          </span>
        );
      },
      payFrequency: (row: Record<string, unknown>) => (
        <span className="text-sm font-medium text-slate-700">{String(row.payFrequency ?? '—')}</span>
      ),
      base: (row: Record<string, unknown>) => (
        <span className="text-sm font-semibold text-slate-800">{formatMoney(Number(row.base ?? 0))}</span>
      ),
      totalFixed: (row: Record<string, unknown>) => (
        <span className="text-sm font-extrabold text-blue-700">{formatMoney(totalFixed(row))}</span>
      ),
      assignedCount: (row: Record<string, unknown>) => {
        const count = assignedCount(row);
        return (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            {count}
          </span>
        );
      },
      effectiveFrom: (row: Record<string, unknown>) => (
        <span className="text-sm font-medium text-slate-600">{formatEffectiveDate(row.effectiveFrom, formatDate)}</span>
      ),
      rules: (row: Record<string, unknown>) => (
        <span className="inline-flex flex-wrap gap-1">
          {row.overtimeEnabled ? (
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold">OT</span>
          ) : null}
          {row.bonusEnabled ? (
            <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold">Bonus</span>
          ) : null}
          {!row.overtimeEnabled && !row.bonusEnabled ? (
            <span className="text-xs text-slate-400 font-medium">—</span>
          ) : null}
        </span>
      ),
    },
  };
  }, [base, router, formatDate]);

  if (!config) return <DedicatedModule configId="payroll-structures" />;

  return <DedicatedModule config={config} configId="payroll-structures" />;
}
export function PayrollRunsPage() { return <DedicatedModule configId="payroll-runs" />; }
export function PayrollSlipsPage() { return <DedicatedModule configId="payroll-slips" />; }
