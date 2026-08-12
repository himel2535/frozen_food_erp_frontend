'use client';

import { toast } from '@/lib/ui/feedback';

import { useEffect, useMemo, useState } from 'react';
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
import { isModuleApiMode, API_RESOURCE_PATHS } from '@/lib/config/data-source';
import { createResource, fetchResourceById, updateResource } from '@/lib/services/api-resource-service';
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

export function SalarySetupFormPage({ mode, structureId }: { mode: 'create' | 'edit'; structureId?: string }) {
  const router = useRouter();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const apiMode = isModuleApiMode('salaryStructures');
  const [apiStructure, setApiStructure] = useState<Record<string, unknown> | null>(null);
  const [apiLoading, setApiLoading] = useState(apiMode && mode === 'edit' && Boolean(structureId));

  useEffect(() => {
    if (!apiMode || mode !== 'edit' || !structureId) return;
    setApiLoading(true);
    void fetchResourceById(API_RESOURCE_PATHS.salaryStructures, structureId).then((doc) => {
      setApiStructure(doc ? enrichSalaryStructureRecord(mapGenericApiRow(doc)) : null);
      setApiLoading(false);
    });
  }, [apiMode, mode, structureId]);

  useChromeSuppressed(true);

  const structureState = useMemo(() => {
    if (!apiMode || !apiStructure) return appState;
    return { ...appState, salaryStructures: [apiStructure] } as AppState;
  }, [appState, apiMode, apiStructure]);

  const existing = useMemo(() => {
    if (apiMode) return apiStructure;
    if (!structureId) return null;
    return getSalaryStructureById(appState, structureId);
  }, [apiMode, apiStructure, appState, structureId]);

  const initialValues = useMemo(() => {
    if (existing) return recordToSalarySetupFormValues(existing);
    return { ...EMPTY_SALARY_SETUP_FORM, components: EMPTY_SALARY_SETUP_FORM.components.map((c) => ({ ...c })) };
  }, [existing]);

  const previewId = structureId ?? previewSalaryStructureId(structureState);

  if (apiLoading) {
    return <PageSkeleton variant="module-list" label="Loading salary structure" />;
  }

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

  const handleSave = async (payload: SalarySetupFormPayload) => {
    const record = enrichSalaryStructureRecord(payloadToRecord({
      ...payload,
      id: structureId ?? payload.previewId,
    }));

    if (apiMode) {
      const body = mapGenericPayloadToApi(record);
      const result = mode === 'edit' && structureId
        ? await updateResource(API_RESOURCE_PATHS.salaryStructures, resolveApiRowId(existing ?? record), body)
        : await createResource(API_RESOURCE_PATHS.salaryStructures, body);
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
