'use client';

import { toast } from '@/lib/ui/feedback';

import { useMemo, useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';
import { ChildPageShell } from '@/components/layout/ChildPageShell';
import { useChromeSuppressed } from '@/components/layout/ModuleActionsContext';
import { AppFormFields, AppFormModal } from '@/components/shared/AppForm';
import { EmployeeDetailHeader } from '@/components/modules/hrm/employee-detail/EmployeeDetailHeader';
import { EmployeeDetailMetrics } from '@/components/modules/hrm/employee-detail/EmployeeDetailMetrics';
import { EmployeeDetailTabs } from '@/components/modules/hrm/employee-detail/EmployeeDetailTabs';
import type { EmployeeDetailTabId } from '@/components/modules/hrm/employee-detail/employee-detail-utils';
import { OverviewTab } from '@/components/modules/hrm/employee-detail/tabs/OverviewTab';
import { AttendanceTab } from '@/components/modules/hrm/employee-detail/tabs/AttendanceTab';
import { PayrollTab } from '@/components/modules/hrm/employee-detail/tabs/PayrollTab';
import { NotesTab } from '@/components/modules/hrm/employee-detail/tabs/NotesTab';
import { useLegacyParityConfig } from '@/hooks/use-legacy-parity-config';
import { useAppStore } from '@/lib/state/app-store';
import {
  getEmployeeProfile,
  getEmployeeDetailMetrics,
  updateEmployee,
} from '@/lib/services/hrm-service';

export function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = String(params?.id ?? '');
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [activeTab, setActiveTab] = useState<EmployeeDetailTabId>('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const config = useLegacyParityConfig('hrm-employees');
  const fields = config?.fields ?? [];

  useChromeSuppressed(true);

  const profile = useMemo(
    () => (employeeId ? getEmployeeProfile(appState, employeeId) : null),
    [appState, employeeId],
  );

  const metrics = useMemo(
    () => (employeeId ? getEmployeeDetailMetrics(appState, employeeId) : null),
    [appState, employeeId],
  );

  const openEdit = () => {
    if (!profile) return;
    const employee = profile.employee;
    const next: Record<string, string> = {};
    fields.forEach((f) => { next[f.key] = String(employee[f.key] ?? ''); });
    setForm(next);
    setShowAdvanced(false);
    setEditOpen(true);
  };

  const setField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { ...form };
    fields.forEach((f) => {
      if (f.type === 'number') payload[f.key] = Number(form[f.key] || 0);
    });
    const result = updateEmployee(appState, employeeId, payload);
    if (!result.ok) {
      toast.error('Operation failed', { module: 'HRM', description: String(result.error ?? 'Save failed') });
      return;
    }
    saveAppState();
    setEditOpen(false);
  };

  if (!profile || !metrics) {
    return (
      <>
        <ChildPageShell
          title="Employee not found"
          subtitle={`The employee ID "${employeeId}" does not exist or was removed.`}
          onBack={() => router.push('/hrm/employees')}
          backLabel="Back to Employees"
        >
          <div className="premium-card premium-shadow p-8 text-center" />
        </ChildPageShell>
        <Footer />
      </>
    );
  }

  const employee = profile.employee as Record<string, unknown>;
  const departmentInfo = profile.departmentInfo as Record<string, unknown> | null;
  const name = String(employee.name ?? 'Employee');
  const department = String(employee.department ?? departmentInfo?.name ?? '—');
  const designation = String(employee.designation ?? '—');

  return (
    <>
      <ChildPageShell
        title={name}
        subtitle={`${department} · ${designation}`}
        onBack={() => router.push('/hrm/employees')}
        backLabel="Back to Employees"
        actions={(
          <button
            type="button"
            onClick={openEdit}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
          >
            Edit Employee
          </button>
        )}
      >
        <EmployeeDetailHeader employee={employee} departmentInfo={departmentInfo} />
        <EmployeeDetailMetrics metrics={metrics} />
        <EmployeeDetailTabs active={activeTab} onChange={setActiveTab} />

        {activeTab === 'overview' && (
          <OverviewTab
            employee={employee}
            departmentInfo={departmentInfo}
            projects={profile.projects as Array<Record<string, unknown>>}
          />
        )}
        {activeTab === 'attendance' && (
          <AttendanceTab rows={profile.attendance as Array<Record<string, unknown>>} />
        )}
        {activeTab === 'payroll' && (
          <PayrollTab rows={profile.payrollSlips as Array<Record<string, unknown>>} />
        )}
        {activeTab === 'notes' && (
          <NotesTab
            employee={employee}
            attendanceCount={profile.attendance.length}
            payrollCount={profile.payrollSlips.length}
            projectCount={profile.projects.length}
          />
        )}
      </ChildPageShell>
      <Footer />

      <AppFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Employee"
        subtitle="Update employee profile details"
        onSubmit={handleSubmit}
      >
        <AppFormFields
          fields={fields}
          values={form}
          onChange={setField}
          showAdvanced={showAdvanced}
          onToggleAdvanced={() => setShowAdvanced((v) => !v)}
        />
      </AppFormModal>
    </>
  );
}
