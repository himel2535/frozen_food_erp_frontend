import type { BalanceSheetSection, BalanceSheetStatus, BalanceSheetType } from '@/lib/services/balance-sheet-service';

export interface BalanceSheetFormState {
  lineItem: string;
  section: string;
  type: string;
  amount: string;
  openingDate: string;
  reference: string;
  notes: string;
  status: BalanceSheetStatus;
}

export const EMPTY_BS_FORM: BalanceSheetFormState = {
  lineItem: '',
  section: 'Current Assets',
  type: 'Asset',
  amount: '',
  openingDate: '2026-05-31',
  reference: '',
  notes: '',
  status: 'active',
};

export interface BalanceSheetFilterState {
  search: string;
  section: string;
  type: string;
  showZeroBalance: boolean;
}

export const DEFAULT_BS_FILTERS: BalanceSheetFilterState = {
  search: '',
  section: 'all',
  type: 'all',
  showZeroBalance: true,
};

export const BS_SECTION_OPTIONS = [
  { value: 'all', label: 'All Sections' },
  { value: 'current_assets', label: 'Current Assets' },
  { value: 'non_current_assets', label: 'Non-Current Assets' },
  { value: 'current_liabilities', label: 'Current Liabilities' },
  { value: 'long_term_liabilities', label: 'Long-term Liabilities' },
  { value: 'equity', label: "Owner's Equity" },
];

export const BS_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'Asset', label: 'Asset' },
  { value: 'Liability', label: 'Liability' },
  { value: 'Equity', label: 'Equity' },
];

export const BS_SECTION_LABEL_TO_VALUE: Record<string, BalanceSheetSection> = {
  'Current Assets': 'current_assets',
  'Non-Current Assets': 'non_current_assets',
  'Current Liabilities': 'current_liabilities',
  'Long-term Liabilities': 'long_term_liabilities',
  "Owner's Equity": 'equity',
};

export const BS_SECTION_VALUE_TO_LABEL: Record<BalanceSheetSection, string> = {
  current_assets: 'Current Assets',
  non_current_assets: 'Non-Current Assets',
  current_liabilities: 'Current Liabilities',
  long_term_liabilities: 'Long-term Liabilities',
  equity: "Owner's Equity",
};

export const BS_TYPES: BalanceSheetType[] = ['Asset', 'Liability', 'Equity'];

export const ADD_BS_LINE_FIELDS = [
  { key: 'lineItem', label: 'Line Item Name', type: 'text' as const, required: true },
  {
    key: 'section',
    label: 'Section',
    type: 'select' as const,
    required: true,
    options: Object.keys(BS_SECTION_LABEL_TO_VALUE),
  },
  { key: 'type', label: 'Type', type: 'select' as const, required: true, options: BS_TYPES },
  { key: 'amount', label: 'Amount (BDT)', type: 'number' as const, required: true },
  { key: 'openingDate', label: 'Opening Balance Date', type: 'date' as const, advanced: true },
  { key: 'reference', label: 'Reference / Code', type: 'text' as const, advanced: true },
  { key: 'notes', label: 'Notes', type: 'textarea' as const, advanced: true },
];
