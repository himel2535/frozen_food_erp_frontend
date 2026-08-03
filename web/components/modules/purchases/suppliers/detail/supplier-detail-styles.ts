export const SD_PAGE_LINK = 'text-sm font-bold text-slate-600 hover:text-blue-700 cursor-pointer transition-colors';

export const SD_CARD = 'premium-card premium-shadow rounded-2xl border border-slate-200 bg-white p-5';

export const SD_CARD_STRETCH = `${SD_CARD} flex flex-col h-full`;

export const SD_OVERVIEW_GRID = 'grid grid-cols-1 xl:grid-cols-3 gap-4 items-stretch pt-4';

export const SD_OVERVIEW_COL = 'flex flex-col gap-4 h-full min-h-0';

export const SD_CARD_TITLE = 'text-sm font-extrabold text-slate-900';

export const SD_LABEL = 'text-[11px] font-bold uppercase tracking-wide text-slate-500';

export const SD_VALUE = 'text-sm font-semibold text-slate-800';

export const SD_METRIC_LABEL = 'text-xs font-bold text-slate-500 tracking-wide';

export const SD_METRIC_VALUE = 'text-xl font-extrabold tracking-tight text-slate-900';

export const SD_TAB_BAR = 'premium-card premium-shadow rounded-2xl bg-slate-50/90 px-2 pt-2 mt-3 overflow-x-auto';

export const SD_TAB_ACTIVE = 'text-blue-600 bg-white border-b-2 border-blue-600 font-bold shadow-sm';

export const SD_TAB_INACTIVE = 'text-slate-500 border-b-2 border-transparent font-semibold hover:bg-white/60 hover:text-slate-700';

export const SD_CREDIT_BAR = 'rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs';

export const SD_BTN_PRIMARY = 'inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 cursor-pointer transition-colors';

export const SD_BTN_OUTLINE = 'inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-4 py-2.5 cursor-pointer transition-colors';

export const SD_BTN_GREEN = 'inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-4 py-2.5 cursor-pointer transition-colors';

export const BILL_STATUS_BADGE: Record<string, string> = {
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  sky: 'bg-sky-50 text-sky-700 border-sky-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export function supplierDetailInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function formatDetailDate(iso: string) {
  if (!iso || iso === '—') return '—';
  const d = new Date(iso.includes('T') ? iso : `${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDetailDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
