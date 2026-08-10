/** Pastel POS action button styles */

export const POS_QUICK_ACTIONS = [
  {
    key: 'barcode',
    bg: 'bg-sky-50/95 hover:bg-sky-100/95',
    border: 'border-sky-200/80 hover:border-sky-300/80',
    text: 'text-sky-800',
    icon: 'text-sky-600',
  },
  {
    key: 'discount',
    bg: 'bg-violet-50/95 hover:bg-violet-100/95',
    border: 'border-violet-200/80 hover:border-violet-300/80',
    text: 'text-violet-800',
    icon: 'text-violet-600',
  },
  {
    key: 'tax',
    bg: 'bg-amber-50/95 hover:bg-amber-100/95',
    border: 'border-amber-200/80 hover:border-amber-300/80',
    text: 'text-amber-800',
    icon: 'text-amber-600',
  },
  {
    key: 'print',
    bg: 'bg-emerald-50/95 hover:bg-emerald-100/95',
    border: 'border-emerald-200/80 hover:border-emerald-300/80',
    text: 'text-emerald-800',
    icon: 'text-emerald-600',
  },
  {
    key: 'drawer',
    bg: 'bg-rose-50/95 hover:bg-rose-100/95',
    border: 'border-rose-200/80 hover:border-rose-300/80',
    text: 'text-rose-800',
    icon: 'text-rose-600',
  },
] as const;

export function posQuickActionClass(index: number) {
  const tone = POS_QUICK_ACTIONS[index] ?? POS_QUICK_ACTIONS[0];
  return `premium-shadow inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-[11px] font-bold cursor-pointer transition-all ${tone.bg} ${tone.border} ${tone.text}`;
}

export const POS_BTN_PRIMARY =
  'bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-45 disabled:cursor-not-allowed text-white text-sm font-extrabold cursor-pointer transition-all shadow-sm shadow-blue-600/20';

export const POS_BTN_DRAFT =
  'px-3 py-2 rounded-xl border border-indigo-200/80 bg-indigo-50/90 hover:bg-indigo-100/90 text-[11px] font-bold text-indigo-800 cursor-pointer transition-colors';

export const POS_BTN_MORE =
  'px-3 py-2 rounded-xl border border-slate-200/80 bg-slate-50/90 hover:bg-slate-100/90 text-[11px] font-bold text-slate-700 cursor-pointer transition-colors';
