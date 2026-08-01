export {
  INV_BTN_PRIMARY as PO_BTN_PRIMARY,
  INV_BTN_OUTLINE as PO_BTN_OUTLINE,
  INV_BTN_GHOST as PO_BTN_GHOST,
  INV_LABEL_CLS as PO_LABEL_CLS,
  INV_INPUT_CLS as PO_INPUT_CLS,
  INV_SUMMARY_CLS as PO_SUMMARY_CLS,
  INV_TABLE_HEAD_CLS as PO_TABLE_HEAD_CLS,
  INV_ADD_ROW_CLS as PO_ADD_ROW_CLS,
  INV_ADD_ITEM_BTN_CLS as PO_ADD_ITEM_BTN_CLS,
} from '@/components/modules/sales/invoice-form/inv-form-styles';

export const PO_CARD_CLS = 'premium-card premium-shadow p-4 md:p-5 space-y-3';

export const PO_CARD_COMPACT_CLS = 'premium-card premium-shadow p-3 md:p-4 space-y-2';

export const PO_SECTION_TITLE_CLS = 'text-sm font-extrabold text-slate-900 tracking-tight';

export const PO_SIDEBAR_CARD_CLS = 'premium-card premium-shadow p-4 space-y-3';

export const PO_CELL_INPUT_CLS =
  'w-full min-w-0 px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

export const PO_CELL_SELECT_CLS = `${PO_CELL_INPUT_CLS} cursor-pointer appearance-none`;
