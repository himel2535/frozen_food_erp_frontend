export const HR_STACK = 'space-y-2';

export const HR_GRID_2 = 'grid grid-cols-1 md:grid-cols-2 gap-2';

export const HR_CHARTS_ROW = 'grid grid-cols-1 lg:grid-cols-3 gap-2';

export const HR_BOTTOM_ROW = 'grid grid-cols-1 lg:grid-cols-3 gap-2';

export const HR_CARD = 'premium-card premium-shadow p-4';

export const HR_FILTER_INPUT =
  'bg-white/45 border border-blue-100/70 text-xs font-semibold rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-400/60 text-slate-700';

export const HR_DEPT_SLICE = {
  IT: { from: '#3b82f6', to: '#2563eb' },
  Production: { from: '#10b981', to: '#059669' },
  Sales: { from: '#f97316', to: '#ea580c' },
  HR: { from: '#8b5cf6', to: '#7c3aed' },
} as const;

export const HR_GENDER_SLICE = {
  Male: { from: '#3b82f6', to: '#2563eb' },
  Female: { from: '#ec4899', to: '#db2777' },
} as const;

export type HrPrintSectionId =
  | 'metrics'
  | 'departments'
  | 'keyMetrics'
  | 'deptChart'
  | 'genderChart'
  | 'joinersTrend'
  | 'joiners'
  | 'leavers'
  | 'birthdays'
  | 'full';
