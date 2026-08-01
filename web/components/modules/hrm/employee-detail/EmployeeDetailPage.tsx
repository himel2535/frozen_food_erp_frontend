'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';
import { AppFormFields, AppFormModal } from '@/components/shared/AppForm';
import { EmployeeDetailHeader } from '@/components/modules/hrm/employee-detail/EmployeeDetailHeader';
import { EmployeeDetailMetrics } from '@/components/modules/hrm/employee-detail/EmployeeDetailMetrics';
import { EmployeeDetailTabs } from '@/components/modules/hrm/employee-detail/EmployeeDetailTabs';
import type { EmployeeDetailTabId } from '@/components/modules/hrm/employee-detail/employee-detail-utils';
import { OverviewTab } from '@/components/modules/hrm/employee-detail/tabs/OverviewTab';
import { AttendanceTab } from '@/components/modules/hrm/employee-detail/tabs/AttendanceTab';
import { PayrollTab } from '@/components/modules/hrm/employee-detail/tabs/PayrollTab';
import { NotesTab } from '@/components/modules/hrm/employee-detail/tabs/NotesTab';
import { getLegacyParityConfig } from '@/lib/modules/legacy-parity-configs';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { useAppStore } from '@/lib/state/app-store';
import {
  getEmployeeProfile,
  getEmployeeDetailMetrics,
  updateEmployee,
} from '@/lib/services/hrm-service';

export function EmployeeDetailPage() {
  const params = useParams();
  const employeeId = String(params?.id ?? '');
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [activeTab, setActiveTab] = useState<EmployeeDetailTabId>('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const config = useMemo(() => getLegacyParityConfig('hrm-employees'), []);
  const fields = config.fields;

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
      window.alert(result.error ?? 'Save failed');
      return;
    }
    saveAppState();
    setEditOpen(false);
  };

  if (!profile || !metrics) {
    return (
      <div className={MODULE_LIST_SHELL}>
        <div className="premium-card premium-shadow p-8 text-center space-y-4 max-w-lg mx-auto mt-12">
          <h2 className="text-lg font-extrabold text-slate-900">Employee not found</h2>
          <p className="text-xs text-slate-500">
            The employee ID &quot;{employeeId}&quot; does not exist or was removed.
          </p>
          <Link
            href="/hrm/employees"
            className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Employees
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const employee = profile.employee as Record<string, unknown>;
  const departmentInfo = profile.departmentInfo as Record<string, unknown> | null;

  return (
    <div className={MODULE_LIST_SHELL}>
      <div className="space-y-4 flex flex-col">
        <EmployeeDetailHeader
          employee={employee}
          departmentInfo={departmentInfo}
          onEdit={openEdit}
        />

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
      </div>
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
    </div>
  );
}
