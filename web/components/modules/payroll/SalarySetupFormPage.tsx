'use client';

import { toast } from '@/lib/ui/feedback';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useChromeSuppressed } from '@/components/layout/ModuleActionsContext';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { SalarySetupForm } from '@/components/modules/payroll/salary-setup-form/SalarySetupForm';
import type { SalarySetupFormPayload } from '@/components/modules/payroll/salary-setup-form/salary-setup-form-types';
import {
  EMPTY_SALARY_SETUP_FORM,
  payloadToRecord,
  recordToSalarySetupFormValues,
} from '@/components/modules/payroll/salary-setup-form/salary-setup-form-types';
import { useAppStore } from '@/lib/state/app-store';
import { isModuleApiMode } from '@/lib/config/data-source';
import { useApiResourceStore } from '@/hooks/use-api-resource-store';
import { mapGenericApiRow, mapGenericPayloadToApi } from '@/lib/services/generic-api-mapper';
import { resolveApiRowId } from '@/lib/services/entity-api-mappers';
import {
  createSalaryStructure,
  enrichSalaryStructureRecord,
  getSalaryStructureById,
  previewSalaryStructureId,
  updateSalaryStructure,
} from '@/lib/services/payroll-service';
import type { AppState } from '@/lib/state/types';

function buildStructureState(
  base: AppState,
  apiMode: boolean,
  rows: Record<string, unknown>[],
  ready: boolean,
): AppState {
  if (!apiMode || !ready) return base;
  return { ...base, salaryStructures: rows } as AppState;
}

export function SalarySetupFormPage({ mode, structureId }: { mode: 'create' | 'edit'; structureId?: string }) {
  const router = useRouter();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const apiMode = isModuleApiMode('salaryStructures');
  const apiStore = useApiResourceStore('salaryStructures', mapGenericApiRow);

  useChromeSuppressed(true);

  const structureState = useMemo(
    () => buildStructureState(appState, apiMode, apiStore.rows, apiStore.initialized),
    [appState, apiMode, apiStore.rows, apiStore.initialized],
  );

  const existing = useMemo(() => {
    if (!structureId) return null;
    return getSalaryStructureById(structureState, structureId);
  }, [structureState, structureId]);

  const initialValues = useMemo(() => {
    if (existing) return recordToSalarySetupFormValues(existing);
    return { ...EMPTY_SALARY_SETUP_FORM, components: EMPTY_SALARY_SETUP_FORM.components.map((c) => ({ ...c })) };
  }, [existing]);

  const previewId = structureId ?? previewSalaryStructureId(structureState);

  if (apiMode && !apiStore.initialized && mode === 'edit') {
    return <PageSkeleton variant="module-list" label="Loading salary structure" />;
  }

  if (mode === 'edit' && structureId && apiStore.initialized && !existing) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        Salary structure not found.{' '}
        <button type="button" onClick={() => router.push('/payroll/structures')} className="text-blue-600 font-bold cursor-pointer">
          Back to list
        </button>
      </div>
    );
  }

  const handleSave = async (payload: SalarySetupFormPayload) => {
    const record = enrichSalaryStructureRecord(payloadToRecord({
      ...payload,
      id: structureId ?? payload.previewId,
    }));

    if (apiMode) {
      const body = mapGenericPayloadToApi(record);
      const result = mode === 'edit' && structureId
        ? await apiStore.update(resolveApiRowId(existing ?? record), body)
        : await apiStore.create(body);
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Salary Setup', description: 'error' in result ? String(result.error) : 'Save failed' });
        return;
      }
      toast.success('Saved', { module: 'Salary Setup', description: mode === 'edit' ? 'Structure updated.' : 'Structure created.' });
      router.push('/payroll/structures');
      return;
    }

    const result = mode === 'edit' && structureId
      ? updateSalaryStructure(appState, structureId, record)
      : createSalaryStructure(appState, record);
    if (!result.ok) {
      toast.error('Operation failed', { module: 'Salary Setup', description: 'error' in result ? String(result.error) : 'Save failed' });
      return;
    }
    saveAppState();
    toast.success('Saved', { module: 'Salary Setup', description: mode === 'edit' ? 'Structure updated.' : 'Structure created.' });
    router.push('/payroll/structures');
  };

  return (
    <SalarySetupForm
      mode={mode}
      initialValues={initialValues}
      previewId={previewId}
      appState={structureState}
      onCancel={() => router.push('/payroll/structures')}
      onSave={handleSave}
    />
  );
}
