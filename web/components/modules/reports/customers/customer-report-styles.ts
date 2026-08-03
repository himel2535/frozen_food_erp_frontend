export const CR_STACK = 'space-y-2';

export const CR_GRID_5 = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2';

export const CR_ANALYTICS_ROW = 'grid grid-cols-1 lg:grid-cols-3 gap-2';

export const CR_CARD = 'premium-card premium-shadow p-4';

export const CR_FILTER_INPUT =
  'bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500';

export const CR_CUSTOMER_SLICE = {
  'Thomas Edison': { from: '#3b82f6', to: '#2563eb' },
  'Marie Curie': { from: '#f97316', to: '#ea580c' },
  'Alexander Graham': { from: '#10b981', to: '#059669' },
} as const;

export const CR_STATUS_SLICE = {
  active: { from: '#10b981', to: '#059669' },
  overdue: { from: '#ef4444', to: '#dc2626' },
} as const;

export type CustomerPrintSectionId =
  | 'metrics'
  | 'summary'
  | 'salesChart'
  | 'outstandingChart'
  | 'statusChart'
  | 'activity'
  | 'full';
