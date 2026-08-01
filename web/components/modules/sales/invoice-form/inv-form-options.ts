export const INVOICE_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', dotClass: 'bg-slate-400' },
  { value: 'pending', label: 'Pending', dotClass: 'bg-amber-400' },
  { value: 'sent', label: 'Sent', dotClass: 'bg-blue-500' },
  { value: 'paid', label: 'Paid', dotClass: 'bg-emerald-500' },
  { value: 'overdue', label: 'Overdue', dotClass: 'bg-rose-500' },
  { value: 'cancelled', label: 'Cancelled', dotClass: 'bg-slate-300' },
] as const;

export const INVOICE_TAX_OPTIONS = [
  { label: 'No Tax', rate: 0 },
  { label: 'VAT 5%', rate: 0.05 },
  { label: 'VAT 15%', rate: 0.15 },
] as const;

export const INVOICE_TERMS_OPTIONS = [
  { value: '', label: 'Select terms (optional)' },
  { value: 'Net 15', label: 'Net 15 — Payment due within 15 days' },
  { value: 'Net 30', label: 'Net 30 — Payment due within 30 days' },
  { value: 'Net 45', label: 'Net 45 — Payment due within 45 days' },
  { value: 'Due on Receipt', label: 'Due on Receipt — Payment due immediately' },
  { value: '50% Advance', label: '50% Advance — Half payment upfront' },
] as const;

export function getTaxRateByLabel(label: string): number {
  const match = INVOICE_TAX_OPTIONS.find((opt) => opt.label === label);
  return match?.rate ?? 0;
}
