export const SR_STACK = 'space-y-2';

export const SR_GRID_5 = 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2';

export const SR_CHARTS_ROW = 'grid grid-cols-1 lg:grid-cols-4 gap-2';

export const SR_CARD = 'premium-card premium-shadow p-4';

export const SR_SECTION_HEADER = 'flex items-center gap-2 mb-4';

export const SR_TITLE = 'text-sm font-bold text-slate-900 tracking-tight';

export const SR_FILTER_INPUT =
  'bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500';

export const SR_STATUS_SLICE = {
  paid: { from: '#10b981', to: '#059669', label: 'Paid' },
  unpaid: { from: '#f97316', to: '#ea580c', label: 'Unpaid' },
  partial: { from: '#3b82f6', to: '#2563eb', label: 'Partial' },
  cancelled: { from: '#94a3b8', to: '#64748b', label: 'Cancelled' },
} as const;

export type SalesPrintSectionId =
  | 'metrics'
  | 'revenue'
  | 'status'
  | 'customers'
  | 'transactions'
  | 'full';
