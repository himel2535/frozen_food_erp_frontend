import type { ProfitLossSection } from '@/lib/services/profit-loss-service';

export const PL_CATEGORIES = ['Revenue', 'COGS', 'Expense', 'Other Income', 'Tax', 'Other'];
export const PL_SECTIONS: { value: ProfitLossSection; label: string }[] = [
  { value: 'income', label: 'Income' },
  { value: 'cogs', label: 'COGS' },
  { value: 'operating', label: 'Operating Expenses' },
  { value: 'other', label: 'Other Income & Expenses' },
  { value: 'tax', label: 'Tax' },
];

export const PL_QUICK_ADD_ITEMS: Array<{
  lineItem: string;
  category: string;
  section: ProfitLossSection;
  icon: string;
  subtitle: string;
  custom?: boolean;
}> = [
  { lineItem: 'Sales Revenue', category: 'Revenue', section: 'income' as ProfitLossSection, icon: '💰', subtitle: 'বিক্রয় আয়' },
  { lineItem: 'Other Income', category: 'Revenue', section: 'income' as ProfitLossSection, icon: '📈', subtitle: 'অন্যান্য আয়' },
  { lineItem: 'Opening Stock', category: 'COGS', section: 'cogs' as ProfitLossSection, icon: '📦', subtitle: 'প্রারম্ভিক মজুদ' },
  { lineItem: 'Purchases', category: 'COGS', section: 'cogs' as ProfitLossSection, icon: '🛒', subtitle: 'ক্রয়' },
  { lineItem: 'Direct Expense', category: 'COGS', section: 'cogs' as ProfitLossSection, icon: '⚙️', subtitle: 'সরাসরি খরচ' },
  { lineItem: 'Salary & Wages', category: 'Expense', section: 'operating' as ProfitLossSection, icon: '👥', subtitle: 'বেতন ও মজুরি' },
  { lineItem: 'Rent', category: 'Expense', section: 'operating' as ProfitLossSection, icon: '🏢', subtitle: 'ভাড়া' },
  { lineItem: 'Utilities', category: 'Expense', section: 'operating' as ProfitLossSection, icon: '💡', subtitle: 'ইউটিলিটি' },
  { lineItem: 'Marketing Expense', category: 'Expense', section: 'operating' as ProfitLossSection, icon: '📣', subtitle: 'মার্কেটিং' },
  { lineItem: 'Administrative Expense', category: 'Expense', section: 'operating' as ProfitLossSection, icon: '📋', subtitle: 'প্রশাসনিক' },
  { lineItem: 'Depreciation', category: 'Expense', section: 'operating' as ProfitLossSection, icon: '📉', subtitle: 'অবচয়' },
  { lineItem: 'Interest Income', category: 'Other Income', section: 'other' as ProfitLossSection, icon: '🏦', subtitle: 'সুদ আয়' },
  { lineItem: 'Bank Charges', category: 'Expense', section: 'other' as ProfitLossSection, icon: '💳', subtitle: 'ব্যাংক চার্জ' },
  { lineItem: 'Tax Expense', category: 'Tax', section: 'tax' as ProfitLossSection, icon: '🧾', subtitle: 'কর খরচ' },
  { lineItem: 'Other Expense', category: 'Expense', section: 'operating' as ProfitLossSection, icon: '📝', subtitle: 'অন্যান্য খরচ' },
  { lineItem: 'Add Custom Line', category: 'Expense', section: 'operating' as ProfitLossSection, icon: '➕', subtitle: 'নিজস্ব লাইন', custom: true },
];

export const PL_GUIDE_TIPS = [
  'Income ও Expense সঠিক category-তে রাখুন',
  'COGS আলাদা রাখলে Gross Profit স্পষ্ট হয়',
  'Operating Expense আলাদা group করুন',
  'Tax Expense শেষে দেখান',
  'প্রতি মাসে P&L review করুন',
];

export const ADD_LINE_FIELDS = [
  { key: 'lineItem', label: 'Line Item', type: 'text' as const, required: true },
  { key: 'category', label: 'Category', type: 'select' as const, required: true, options: PL_CATEGORIES },
  { key: 'section', label: 'Section', type: 'select' as const, required: true, options: PL_SECTIONS.map((s) => s.label) },
  { key: 'amount', label: 'Amount (৳)', type: 'number' as const, required: true },
  { key: 'notes', label: 'Notes', type: 'textarea' as const, advanced: true },
];

export const SECTION_LABEL_TO_VALUE: Record<string, ProfitLossSection> = {
  Income: 'income',
  COGS: 'cogs',
  'Operating Expenses': 'operating',
  'Other Income & Expenses': 'other',
  Tax: 'tax',
};

export const SECTION_VALUE_TO_LABEL: Record<ProfitLossSection, string> = {
  income: 'Income',
  cogs: 'COGS',
  operating: 'Operating Expenses',
  other: 'Other Income & Expenses',
  tax: 'Tax',
};
