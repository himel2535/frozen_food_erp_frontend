export const PR_STACK = 'space-y-2';

export const PR_GRID_5 = 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2';

export const PR_CHARTS_ROW = 'grid grid-cols-1 lg:grid-cols-4 gap-2';

export const PR_CARD = 'premium-card premium-shadow p-4';

export const PR_SECTION_HEADER = 'flex items-center justify-between gap-2 mb-4';

export const PR_TITLE = 'text-sm font-bold text-slate-900 tracking-tight';

export const PR_FILTER_INPUT =
  'bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500';

export const PR_STATUS_SLICE = {
  received: { from: '#10b981', to: '#059669', label: 'Received' },
  pending: { from: '#f97316', to: '#ea580c', label: 'Pending' },
  cancelled: { from: '#94a3b8', to: '#64748b', label: 'Cancelled' },
} as const;
