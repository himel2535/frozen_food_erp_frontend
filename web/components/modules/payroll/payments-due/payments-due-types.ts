import type { SheetFilterState } from '@/components/modules/payroll/salary-sheet/salary-sheet-types';
import { defaultPeriod, buildReviewUrl } from '@/components/modules/payroll/salary-sheet/salary-sheet-types';

export type PaymentsDueFilterState = SheetFilterState & {
  status: 'all' | 'paid' | 'partial' | 'unpaid' | 'notProcessed';
};

export const DEFAULT_PAYMENTS_DUE_FILTERS: PaymentsDueFilterState = {
  period: defaultPeriod(),
  department: 'all',
  designation: 'all',
  search: '',
  status: 'all',
};

export { buildReviewUrl, defaultPeriod };
