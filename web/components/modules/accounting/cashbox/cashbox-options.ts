import type { PortField } from '@/lib/modules/port-types';
import type { CashboxTab } from './cashbox-types';

export const CASHBOX_CATEGORIES = [
  { value: 'Sales', label: 'Sales', icon: 'mdi:cart-outline' },
  { value: 'Expense', label: 'Expense', icon: 'mdi:receipt-text-outline' },
  { value: 'Transfer', label: 'Transfer', icon: 'mdi:bank-transfer' },
  { value: 'Other Income', label: 'Other Income', icon: 'mdi:cash-plus' },
];

export const CASHBOX_PAYMENT_METHODS = ['Cash', 'Bank', 'Mobile Banking', 'Cheque', 'Card'];

export const CASHBOX_TYPE_OPTIONS = [
  { id: 'all', label: 'All Types' },
  { id: 'cash_in', label: 'Cash In' },
  { id: 'cash_out', label: 'Cash Out' },
  { id: 'transfer', label: 'Transfer' },
];

export const CASHBOX_CATEGORY_FILTER_OPTIONS = [
  { id: 'all', label: 'All Categories' },
  ...CASHBOX_CATEGORIES.map((c) => ({ id: c.value, label: c.label })),
];

export function getCategoryIcon(category: string): string {
  return CASHBOX_CATEGORIES.find((c) => c.value === category)?.icon ?? 'mdi:tag-outline';
}

export function buildCashboxFormFields(formType: CashboxTab, partyOptions: string[]): PortField[] {
  const partyLabel = formType === 'cash_in' ? 'Received From' : 'Paid To';
  return [
    { key: 'category', label: 'Category', type: 'select', required: true, options: CASHBOX_CATEGORIES.map((c) => c.value) },
    { key: 'party', label: partyLabel, type: 'select', required: true, placeholder: 'Select party', options: partyOptions },
    { key: 'note', label: 'Note / Purpose', type: 'textarea', required: true, placeholder: 'Brief description of this entry' },
    { key: 'paymentMethod', label: 'Payment Method', type: 'select', advanced: true, options: [...CASHBOX_PAYMENT_METHODS] },
    { key: 'reference', label: 'Reference', type: 'text', advanced: true, placeholder: 'Optional reference' },
  ];
}
