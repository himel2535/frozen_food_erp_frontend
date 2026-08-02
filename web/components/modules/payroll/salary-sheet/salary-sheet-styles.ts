export {
  PO_CELL_INPUT_CLS as SS_CELL_INPUT_CLS,
  PO_TABLE_HEAD_CLS as SS_TABLE_HEAD_CLS,
  PO_BTN_PRIMARY as SS_BTN_PRIMARY,
  PO_BTN_OUTLINE as SS_BTN_OUTLINE,
  PO_BTN_GHOST as SS_BTN_GHOST,
  PO_CARD_CLS as SS_CARD_CLS,
  PO_SECTION_TITLE_CLS as SS_SECTION_TITLE_CLS,
} from '@/components/modules/purchases/purchase-order-form/po-form-styles';

export const SS_INFO_BOX_CLS =
  'rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-xs font-medium text-blue-900';

export const SS_FILTER_INPUT_CLS =
  'bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500';

export const SS_EXTRA_PAY_BADGE: Record<string, string> = {
  Overtime: 'bg-violet-50 text-violet-700 border-violet-100',
  Production: 'bg-amber-50 text-amber-700 border-amber-100',
  Both: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  None: 'bg-slate-50 text-slate-500 border-slate-100',
};

export const SS_STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  partial: 'bg-orange-50 text-orange-700 border-orange-100',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

/** Fixed column widths for table-fixed layout (19 columns — # merged into Employee). */
export const SS_TABLE_COL_WIDTHS = [
  212, // Employee (includes row #)
  96,  // Basic Salary
  48, 48, 48, 48, // Attendance
  84, 84, // Advance
  80,  // Extra Pay
  52, 80, 92, // Overtime
  48, 92, // Bonus
  84, 92, // Deductions
  104, // Net Salary
  80,  // Status
  116, // Action
] as const;

export const SS_TABLE_MIN_WIDTH = SS_TABLE_COL_WIDTHS.reduce((sum, w) => sum + w, 0);

export const SS_TABLE_CARD_CLS = 'premium-card premium-shadow overflow-hidden';

export const SS_TABLE_TOOLBAR_CLS =
  'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 border-b border-slate-100 bg-white';

export const SS_TABLE_SCROLL_CLS = 'overflow-x-auto overscroll-x-contain -mx-px';

export const SS_TABLE_LAYOUT_CLS = 'w-full table-fixed border-collapse text-sm';

export const SS_TABLE_CELL_CLS = 'px-2 py-2 align-middle';

export const SS_CELL_EDIT_BASE_CLS =
  'w-full px-1.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 text-left focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

export const SS_CELL_EDIT_DAY_CLS = `${SS_CELL_EDIT_BASE_CLS} tabular-nums`;

export const SS_CELL_EDIT_MONEY_CLS = `${SS_CELL_EDIT_BASE_CLS} tabular-nums`;

export const SS_CELL_EDIT_PCT_CLS = `${SS_CELL_EDIT_BASE_CLS} tabular-nums`;

/** @deprecated Use SS_CELL_EDIT_DAY_CLS / SS_CELL_EDIT_MONEY_CLS instead */
export const SS_CELL_EDIT_CLS = SS_CELL_EDIT_DAY_CLS;

export const SS_CELL_READONLY_CLS = 'text-xs font-semibold text-slate-700 tabular-nums whitespace-nowrap text-left';

export const SS_CELL_READONLY_MUTED_CLS = 'text-xs font-medium text-slate-500 tabular-nums whitespace-nowrap text-left';

export const SS_TABLE_GROUP_ATTENDANCE = 'bg-sky-50/40';

export const SS_TABLE_GROUP_ADVANCE = 'bg-amber-50/40';

export const SS_TABLE_GROUP_OT = 'bg-violet-50/40';

export const SS_TABLE_GROUP_BONUS = 'bg-orange-50/40';

export const SS_TABLE_GROUP_DEDUCTION = 'bg-rose-50/40';

export const SS_TABLE_STICKY_EMPLOYEE_CLS =
  'sticky left-0 z-10 shadow-[4px_0_8px_-4px_rgba(15,23,42,0.08)]';

export const SS_TABLE_FOOTER_CLS = 'bg-slate-50/80 border-t border-slate-200 font-bold text-slate-800';

export const SS_TABLE_HEAD_GROUP_CLS =
  'px-2 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-600 border-l border-slate-200';

export const SS_TABLE_HEAD_SUB_CLS =
  'px-2 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500 border-l border-slate-100';

export const SS_ACTION_BTN_CLS =
  'inline-flex w-full items-center justify-center px-1.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-[10px] font-bold text-blue-700 hover:bg-blue-100 hover:border-blue-300 cursor-pointer whitespace-nowrap transition-colors';

export const SS_ACTION_BTN_PAID_CLS =
  'inline-flex w-full items-center justify-center px-1.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[10px] font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 cursor-pointer whitespace-nowrap transition-colors';
