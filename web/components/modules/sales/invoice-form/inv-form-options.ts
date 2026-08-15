export const INVOICE_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', dotClass: 'bg-slate-400' },
  { value: 'sent', label: 'Sent', dotClass: 'bg-blue-500' },
  { value: 'paid', label: 'Paid', dotClass: 'bg-emerald-500' },
  { value: 'cancelled', label: 'Cancelled', dotClass: 'bg-slate-300' },
] as const;

export const INVOICE_TAX_OPTIONS = [
  { label: 'No Tax', rate: 0 },
  { label: 'VAT 5%', rate: 0.05 },
  { label: 'VAT 15%', rate: 0.15 },
] as const;

export const INVOICE_TERMS_OPTIONS = [
  { value: '', label: 'Select terms (optional)' },
  { value: 'Cash', label: 'Cash — Paid in full' },
  { value: 'Bank Transfer', label: 'Bank Transfer — Paid in full' },
] as const;

export function getTaxRateByLabel(label: string): number {
  const match = INVOICE_TAX_OPTIONS.find((opt) => opt.label === label);
  return match?.rate ?? 0;
}
