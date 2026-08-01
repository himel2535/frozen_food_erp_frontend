export type { CashboxEntry, CashboxEntryType, CashboxFilters, CashboxFormValues } from '@/lib/services/cashbox-service';

export type CashboxTab = 'cash_in' | 'cash_out';

export type CashboxPageState = {
  activeTab: CashboxTab;
  editingId: string | null;
  dateFrom: string;
  dateTo: string;
  typeFilter: string;
  categoryFilter: string;
  page: number;
  pageSize: number;
};
