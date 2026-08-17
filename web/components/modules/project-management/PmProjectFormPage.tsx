'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AppFormPage } from '@/components/shared/AppForm';
import { DateInput } from '@/components/shared/DateInput';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { useChromeSuppressed } from '@/components/layout/ModuleActionsContext';
import {
  FORM_ALERT_ERROR_CLS,
  FORM_GRID_CLS,
  FORM_INPUT_CLS,
  FORM_LABEL_CLS,
  FORM_SELECT_CLS,
  FORM_TEXTAREA_CLS,
} from '@/lib/ui/form-styles';
import { toast } from '@/lib/ui/feedback';
import { API_RESOURCE_PATHS } from '@/lib/config/data-source';
import { fetchResourceById, fetchResourceList } from '@/lib/services/api-resource-service';
import {
  createPmProject,
  mapPmProjectRow,
  mapPmProjectToForm,
  pmProjectFormToApi,
  updatePmProject,
  validatePmProjectForm,
} from '@/lib/services/pm-service';
import { EMPTY_PM_PROJECT_FORM, PM_PRIORITIES, PM_PROJECT_STATUSES, PM_STATUS_LABELS } from '@/lib/services/pm-types';
import type { PmProjectFormValues } from '@/lib/services/pm-types';

export function PmProjectFormPage({ mode, projectId }: { mode: 'create' | 'edit'; projectId?: string }) {
  const router = useRouter();
  useChromeSuppressed(true);
  const [form, setForm] = useState<PmProjectFormValues>(EMPTY_PM_PROJECT_FORM);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(mode === 'edit');
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    void fetchResourceList(API_RESOURCE_PATHS.employees).then((rows) => {
      setEmployees(
        rows
          .map((row) => ({ id: String(row.id ?? row._id ?? ''), name: String(row.name ?? '') }))
          .filter((row) => row.id),
      );
    });
  }, []);

  useEffect(() => {
    if (mode !== 'edit' || !projectId) return;
    let cancelled = false;
    void fetchResourceById(API_RESOURCE_PATHS.pmProjects, projectId).then((doc) => {
      if (cancelled) return;
      if (!doc) {
        setMissing(true);
        setLoading(false);
        return;
      }
      setForm(mapPmProjectToForm(mapPmProjectRow(doc)));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [mode, projectId]);

  const managerName = useMemo(
    () => employees.find((row) => row.id === form.managerId)?.name ?? '',
    [employees, form.managerId],
  );

  const setField = <K extends keyof PmProjectFormValues>(key: K, value: PmProjectFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const error = validatePmProjectForm(form);
    if (error) {
      toast.error('Please fill required fields', { module: 'Projects', description: error });
      return false;
    }
    const body = pmProjectFormToApi(form, managerName);
    const result = mode === 'edit' && projectId
      ? await updatePmProject(projectId, body)
      : await createPmProject(body);
    if (!result.ok) {
      toast.error(mode === 'edit' ? 'Could not update project' : 'Could not create project', {
        module: 'Projects',
        description: result.error,
      });
      return false;
    }
    toast.success(mode === 'edit' ? 'Project updated' : 'Project created', { module: 'Projects' });
    const id = mode === 'edit' && projectId ? projectId : 'id' in result ? result.id : '';
    router.push(id ? `/projects/${id}` : '/projects');
    return true;
  };

  if (loading) return <PageSkeleton variant="form" label="Loading project form" />;
  if (missing) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        Project not found.{' '}
        <button type="button" onClick={() => router.push('/projects')} className="text-blue-600 font-bold cursor-pointer">
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <AppFormPage
      title={mode === 'edit' ? 'Edit Project' : 'Create New Project'}
      subtitle={mode === 'edit' ? 'Update project details.' : 'Add project details to get started. You can always edit later.'}
      onBack={() => router.push(projectId ? `/projects/${projectId}` : '/projects')}
      onSubmit={handleSubmit}
      submitLabel={mode === 'edit' ? 'Save Project' : 'Create Project'}
    >
      <div>
        <h3 className="text-sm font-extrabold text-slate-900 mb-4">Project Information</h3>
        <div className={FORM_GRID_CLS}>
          <label className="md:col-span-1">
            <span className={FORM_LABEL_CLS}>Project Name *</span>
            <input
              className={FORM_INPUT_CLS}
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="Enter project name"
            />
          </label>
          <label>
            <span className={FORM_LABEL_CLS}>Project Manager *</span>
            <select
              className={FORM_SELECT_CLS}
              value={form.managerId}
              onChange={(e) => setField('managerId', e.target.value)}
            >
              <option value="">Select manager</option>
              {employees.map((row) => (
                <option key={row.id} value={row.id}>{row.name}</option>
              ))}
            </select>
          </label>
          <label className="md:col-span-2">
            <span className={FORM_LABEL_CLS}>Description</span>
            <textarea
              className={FORM_TEXTAREA_CLS}
              value={form.description}
              maxLength={500}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Describe the project"
            />
            <span className="block text-right text-[10px] text-slate-400 mt-1">{form.description.length} / 500</span>
          </label>
          <label>
            <span className={FORM_LABEL_CLS}>Start Date *</span>
            <DateInput value={form.startDate} onChange={(value) => setField('startDate', value)} />
          </label>
          <label>
            <span className={FORM_LABEL_CLS}>Deadline *</span>
            <DateInput value={form.deadline} onChange={(value) => setField('deadline', value)} />
          </label>
          <label>
            <span className={FORM_LABEL_CLS}>Priority *</span>
            <select className={FORM_SELECT_CLS} value={form.priority} onChange={(e) => setField('priority', e.target.value as PmProjectFormValues['priority'])}>
              {PM_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>{PM_STATUS_LABELS[priority]}</option>
              ))}
            </select>
          </label>
          <label>
            <span className={FORM_LABEL_CLS}>Status *</span>
            <select className={FORM_SELECT_CLS} value={form.status} onChange={(e) => setField('status', e.target.value as PmProjectFormValues['status'])}>
              {PM_PROJECT_STATUSES.map((status) => (
                <option key={status} value={status}>{PM_STATUS_LABELS[status]}</option>
              ))}
            </select>
          </label>
        </div>
        {form.deadline && form.startDate && form.deadline < form.startDate ? (
          <p className={`${FORM_ALERT_ERROR_CLS} mt-4`}>Deadline cannot be before the start date.</p>
        ) : null}
      </div>
    </AppFormPage>
  );
}
