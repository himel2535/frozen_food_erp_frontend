export const SR_STACK = 'space-y-2';

export const SR_GRID_5 = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2';

export const SR_ANALYTICS_ROW = 'grid grid-cols-1 lg:grid-cols-3 gap-2';

export const SR_BOTTOM_ROW = 'grid grid-cols-1 lg:grid-cols-3 gap-2';

export const SR_CARD = 'premium-card premium-shadow p-4';

export const SR_FILTER_INPUT =
  'bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500';

export const SR_SUPPLIER_SLICE = {
  'Apex Yarns Ltd': { from: '#3b82f6', to: '#2563eb' },
  'Global Dye Chemicals': { from: '#10b981', to: '#059669' },
} as const;

export const SR_PAYABLES_STATUS_SLICE = {
  clear: { from: '#10b981', to: '#059669' },
  outstanding: { from: '#ef4444', to: '#dc2626' },
} as const;

export type SupplierPrintSectionId =
  | 'metrics'
  | 'purchasesChart'
  | 'payablesChart'
  | 'payablesStatusChart'
  | 'summary'
  | 'activity'
  | 'full';
