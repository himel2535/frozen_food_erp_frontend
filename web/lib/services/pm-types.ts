export const PM_PROJECT_STATUSES = ['planning', 'active', 'on-hold', 'completed'] as const;
export const PM_TASK_STATUSES = ['todo', 'in-progress', 'completed'] as const;
export const PM_PRIORITIES = ['low', 'medium', 'high'] as const;

export type PmProjectStatus = (typeof PM_PROJECT_STATUSES)[number];
export type PmTaskStatus = (typeof PM_TASK_STATUSES)[number];
export type PmPriority = (typeof PM_PRIORITIES)[number];

export type PmProjectFormValues = {
  name: string;
  description: string;
  managerId: string;
  startDate: string;
  deadline: string;
  priority: PmPriority;
  status: PmProjectStatus;
};

export type PmTaskFormValues = {
  name: string;
  description: string;
  assignedTo: string;
  startDate: string;
  deadline: string;
  priority: PmPriority;
  status: PmTaskStatus;
  attachmentUrl: string;
  attachmentPublicId: string;
  attachmentName: string;
};

export const EMPTY_PM_PROJECT_FORM: PmProjectFormValues = {
  name: '',
  description: '',
  managerId: '',
  startDate: '',
  deadline: '',
  priority: 'medium',
  status: 'planning',
};

export const EMPTY_PM_TASK_FORM: PmTaskFormValues = {
  name: '',
  description: '',
  assignedTo: '',
  startDate: '',
  deadline: '',
  priority: 'medium',
  status: 'todo',
  attachmentUrl: '',
  attachmentPublicId: '',
  attachmentName: '',
};

export const PM_STATUS_LABELS: Record<string, string> = {
  planning: 'Planning',
  active: 'Active',
  'on-hold': 'On Hold',
  completed: 'Completed',
  todo: 'To Do',
  'in-progress': 'In Progress',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};
