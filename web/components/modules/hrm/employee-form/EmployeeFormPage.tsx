'use client';

import { toast } from '@/lib/ui/feedback';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useChromeSuppressed } from '@/components/layout/ModuleActionsContext';
import { EmployeeForm } from '@/components/modules/hrm/employee-form/EmployeeForm';
import { useAppStore } from '@/lib/state/app-store';
import {
  createEmployee,
  getEmployeeInitialForm,
  listEmployees,
  mapEmployeeRowToForm,
  updateEmployee,
} from '@/lib/services/hrm-service';

export function EmployeeFormPage({ mode, employeeId }: { mode: 'create' | 'edit'; employeeId?: string }) {
  const router = useRouter();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);

  useChromeSuppressed(true);

  const existing = useMemo(() => {
    if (!employeeId) return null;
    return listEmployees(appState).find((e) => String(e.id) === employeeId) ?? null;
  }, [appState, employeeId]);

  const initialValues = useMemo(() => {
    if (existing) return mapEmployeeRowToForm(existing);
    return getEmployeeInitialForm(appState);
  }, [appState, existing]);

  if (mode === 'edit' && employeeId && !existing) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        Employee not found.{' '}
        <button type="button" onClick={() => router.push('/hrm/employees')} className="text-blue-600 font-bold cursor-pointer">
          Back to Employees
        </button>
      </div>
    );
  }

  const handleSave = (values: Record<string, string>) => {
    const result = mode === 'edit' && employeeId
      ? updateEmployee(appState, employeeId, values)
      : createEmployee(appState, values);
    if (!result.ok) {
      toast.error('Operation failed', { module: 'HRM', description: 'error' in result ? String(result.error) : 'Save failed' });
      return;
    }
    saveAppState();
    router.push(mode === 'edit' && employeeId ? `/hrm/employees/${employeeId}` : '/hrm/employees');
  };

  return (
    <EmployeeForm
      mode={mode}
      initialValues={initialValues}
      appState={appState}
      onCancel={() => router.push('/hrm/employees')}
      onSave={handleSave}
    />
  );
}
