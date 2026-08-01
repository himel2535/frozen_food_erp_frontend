export const SO_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', dotClass: 'bg-slate-400' },
  { value: 'confirmed', label: 'Confirmed', dotClass: 'bg-blue-500' },
  { value: 'processing', label: 'Processing', dotClass: 'bg-amber-500' },
  { value: 'fulfilled', label: 'Fulfilled', dotClass: 'bg-emerald-500' },
  { value: 'cancelled', label: 'Cancelled', dotClass: 'bg-slate-300' },
] as const;

export const SO_PAYMENT_STATUS_OPTIONS = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
] as const;

export { INVOICE_TAX_OPTIONS as SO_TAX_OPTIONS } from '@/components/modules/sales/invoice-form/inv-form-options';
