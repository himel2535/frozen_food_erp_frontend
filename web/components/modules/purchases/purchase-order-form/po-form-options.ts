export const PO_STATUS_OPTIONS = [
  { value: 'Draft', label: 'Draft', dotClass: 'bg-slate-400' },
  { value: 'Sent', label: 'Sent', dotClass: 'bg-blue-500' },
  { value: 'Received', label: 'Received', dotClass: 'bg-emerald-500' },
  { value: 'Cancelled', label: 'Cancelled', dotClass: 'bg-slate-300' },
] as const;

export const PO_PAYMENT_STATUS_OPTIONS = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
] as const;

export { INVOICE_TAX_OPTIONS as PO_TAX_OPTIONS } from '@/components/modules/sales/invoice-form/inv-form-options';
