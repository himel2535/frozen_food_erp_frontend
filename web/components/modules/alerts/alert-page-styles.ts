import type { AlertCategory } from '@/lib/services/business-alert-types';

export const ALERT_BRAND_BLUE = '#3B4B95';

export const ALERT_FILTER_ROW = 'flex flex-wrap items-center gap-2 overflow-x-auto pb-1';

export const ALERT_FILTER_PILL =
  'inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer shrink-0';

export const ALERT_FILTER_PILL_ACTIVE =
  'inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold text-white border transition-colors cursor-pointer shrink-0 bg-[#3B4B95] border-[#3B4B95]';

export const ALERT_PAGE_ICON_BOX =
  'w-14 h-14 rounded-full bg-[#3B4B95] flex items-center justify-center shrink-0 shadow-md shadow-indigo-900/20';

export const ALERT_CARD =
  'premium-card premium-shadow p-4 rounded-2xl border border-slate-200/80 bg-white h-full hover:shadow-md transition-shadow';

export const ALERT_CARD_GRID =
  'grid grid-cols-2 border border-slate-200 rounded-xl overflow-hidden divide-x divide-y divide-slate-200 w-full min-w-0 self-stretch';

export const ALERT_CARD_BODY =
  'grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_11rem] gap-3 w-full items-stretch';

export const ALERT_CARD_GRID_CELL = 'p-3.5 min-w-0 bg-white';

export const ALERT_ACTIONS_COLUMN = 'flex flex-col gap-2 w-full self-stretch';

export const ALERT_BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 w-full flex-1 px-4 py-2.5 rounded-xl bg-[#3B4B95] hover:bg-[#334585] text-white text-xs font-bold transition-colors cursor-pointer';

export const ALERT_BTN_OUTLINE =
  'inline-flex items-center justify-center gap-2 w-full flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer';

export const ALERT_PRIORITY_BADGE_CRITICAL =
  'inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200';

export const ALERT_PRIORITY_BADGE_WARNING =
  'inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200';

export const ALERT_PRIORITY_BADGE_INFO =
  'inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200';

export const ALERT_BTN_VIEW = ALERT_BTN_OUTLINE;

export const ALERT_BTN_ICON =
  'inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shrink-0 self-end lg:self-auto';

export const ALERT_BTN_ICON_COMPACT =
  'inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shrink-0';

export const ALERT_COUNT_BADGE =
  'inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-extrabold';

export const ALERT_COUNT_BADGE_ACTIVE =
  'inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-white/25 text-white text-[10px] font-extrabold';

export const ALERT_DROPDOWN_PANEL =
  'absolute right-0 top-full mt-2 w-[400px] max-w-[calc(100vw-2rem)] rounded-2xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-2xl z-50 overflow-hidden';

export const ALERT_DROPDOWN_ITEM =
  'block px-4 py-3 hover:bg-slate-50/80 transition-colors cursor-pointer border-b border-slate-100 last:border-b-0 border-l-[3px]';

export const CATEGORY_FILTER_DOT: Record<AlertCategory, string> = {
  customer_due: 'bg-rose-500',
  lead_followup: 'bg-amber-400',
  low_stock: 'bg-red-500',
  pending_purchase: 'bg-blue-500',
  production: 'bg-orange-500',
  payment_collection: 'bg-emerald-500',
  supplier_due: 'bg-violet-500',
};

export const CATEGORY_BORDER_ACCENT: Record<AlertCategory, string> = {
  customer_due: 'border-l-rose-400',
  lead_followup: 'border-l-amber-400',
  low_stock: 'border-l-red-500',
  pending_purchase: 'border-l-blue-500',
  production: 'border-l-orange-500',
  payment_collection: 'border-l-emerald-500',
  supplier_due: 'border-l-violet-500',
};

export function categoryFilterDotClass(category: AlertCategory): string {
  return CATEGORY_FILTER_DOT[category] ?? 'bg-slate-400';
}

export function categoryBorderAccentClass(category: AlertCategory): string {
  return CATEGORY_BORDER_ACCENT[category] ?? 'border-l-slate-300';
}

export function priorityBadgeClassName(priority: 'critical' | 'warning' | 'info'): string {
  if (priority === 'critical') return ALERT_PRIORITY_BADGE_CRITICAL;
  if (priority === 'warning') return ALERT_PRIORITY_BADGE_WARNING;
  return ALERT_PRIORITY_BADGE_INFO;
}
