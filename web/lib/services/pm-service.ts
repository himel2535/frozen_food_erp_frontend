import { apiDocId, createResource, deleteResource, updateResource } from '@/lib/services/api-resource-service';
import { invalidateApiListCache } from '@/lib/services/api-list-cache';
import { notifyApiMutation } from '@/lib/services/api-sync-events';
import { apiRequest } from '@/lib/services/api-client';
import { API_RESOURCE_PATHS } from '@/lib/config/data-source';
import type { PmProjectFormValues, PmTaskFormValues } from '@/lib/services/pm-types';
import { EMPTY_PM_PROJECT_FORM, EMPTY_PM_TASK_FORM, PM_STATUS_LABELS } from '@/lib/services/pm-types';

export { EMPTY_PM_PROJECT_FORM, EMPTY_PM_TASK_FORM, PM_STATUS_LABELS };
export type { PmProjectFormValues, PmTaskFormValues } from '@/lib/services/pm-types';

export function isoDateOnly(value: string | Date | undefined | null): string {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export function isPmTaskOverdue(row: Record<string, unknown>, now = new Date()): boolean {
  if (String(row.status ?? '') === 'completed') return false;
  const deadline = isoDateOnly(String(row.deadline ?? ''));
  if (!deadline) return false;
  return deadline < isoDateOnly(now);
}

export function pmProgressBarClass(progress: number): string {
  if (progress >= 100) return 'from-emerald-400 to-emerald-600';
  if (progress < 35) return 'from-amber-400 to-orange-500';
  return 'from-blue-500 to-blue-600';
}

export function mapPmProjectRow(doc: Record<string, unknown>): Record<string, unknown> {
  const id = apiDocId(doc);
  return {
    ...doc,
    id,
    _mongoId: id,
    legacyId: String(doc.legacyId ?? ''),
    name: String(doc.name ?? ''),
    description: String(doc.description ?? ''),
    managerId: String(doc.managerId ?? ''),
    managerName: String(doc.managerName ?? ''),
    startDate: isoDateOnly(String(doc.startDate ?? '')),
    deadline: isoDateOnly(String(doc.deadline ?? '')),
    priority: String(doc.priority ?? 'medium'),
    status: String(doc.status ?? 'planning'),
    progress: Number(doc.progress ?? 0),
    taskCount: Number(doc.taskCount ?? 0),
    completedTaskCount: Number(doc.completedTaskCount ?? 0),
  };
}

export function mapPmTaskRow(doc: Record<string, unknown>): Record<string, unknown> {
  const id = apiDocId(doc);
  const mapped = {
    ...doc,
    id,
    _mongoId: id,
    legacyId: String(doc.legacyId ?? ''),
    projectId: String(doc.projectId ?? ''),
    projectName: String(doc.projectName ?? ''),
    name: String(doc.name ?? ''),
    description: String(doc.description ?? ''),
    assignedTo: String(doc.assignedTo ?? ''),
    assignedToName: String(doc.assignedToName ?? ''),
    assignedToEmail: String(doc.assignedToEmail ?? ''),
    startDate: isoDateOnly(String(doc.startDate ?? '')),
    deadline: isoDateOnly(String(doc.deadline ?? '')),
    priority: String(doc.priority ?? 'medium'),
    status: String(doc.status ?? 'todo'),
    attachmentUrl: String(doc.attachmentUrl ?? ''),
    attachmentPublicId: String(doc.attachmentPublicId ?? ''),
    attachmentName: String(doc.attachmentName ?? ''),
    activity: Array.isArray(doc.activity) ? doc.activity : [],
  };
  return { ...mapped, overdue: isPmTaskOverdue(mapped) };
}

export function mapPmProjectToForm(row: Record<string, unknown>): PmProjectFormValues {
  return {
    name: String(row.name ?? ''),
    description: String(row.description ?? ''),
    managerId: String(row.managerId ?? ''),
    startDate: isoDateOnly(String(row.startDate ?? '')),
    deadline: isoDateOnly(String(row.deadline ?? '')),
    priority: (String(row.priority ?? 'medium') as PmProjectFormValues['priority']),
    status: (String(row.status ?? 'planning') as PmProjectFormValues['status']),
  };
}

export function mapPmTaskToForm(row: Record<string, unknown>): PmTaskFormValues {
  return {
    name: String(row.name ?? ''),
    description: String(row.description ?? ''),
    assignedTo: String(row.assignedTo ?? ''),
    startDate: isoDateOnly(String(row.startDate ?? '')),
    deadline: isoDateOnly(String(row.deadline ?? '')),
    priority: (String(row.priority ?? 'medium') as PmTaskFormValues['priority']),
    status: (String(row.status ?? 'todo') as PmTaskFormValues['status']),
    attachmentUrl: String(row.attachmentUrl ?? ''),
    attachmentPublicId: String(row.attachmentPublicId ?? ''),
    attachmentName: String(row.attachmentName ?? ''),
  };
}

export function pmProjectFormToApi(form: PmProjectFormValues, managerName: string): Record<string, unknown> {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    managerId: form.managerId,
    managerName,
    startDate: form.startDate,
    deadline: form.deadline,
    priority: form.priority,
    status: form.status,
  };
}

export function pmTaskFormToApi(
  form: PmTaskFormValues,
  extras: { projectId: string; projectName: string; assignedToName: string; assignedToEmail: string },
): Record<string, unknown> {
  return {
    projectId: extras.projectId,
    projectName: extras.projectName,
    name: form.name.trim(),
    description: form.description.trim(),
    assignedTo: form.assignedTo,
    assignedToName: extras.assignedToName,
    assignedToEmail: extras.assignedToEmail,
    startDate: form.startDate,
    deadline: form.deadline,
    priority: form.priority,
    status: form.status,
    attachmentUrl: form.attachmentUrl,
    attachmentPublicId: form.attachmentPublicId,
    attachmentName: form.attachmentName,
  };
}

