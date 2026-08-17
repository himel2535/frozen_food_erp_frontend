'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AppFormPage } from '@/components/shared/AppForm';
import { DateInput } from '@/components/shared/DateInput';
import { ImageUploadField } from '@/components/shared/ImageUploadField';
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
  createPmTask,
  mapPmProjectRow,
  mapPmTaskRow,
  mapPmTaskToForm,
  pmTaskFormToApi,
  updatePmTask,
  validatePmTaskForm,
} from '@/lib/services/pm-service';
import { EMPTY_PM_TASK_FORM, PM_PRIORITIES, PM_STATUS_LABELS, PM_TASK_STATUSES } from '@/lib/services/pm-types';
import type { PmTaskFormValues } from '@/lib/services/pm-types';

export function PmTaskFormPage({
  mode,
  projectId,
  taskId,
}: {
  mode: 'create' | 'edit';
  projectId?: string;
  taskId?: string;
}) {
  const router = useRouter();
  useChromeSuppressed(true);
  const [form, setForm] = useState<PmTaskFormValues>(EMPTY_PM_TASK_FORM);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [projectName, setProjectName] = useState('');
  const [resolvedProjectId, setResolvedProjectId] = useState(projectId ?? '');
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    void fetchResourceList(API_RESOURCE_PATHS.employees).then((rows) => {
      setEmployees(
        rows.map((row) => ({
          id: String(row.id ?? row._id ?? ''),
          name: String(row.name ?? ''),
          email: String(row.email ?? ''),
        })).filter((row) => row.id),
      );
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (mode === 'edit' && taskId) {
        const doc = await fetchResourceById(API_RESOURCE_PATHS.pmTasks, taskId);
        if (cancelled) return;
        if (!doc) {
          setMissing(true);
          setLoading(false);
          return;
        }
        const mapped = mapPmTaskRow(doc);
        setForm(mapPmTaskToForm(mapped));
        setResolvedProjectId(String(mapped.projectId ?? ''));
        setProjectName(String(mapped.projectName ?? ''));
        setLoading(false);
        return;
      }
      if (projectId) {
        const project = await fetchResourceById(API_RESOURCE_PATHS.pmProjects, projectId);
        if (cancelled) return;
        if (!project) {
          setMissing(true);
          setLoading(false);
          return;
        }
        setResolvedProjectId(projectId);
        setProjectName(String(mapPmProjectRow(project).name ?? ''));
        setLoading(false);
        return;
      }
      setMissing(true);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [mode, projectId, taskId]);

  const assignee = useMemo(
    () => employees.find((row) => row.id === form.assignedTo),
    [employees, form.assignedTo],
  );

  const setField = <K extends keyof PmTaskFormValues>(key: K, value: PmTaskFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const backHref = resolvedProjectId ? `/projects/${resolvedProjectId}` : '/projects';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const error = validatePmTaskForm(form);
    if (error) {
      toast.error('Please fill required fields', { module: 'Projects', description: error });
      return false;
    }
    if (!resolvedProjectId) {
      toast.error('Project is required', { module: 'Projects' });
      return false;
    }
    const body = pmTaskFormToApi(form, {
      projectId: resolvedProjectId,
      projectName,
      assignedToName: assignee?.name ?? '',
      assignedToEmail: assignee?.email ?? '',
    });
    const result = mode === 'edit' && taskId
      ? await updatePmTask(taskId, body)
      : await createPmTask(body);
    if (!result.ok) {
      toast.error(mode === 'edit' ? 'Could not update task' : 'Could not save task', {
        module: 'Projects',
        description: result.error,
      });
      return false;
    }
    toast.success(mode === 'edit' ? 'Task updated' : 'Task created', { module: 'Projects' });
    if (mode === 'edit' && taskId) router.push(`/projects/tasks/${taskId}`);
    else router.push(backHref);
    return true;
  };

  if (loading) return <PageSkeleton variant="form" label="Loading task form" />;
  if (missing) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        Record not found.{' '}
        <button type="button" onClick={() => router.push('/projects')} className="text-blue-600 font-bold cursor-pointer">
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <AppFormPage
      title={mode === 'edit' ? 'Edit Task' : 'Create New Task'}
      subtitle={mode === 'edit' ? 'Update task details and assignment.' : 'Add task details and assign it to the right person.'}
      onBack={() => router.push(mode === 'edit' && taskId ? `/projects/tasks/${taskId}` : backHref)}
      onSubmit={handleSubmit}
      submitLabel={mode === 'edit' ? 'Save Task' : 'Save Task'}
    >
      <div className={FORM_GRID_CLS}>
        <label>
          <span className={FORM_LABEL_CLS}>Task Name *</span>
          <input className={FORM_INPUT_CLS} value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Enter task name" />
        </label>
        <label>
          <span className={FORM_LABEL_CLS}>Assigned To *</span>
          <select className={FORM_SELECT_CLS} value={form.assignedTo} onChange={(e) => setField('assignedTo', e.target.value)}>
            <option value="">Select team member</option>
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
            maxLength={1000}
            onChange={(e) => setField('description', e.target.value)}
            placeholder="Describe the task"
          />
          <span className="block text-right text-[10px] text-slate-400 mt-1">{form.description.length} / 1000</span>
        </label>
        <label>
          <span className={FORM_LABEL_CLS}>Start Date</span>
          <DateInput value={form.startDate} onChange={(value) => setField('startDate', value)} />
        </label>
        <label>
          <span className={FORM_LABEL_CLS}>Deadline *</span>
          <DateInput value={form.deadline} onChange={(value) => setField('deadline', value)} />
        </label>
        <label>
          <span className={FORM_LABEL_CLS}>Priority *</span>
          <select className={FORM_SELECT_CLS} value={form.priority} onChange={(e) => setField('priority', e.target.value as PmTaskFormValues['priority'])}>
            {PM_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>{PM_STATUS_LABELS[priority]}</option>
            ))}
          </select>
        </label>
        <label>
          <span className={FORM_LABEL_CLS}>Status *</span>
          <select className={FORM_SELECT_CLS} value={form.status} onChange={(e) => setField('status', e.target.value as PmTaskFormValues['status'])}>
            {PM_TASK_STATUSES.map((status) => (
              <option key={status} value={status}>{PM_STATUS_LABELS[status]}</option>
            ))}
          </select>
        </label>
        <div className="md:col-span-2">
          <ImageUploadField
            label="Attachment (optional)"
            value={form.attachmentUrl}
            onChange={(url, publicId) => {
              setField('attachmentUrl', url);
              setField('attachmentPublicId', publicId ?? '');
              setField('attachmentName', url ? url.split('/').pop()?.split('?')[0] ?? 'image' : '');
            }}
          />
        </div>
      </div>
      {form.deadline && form.startDate && form.deadline < form.startDate ? (
        <p className={`${FORM_ALERT_ERROR_CLS} mt-4`}>Deadline cannot be before the start date.</p>
      ) : null}
    </AppFormPage>
  );
}
