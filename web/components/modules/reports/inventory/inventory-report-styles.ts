export const IR_STACK = 'space-y-2';

export const IR_GRID_4 = 'grid grid-cols-2 md:grid-cols-4 gap-2';

export const IR_ANALYTICS_ROW = 'grid grid-cols-1 lg:grid-cols-3 gap-2';

export const IR_CARD = 'premium-card premium-shadow p-4';

export const IR_FILTER_INPUT =
  'bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500';

export const IR_CATEGORY_SLICE = {
  'Raw Materials': { from: '#3b82f6', to: '#2563eb' },
  'Finished Goods': { from: '#10b981', to: '#059669' },
  Accessories: { from: '#f97316', to: '#ea580c' },
} as const;

export const IR_WAREHOUSE_SLICE = {
  'Main Warehouse': { from: '#6366f1', to: '#4f46e5' },
  'Factory Floor': { from: '#06b6d4', to: '#0891b2' },
} as const;

export type InventoryPrintSectionId =
  | 'metrics'
  | 'details'
  | 'category'
  | 'warehouse'
  | 'movement'
  | 'alerts'
  | 'full';
