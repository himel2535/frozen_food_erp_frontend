export interface TrialBalanceFilterState {
  asOnDate: string;
  company: string;
  branch: string;
  fiscalYear: string;
  costCenter: string;
  currency: string;
  showZeroBalance: boolean;
  showInactiveAccounts: boolean;
}

export const DEFAULT_TRIAL_BALANCE_FILTERS: TrialBalanceFilterState = {
  asOnDate: '2026-01-31',
  company: 'Toys Factory Ltd.',
  branch: 'Dhaka Factory',
  fiscalYear: '2026',
  costCenter: 'All',
  currency: 'BDT (৳)',
  showZeroBalance: true,
  showInactiveAccounts: false,
};