function bumpPmCaches() {
  invalidateApiListCache(API_RESOURCE_PATHS.pmProjects);
  invalidateApiListCache(API_RESOURCE_PATHS.pmTasks);
  invalidateMyPmTasksCache();
  notifyApiMutation(['pmProjects', 'pmTasks']);
}

export type MyPmTasksGroups = {
  overdue: Record<string, unknown>[];
  today: Record<string, unknown>[];
  upcoming: Record<string, unknown>[];
  completed: Record<string, unknown>[];
};

const MY_PM_TASKS_TTL_MS = 60_000;
let myPmTasksCache: { data: MyPmTasksGroups; at: number } | null = null;
let myPmTasksInflight: Promise<MyPmTasksGroups> | null = null;

export function peekMyPmTasks(): MyPmTasksGroups | null {
  if (!myPmTasksCache) return null;
  if (Date.now() - myPmTasksCache.at > MY_PM_TASKS_TTL_MS) {
    myPmTasksCache = null;
    return null;
  }
  return myPmTasksCache.data;
}

export function invalidateMyPmTasksCache() {
  myPmTasksCache = null;
  myPmTasksInflight = null;
}

async function loadMyPmTasksFromApi(): Promise<MyPmTasksGroups> {
  const { data } = await apiRequest<{
    overdue: Record<string, unknown>[];
    today: Record<string, unknown>[];
    upcoming: Record<string, unknown>[];
    completed: Record<string, unknown>[];
  }>('/pm-tasks/my');
  return {
    overdue: (data.overdue ?? []).map(mapPmTaskRow),
    today: (data.today ?? []).map(mapPmTaskRow),
    upcoming: (data.upcoming ?? []).map(mapPmTaskRow),
    completed: (data.completed ?? []).map(mapPmTaskRow),
  };
}

export async function createPmProject(body: Record<string, unknown>) {
  const result = await createResource(API_RESOURCE_PATHS.pmProjects, body);
  if (result.ok) bumpPmCaches();
  return result;
}

export async function updatePmProject(id: string, body: Record<string, unknown>) {
  const result = await updateResource(API_RESOURCE_PATHS.pmProjects, id, body);
  if (result.ok) bumpPmCaches();
  return result;
}

export async function deletePmProject(id: string) {
  const result = await deleteResource(API_RESOURCE_PATHS.pmProjects, id);
  if (result.ok) bumpPmCaches();
  return result;
}

export async function createPmTask(body: Record<string, unknown>) {
  const result = await createResource(API_RESOURCE_PATHS.pmTasks, body);
  if (result.ok) bumpPmCaches();
  return result;
}

export async function updatePmTask(id: string, body: Record<string, unknown>) {
  const result = await updateResource(API_RESOURCE_PATHS.pmTasks, id, body);
  if (result.ok) bumpPmCaches();
  return result;
}

export async function deletePmTask(id: string) {
  const result = await deleteResource(API_RESOURCE_PATHS.pmTasks, id);
  if (result.ok) bumpPmCaches();
  return result;
}

export async function patchPmTaskStatus(id: string, status: string) {
  const { data } = await apiRequest<Record<string, unknown>>(`/pm-tasks/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  bumpPmCaches();
  return data;
}

export async function fetchPmProjectSummary() {
  const { data } = await apiRequest<{
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    overdueTasks: number;
  }>('/pm-projects/summary');
  return data;
}

export async function fetchMyPmTasks(force = false): Promise<MyPmTasksGroups> {
  if (!force) {
    const cached = peekMyPmTasks();
    if (cached) return cached;
    if (myPmTasksInflight) return myPmTasksInflight;
  }

  const req = loadMyPmTasksFromApi()
    .then((data) => {
      myPmTasksCache = { data, at: Date.now() };
      return data;
    })
    .finally(() => {
      myPmTasksInflight = null;
    });

  if (!force) myPmTasksInflight = req;
  return req;
}

export async function fetchPmTeamOverview(query?: { employeeId?: string; projectId?: string; search?: string }) {
  const params = new URLSearchParams();
  if (query?.employeeId && query.employeeId !== 'all') params.set('employeeId', query.employeeId);
  if (query?.projectId && query.projectId !== 'all') params.set('projectId', query.projectId);
  if (query?.search?.trim()) params.set('search', query.search.trim());
  const qs = params.toString();
  const { data } = await apiRequest<{
    rows: Record<string, unknown>[];
    totals: {
      totalEmployees: number;
      totalTasks: number;
      pending: number;
      inProgress: number;
      completed: number;
      overdue: number;
    };
  }>(`/pm-tasks/team-overview${qs ? `?${qs}` : ''}`);
  return data;
}

export function validatePmProjectForm(form: PmProjectFormValues): string | null {
  if (!form.name.trim()) return 'Project name is required.';
  if (!form.managerId) return 'Project manager is required.';
  if (!form.startDate) return 'Start date is required.';
  if (!form.deadline) return 'Deadline is required.';
  if (form.deadline < form.startDate) return 'Deadline cannot be before the start date.';
  return null;
}

export function validatePmTaskForm(form: PmTaskFormValues): string | null {
  if (!form.name.trim()) return 'Task name is required.';
  if (!form.assignedTo) return 'Assigned employee is required.';
  if (!form.deadline) return 'Deadline is required.';
  if (form.startDate && form.deadline < form.startDate) return 'Deadline cannot be before the start date.';
  return null;
}
