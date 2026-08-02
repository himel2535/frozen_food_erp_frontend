export {
  SS_CARD_CLS as PD_CARD_CLS,
  SS_BTN_PRIMARY as PD_BTN_PRIMARY,
  SS_BTN_OUTLINE as PD_BTN_OUTLINE,
  SS_BTN_GHOST as PD_BTN_GHOST,
  SS_FILTER_INPUT_CLS as PD_FILTER_INPUT_CLS,
  SS_INFO_BOX_CLS as PD_INFO_BOX_CLS,
} from '@/components/modules/payroll/salary-sheet/salary-sheet-styles';

export const PD_STATUS_BADGE: Record<string, string> = {
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  partial: 'bg-orange-50 text-orange-700 border-orange-100',
  unpaid: 'bg-rose-50 text-rose-700 border-rose-100',
  notProcessed: 'bg-slate-50 text-slate-500 border-slate-100',
};

export const PD_STATUS_LABEL: Record<string, string> = {
  paid: 'Paid',
  partial: 'Partial Paid',
  unpaid: 'Unpaid',
  notProcessed: 'Not Processed',
};

export const PD_SIDEBAR_CARD_CLS = 'premium-card premium-shadow p-3.5 space-y-2';

export const PD_CHART_SLICE = {
  paid: { from: '#34d399', to: '#059669' },
  partial: { from: '#fb923c', to: '#ea580c' },
  unpaid: { from: '#f87171', to: '#dc2626' },
  notProcessed: { from: '#cbd5e1', to: '#64748b' },
} as const;

export const PD_VIEW_ALL_BTN_CLS =
  'inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer';

export const PD_EXPORT_BTN_CLS =
  'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors';
