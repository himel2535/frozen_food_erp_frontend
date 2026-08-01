export const TRIAL_BALANCE_COMPANIES = ['Toys Factory Ltd.'];
export const TRIAL_BALANCE_BRANCHES = ['Dhaka Factory', 'Chittagong Warehouse', 'Gazipur Unit'];
export const TRIAL_BALANCE_FISCAL_YEARS = ['2024', '2025', '2026'];
export const TRIAL_BALANCE_COST_CENTERS = ['All', 'Production', 'Administration', 'Sales'];
export const TRIAL_BALANCE_CURRENCIES = ['BDT (৳)', 'USD ($)'];
export const TRIAL_BALANCE_PARENT_ACCOUNTS = ['Assets', 'Liabilities', 'Equity', 'Income', 'Expenses'];

export const ADD_LINE_FIELDS = [
  { key: 'accountCode', label: 'Account Code', type: 'text' as const, required: true },
  { key: 'accountName', label: 'Account Name', type: 'text' as const, required: true },
  {
    key: 'parentAccount',
    label: 'Parent Account',
    type: 'select' as const,
    required: true,
    options: TRIAL_BALANCE_PARENT_ACCOUNTS,
  },
  { key: 'debit', label: 'Debit (৳)', type: 'number' as const },
  { key: 'credit', label: 'Credit (৳)', type: 'number' as const },
  { key: 'notes', label: 'Notes', type: 'textarea' as const, advanced: true },
];
