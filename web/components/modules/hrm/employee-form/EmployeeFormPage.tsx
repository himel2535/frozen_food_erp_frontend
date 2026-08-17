'use client';

import { toast } from '@/lib/ui/feedback';

import { useEffect, useMemo, useState } from 'react';
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
import { isModuleApiMode } from '@/lib/config/data-source';
import { API_RESOURCE_PATHS } from '@/lib/config/data-source';
import { createResource, fetchResourceById, updateResource } from '@/lib/services/api-resource-service';
import { attachBackgroundImageLater } from '@/lib/services/background-image-attach';
import { patchResourceImageUrl } from '@/lib/services/resource-image-patch';
import type { PendingImageUpload } from '@/components/shared/ImageUploadField';
import { mapApiEmployeeRow, mapApiEmployeeToForm, mapEmployeeFormToApi } from '@/lib/services/entity-api-mappers';
import { getSalaryStructureById, resolveBasicSalary } from '@/lib/services/payroll-service';
import { PageSkeleton } from '@/components/shared/PageSkeleton';

export function EmployeeFormPage({ mode, employeeId }: { mode: 'create' | 'edit'; employeeId?: string }) {
  const router = useRouter();
  const appState = useAppStore((s) => s.appState);
  const apiDataReady = useAppStore((s) => s.apiDataReady);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const apiMode = isModuleApiMode('employees');
  const [apiEmployee, setApiEmployee] = useState<Record<string, unknown> | null>(null);
  const [apiLoading, setApiLoading] = useState(apiMode && mode === 'edit' && Boolean(employeeId));

  useEffect(() => {
    if (!apiMode || mode !== 'edit' || !employeeId) return;
    setApiLoading(true);
    void fetchResourceById(API_RESOURCE_PATHS.employees, employeeId).then((doc) => {
      setApiEmployee(doc ? mapApiEmployeeRow(doc) : null);
      setApiLoading(false);
    });
  }, [apiMode, mode, employeeId]);

  useChromeSuppressed(true);

  const existing = useMemo(() => {
    if (apiMode) return apiEmployee;
    if (!employeeId) return null;
    return listEmployees(appState).find((e) => String(e.id) === employeeId) ?? null;
  }, [apiMode, apiEmployee, appState, employeeId]);

  const initialValues = useMemo(() => {
    if (existing) {
      return apiMode
        ? mapApiEmployeeToForm(existing)
        : mapEmployeeRowToForm(existing);
    }
    return getEmployeeInitialForm(appState);
  }, [appState, existing, apiMode]);

  if (apiLoading || (apiMode && !apiDataReady)) {
    return <PageSkeleton variant="module-list" label="Loading employee form" />;
  }

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

  const handleSave = async (
    values: Record<string, string>,
    pendingImageUpload?: Promise<PendingImageUpload | null> | null,
  ) => {
    const structureId = values.salaryStructureId?.trim();
    let salary = Number(values.salary ?? 0);
    if ((!salary || salary <= 0) && structureId) {
      const structure = getSalaryStructureById(appState, structureId);
      if (structure) {
        const basic = resolveBasicSalary(structure);
        if (basic > 0) salary = basic;
      }
    }
    const payload = { ...values, salary: salary > 0 ? String(salary) : values.salary };

    if (apiMode) {
      const body = mapEmployeeFormToApi(payload, { forCreate: mode === 'create' });
      const result = mode === 'edit' && employeeId
        ? await updateResource(API_RESOURCE_PATHS.employees, employeeId, body)
        : await createResource(API_RESOURCE_PATHS.employees, body);
      if (!result.ok) {
        toast.error('Operation failed', { module: 'HRM', description: 'error' in result ? String(result.error) : 'Save failed' });
        return;
      }
      const recordId = mode === 'edit' && employeeId
        ? employeeId
        : ('id' in result ? String(result.id) : '');
      if (recordId && pendingImageUpload) {
        attachBackgroundImageLater({
          recordId,
          savedImageUrl: String(values.imageUrl ?? ''),
          pending: pendingImageUpload,
          patchImage: (id, url, pid) => patchResourceImageUrl(API_RESOURCE_PATHS.employees, id, url, pid),
          moduleName: 'HRM',
        });
      }
      toast.success('Saved', { module: 'HRM', description: mode === 'edit' ? 'Employee updated.' : 'Employee created.' });
      router.push(mode === 'edit' && employeeId ? `/hrm/employees/${employeeId}` : '/hrm/employees');
      return;
    }

    const result = mode === 'edit' && employeeId
      ? updateEmployee(appState, employeeId, payload)
      : createEmployee(appState, payload);
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
