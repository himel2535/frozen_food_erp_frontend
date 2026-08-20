export const CF_LABEL_CLS =
  'block mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500';

export const CF_INPUT_WRAP_CLS =
  'relative flex items-center';

export const CF_INPUT_CLS =
  'w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200/90 bg-white text-xs font-medium text-slate-800 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-slate-400';

export const CF_SELECT_CLS = `${CF_INPUT_CLS} cursor-pointer appearance-none`;

export const CF_TEXTAREA_CLS = `${CF_INPUT_CLS} resize-y min-h-[72px] pt-2.5`;

export const CF_ICON_CLS =
  'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none';

export const CF_ICON_TEXTAREA_CLS =
  'absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none';

export const CF_BTN_PRIMARY =
  'inline-flex items-center gap-2 btn-premium-3d-green text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-600/30 transition-all select-none';

export const CF_BTN_OUTLINE =
  'inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer hover:bg-emerald-100/70 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all select-none';

export const CF_BTN_GHOST =
  'inline-flex items-center gap-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-500/20 transition-all select-none';

export const CF_FOOTER_CLS =
  'sticky bottom-0 z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-4 -mx-2 md:-mx-4 mt-6 border-t border-slate-200/80 bg-white/85 backdrop-blur-md';

export const CF_SECTION_BADGE_CLS =
  'flex items-center justify-center w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-extrabold shrink-0';

export const CF_SUB_PANEL_CLS =
  'rounded-xl border border-slate-200/90 bg-white/70 p-3 w-full';

export const CF_FIELD_ERROR_CLS =
  'mt-1 text-[10px] font-semibold text-rose-600';

export const CF_INPUT_ERROR_CLS =
  'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20';

export const CF_ADDRESS_PANEL_CLS =
  'rounded-xl border border-slate-200/90 bg-white/70 p-3 h-full flex flex-col min-h-0';

export const CF_ADDRESS_PANEL_HEADER_CLS =
  'flex items-center gap-2.5 shrink-0';

export const CF_ADDRESS_PANEL_HEADER_BLOCK_CLS =
  'shrink-0 mb-3 min-h-[48px]';

export const CF_ADDRESS_SAME_AS_CLS =
  'flex items-center gap-1.5 mt-1.5 pl-[42px] text-[10px] font-bold text-slate-600 cursor-pointer';

export const CF_ADDRESS_HEADER_SPACER_CLS =
  'mt-1.5 pl-[42px] h-[18px]';

export const CF_ADDRESS_ICON_BADGE_CLS =
  'flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 shrink-0';

export const CF_ADDRESS_FIELD_BASE_CLS =
  'w-full px-4 py-2 rounded-xl border border-slate-200/90 bg-white text-xs font-medium text-slate-800 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-slate-400 disabled:bg-slate-50/80 disabled:text-slate-500 disabled:cursor-not-allowed';

export const CF_ADDRESS_TEXTAREA_CLS =
  `${CF_ADDRESS_FIELD_BASE_CLS} resize-none min-h-[72px] h-[72px]`;

export const CF_ADDRESS_SELECT_CLS =
  `${CF_ADDRESS_FIELD_BASE_CLS} h-[42px] cursor-pointer appearance-none bg-[length:16px] bg-[position:right_12px_center] bg-no-repeat pr-10`;

export const CF_ADDRESS_SELECT_BG =
  "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2394a3b8%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E')]";

export const CF_ADDRESS_PANEL_DISABLED_CLS =
  'opacity-60 bg-slate-50/40 pointer-events-none';
