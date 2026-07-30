export const FORM_INPUT_CLS =
  'w-full px-4 py-2.5 rounded-xl border border-slate-200/90 bg-white text-xs font-medium text-slate-800 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-slate-400';

export const FORM_SELECT_CLS = `${FORM_INPUT_CLS} cursor-pointer`;

export const FORM_TEXTAREA_CLS = `${FORM_INPUT_CLS} resize-y min-h-[88px]`;

export const FORM_LABEL_CLS =
  'block mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500';

export const FORM_GRID_CLS =
  'grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5 text-xs font-semibold text-slate-700';

export const FORM_CARD_CLS = 'premium-card premium-shadow p-6 space-y-6';

export const FORM_BTN_PRIMARY =
  'bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm shadow-blue-600/20 cursor-pointer transition-all';

export const FORM_BTN_SECONDARY =
  'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-5 py-2.5 rounded-xl shadow-sm cursor-pointer transition-all';

export const FORM_FOOTER_CLS = 'flex justify-end gap-3 pt-4 border-t border-slate-100/80';

export const FORM_MODAL_BACKDROP_CLS =
  'fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6';

export const FORM_MODAL_BACKDROP_INNER_CLS =
  'absolute inset-0 bg-slate-900/45 backdrop-blur-sm cursor-pointer';

export const FORM_MODAL_PANEL_CLS =
  'relative w-full premium-card premium-shadow flex flex-col max-h-[min(90vh,820px)] overflow-hidden';

export const FORM_MODAL_HEADER_CLS =
  'flex items-start justify-between gap-3 px-6 pt-6 pb-4 border-b border-slate-100/80 shrink-0';

export const FORM_MODAL_BODY_CLS = 'overflow-y-auto flex-1 px-6 py-5 space-y-5 min-h-0';

export const FORM_MODAL_FOOTER_CLS =
  'flex justify-end gap-3 px-6 py-4 border-t border-slate-100/80 bg-white/80 backdrop-blur-sm shrink-0';

export const FORM_MODAL_SIZE_CLS = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
} as const;
