'use client';

import { toast } from '@/lib/ui/feedback';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useChromeSuppressed } from '@/components/layout/ModuleActionsContext';
import { SalarySetupForm } from '@/components/modules/payroll/salary-setup-form/SalarySetupForm';
import type { SalarySetupFormPayload } from '@/components/modules/payroll/salary-setup-form/salary-setup-form-types';
import {
  EMPTY_SALARY_SETUP_FORM,
  payloadToRecord,
  recordToSalarySetupFormValues,
} from '@/components/modules/payroll/salary-setup-form/salary-setup-form-types';
import { useAppStore } from '@/lib/state/app-store';
import {
  createSalaryStructure,
  getSalaryStructureById,
  previewSalaryStructureId,
  updateSalaryStructure,
} from '@/lib/services/payroll-service';

export function SalarySetupFormPage({ mode, structureId }: { mode: 'create' | 'edit'; structureId?: string }) {
  const router = useRouter();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);

  useChromeSuppressed(true);

  const existing = useMemo(() => {
    if (!structureId) return null;
    return getSalaryStructureById(appState, structureId);
  }, [appState, structureId]);

  const initialValues = useMemo(() => {
    if (existing) return recordToSalarySetupFormValues(existing);
    return { ...EMPTY_SALARY_SETUP_FORM, components: EMPTY_SALARY_SETUP_FORM.components.map((c) => ({ ...c })) };
  }, [existing]);

  const previewId = structureId ?? previewSalaryStructureId(appState);

  if (mode === 'edit' && structureId && !existing) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        Salary structure not found.{' '}
        <button type="button" onClick={() => router.push('/payroll/structures')} className="text-blue-600 font-bold cursor-pointer">
          Back to list
        </button>
      </div>
    );
  }

  const handleSave = (payload: SalarySetupFormPayload) => {
    const record = payloadToRecord({
      ...payload,
      id: structureId ?? payload.previewId,
    });
    const result = mode === 'edit' && structureId
      ? updateSalaryStructure(appState, structureId, record)
      : createSalaryStructure(appState, record);
    if (!result.ok) {
      toast.error('Operation failed', { module: 'Payroll', description: 'error' in result ? String(result.error) : 'Save failed' });
      return;
    }
    saveAppState();
    router.push('/payroll/structures');
  };

  return (
    <SalarySetupForm
      mode={mode}
      initialValues={initialValues}
      previewId={previewId}
      appState={appState}
      onCancel={() => router.push('/payroll/structures')}
      onSave={handleSave}
    />
  );
}
