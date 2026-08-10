export {
  MODULE_FILTER_ACTION_BTN as RP_FILTER_ACTION_BTN,
  MODULE_FILTER_BAR as RP_FILTER_BAR,
  MODULE_FILTER_INPUT as RP_FILTER_INPUT,
  MODULE_FILTER_SEARCH as RP_FILTER_SEARCH,
  MODULE_PRINT_BTN as RP_PRINT_FULL_BTN,
  MODULE_PRINT_BTN_SM as RP_BTN,
} from '@/lib/ui/module-chrome-styles';

export const RP_ROOT = 'report-print-root';

export const RP_HEADER = 'flex items-center justify-between gap-2';

export const RP_PRINT_BODY = 'report-print-body';

export const RP_PRINT_SECTION = 'report-print-section';

export const RP_PRINT_TABLE = 'w-full border-collapse text-[11px]';

export const RP_PRINT_TH =
  'border border-slate-200 bg-slate-50 px-3 py-2 text-left font-bold text-slate-700';

export const RP_PRINT_TD = 'border border-slate-200 px-3 py-2 text-slate-800';

export type ReportPrintSectionId = 'metrics' | 'chart' | 'status' | 'suppliers' | 'orders' | 'full';
