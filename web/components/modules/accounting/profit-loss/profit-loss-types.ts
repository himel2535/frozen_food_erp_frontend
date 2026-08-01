export interface ProfitLossPeriodState {
  dateFrom: string;
  dateTo: string;
}

export const DEFAULT_PL_PERIOD: ProfitLossPeriodState = {
  dateFrom: '2025-06-01',
  dateTo: '2025-06-30',
};

export interface ProfitLossFormState {
  lineItem: string;
  category: string;
  section: string;
  amount: string;
  notes: string;
}

export const EMPTY_PL_FORM: ProfitLossFormState = {
  lineItem: '',
  category: 'Expense',
  section: 'Operating Expenses',
  amount: '',
  notes: '',
};
