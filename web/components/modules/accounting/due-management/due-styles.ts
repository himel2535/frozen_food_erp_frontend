export const DUE_BTN_RECEIVE =
  'inline-flex items-center justify-center rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all select-none cursor-pointer';

export const DUE_AVATAR_CLS =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-extrabold';

export const DUE_PANEL_CLS = 'premium-card premium-shadow p-4 sticky top-3 space-y-4';

export const DUE_STATUS_BADGE: Record<string, string> = {
  due_today: 'bg-amber-100 text-amber-700 border-amber-200',
  overdue: 'bg-rose-100 text-rose-700 border-rose-200',
  partial: 'bg-sky-100 text-sky-700 border-sky-200',
  upcoming: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export const DUE_TAB_ACTIVE = 'border-b-2 border-indigo-600 text-indigo-700 font-bold';
export const DUE_TAB_INACTIVE = 'border-b-2 border-transparent text-slate-500 font-semibold hover:text-slate-700 cursor-pointer';
