'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CreateProjectForm } from '@/components/modules/projects/project-form/CreateProjectForm';
import type { ProjectSaveAction } from '@/components/modules/projects/project-form/project-form-types';
import { useAppStore } from '@/lib/state/app-store';
import {
  createProject,
  getProjectInitialForm,
} from '@/lib/services/projects-service';

export function CreateProjectFormPage() {
  const router = useRouter();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);

  const initialValues = useMemo(
    () => getProjectInitialForm(appState),
    [appState],
  );

  const handleSave = (form: import('@/components/modules/projects/project-form/project-form-types').ProjectFormValues, action: ProjectSaveAction) => {
    const result = createProject(appState, form, action);
    if (!result.ok) {
      window.alert('error' in result ? result.error : 'Save failed');
      return;
    }
    saveAppState();

    if (action === 'create') {
      window.alert('BOM / Recipe setup coming soon.');
    }

    router.push('/projects');
  };

  return (
    <CreateProjectForm
      initialValues={initialValues}
      appState={appState}
      onCancel={() => router.push('/projects')}
      onSave={handleSave}
    />
  );
}
