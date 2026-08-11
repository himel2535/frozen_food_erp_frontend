'use client';

import { toast } from '@/lib/ui/feedback';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useChromeSuppressed } from '@/components/layout/ModuleActionsContext';
import { CreateProjectForm } from '@/components/modules/projects/project-form/CreateProjectForm';
import type { ProjectSaveAction } from '@/components/modules/projects/project-form/project-form-types';
import { useAppStore } from '@/lib/state/app-store';
import { isModuleApiMode } from '@/lib/config/data-source';
import { useApiResourceStore } from '@/hooks/use-api-resource-store';
import { mapGenericApiRow } from '@/lib/services/generic-api-mapper';
import { useApiAppState } from '@/hooks/use-api-app-state';
import {
  createProject,
  getProjectInitialForm,
  mapProjectFormToApi,
} from '@/lib/services/projects-service';
import { PageSkeleton } from '@/components/shared/PageSkeleton';

export function CreateProjectFormPage() {
  const router = useRouter();
  const appState = useAppStore((s) => s.appState);
  const apiDataReady = useAppStore((s) => s.apiDataReady);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const apiMode = isModuleApiMode('projects');
  const apiStore = useApiResourceStore('projects', mapGenericApiRow);
  const { state: formState, loading: formStateLoading } = useApiAppState(
    apiMode ? ['customers', 'products', 'employees', 'projects'] : undefined,
  );

  useChromeSuppressed(true);

  const initialValues = useMemo(
    () => getProjectInitialForm(formState),
    [formState],
  );

  const handleSave = async (
    form: import('@/components/modules/projects/project-form/project-form-types').ProjectFormValues,
    action: ProjectSaveAction,
  ) => {
    if (apiMode) {
      const body = mapProjectFormToApi(form, action);
      const result = await apiStore.create(body);
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Projects', description: 'error' in result ? String(result.error) : 'Save failed' });
        return;
      }
      const savedId = 'id' in result ? String(result.id) : form.projectId;
      if (action === 'create') {
        toast.success('Project created', { module: 'Projects', description: 'Continue with BOM / Recipe setup.' });
        router.push(`/projects/${savedId}/setup?step=2`);
        return;
      }
      toast.success('Draft saved', { module: 'Projects', description: 'Project draft saved successfully.' });
      router.push('/projects');
      return;
    }

    const result = createProject(appState, form, action);
    if (!result.ok) {
      toast.error('Operation failed', { module: 'Projects', description: 'error' in result ? String(result.error) : 'Save failed' });
      return;
    }
    saveAppState();
    const savedId = 'id' in result ? String(result.id) : form.projectId;
    if (action === 'create') {
      toast.success('Project created', { module: 'Projects', description: 'Continue with BOM / Recipe setup.' });
      router.push(`/projects/${savedId}/setup?step=2`);
      return;
    }
    toast.success('Draft saved', { module: 'Projects', description: 'Project draft saved successfully.' });
    router.push('/projects');
  };

  if (apiMode && (!apiDataReady || formStateLoading)) {
    return <PageSkeleton variant="module-list" label="Loading project form" />;
  }

  return (
    <CreateProjectForm
      initialValues={initialValues}
      appState={formState}
      onCancel={() => router.push('/projects')}
      onSave={handleSave}
    />
  );
}
