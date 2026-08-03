export const RP_ROOT = 'report-print-root';

export const RP_BTN =
  'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer shrink-0';

export const RP_HEADER = 'flex items-center justify-between gap-2';

export const RP_PRINT_BODY = 'report-print-body';

export const RP_PRINT_SECTION = 'report-print-section';

export const RP_PRINT_TABLE =
  'w-full border-collapse text-[11px]';

export const RP_PRINT_TH =
  'border border-slate-200 bg-slate-50 px-3 py-2 text-left font-bold text-slate-700';

export const RP_PRINT_TD =
  'border border-slate-200 px-3 py-2 text-slate-800';

export type ReportPrintSectionId = 'metrics' | 'chart' | 'status' | 'suppliers' | 'orders' | 'full';
