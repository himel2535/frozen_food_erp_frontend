export const FR_STACK = 'space-y-2';

export const FR_GRID_3 = 'grid grid-cols-1 md:grid-cols-3 gap-2';

export const FR_MIDDLE_ROW = 'grid grid-cols-1 xl:grid-cols-3 gap-2';

export const FR_BOTTOM_ROW = 'grid grid-cols-1 lg:grid-cols-3 gap-2';

export const FR_CARD = 'premium-card premium-shadow p-4';

export const FR_FILTER_INPUT =
  'bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500';

export const FR_EXPENSE_SLICE = {
  COGS: { from: '#3b82f6', to: '#2563eb' },
  Expense: { from: '#10b981', to: '#059669' },
  'Operating Expenses': { from: '#10b981', to: '#059669' },
  'Other Expenses': { from: '#f97316', to: '#ea580c' },
} as const;

export type FinancialPrintSectionId =
  | 'metrics'
  | 'summary'
  | 'trend'
  | 'expenseChart'
  | 'cashFlow'
  | 'categorySummary'
  | 'full';
