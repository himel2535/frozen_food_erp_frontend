export type CustomerDueDetailTab = 'overview' | 'followups' | 'invoices' | 'payments';

export type FollowUpPageTab = 'timeline' | 'followups' | 'invoices' | 'payments' | 'notes' | 'documents';

export type FollowUpPageView = 'timeline' | 'add-form';

export type CustomerDueStatusFilter =
  | 'all'
  | 'my_tasks'
  | 'today'
  | 'overdue'
  | 'promised'
  | 'missed'
  | 'all_due'
  | 'due_soon'
  | 'paid';

export type CustomerDueViewMode = 'list' | 'grid';
