export const SUPPLIER_AVATAR_CLS =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white';

export const SUPPLIER_AVATAR_COLORS = [
  'bg-blue-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-teal-500',
];

export function supplierAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return SUPPLIER_AVATAR_COLORS[Math.abs(hash) % SUPPLIER_AVATAR_COLORS.length];
}

export const SUPPLIER_STATUS_BADGE: Record<string, string> = {
  overdue: 'bg-rose-50 text-rose-700 border-rose-200',
  clear: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  payment_due: 'bg-amber-50 text-amber-700 border-amber-200',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const SUPPLIER_STATUS_DOT: Record<string, string> = {
  overdue: 'bg-rose-500',
  clear: 'bg-emerald-500',
  payment_due: 'bg-amber-500',
  inactive: 'bg-slate-400',
};

export const SUPPLIER_BTN_PRIMARY =
  'inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 cursor-pointer transition-colors';

export const SUPPLIER_PILL_ACTIVE = 'bg-blue-600 text-white shadow-sm';
export const SUPPLIER_PILL_INACTIVE = 'bg-slate-100 text-slate-600 hover:bg-slate-200';

export const SUPPLIER_CARD_CLS = 'premium-card premium-shadow rounded-2xl border border-slate-200 bg-white';
