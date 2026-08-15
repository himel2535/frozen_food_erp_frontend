import { getTaxRateByLabel } from '@/components/modules/sales/invoice-form/inv-form-options';

export type InvoiceLineItem = {
  id: string;
  productId: string;
  description: string;
  qty: number;
  rate: number;
  discountPct: number;
  taxLabel: string;
  amount: number;
};

export type InvoiceFormValues = {
  customerId: string;
  customerName: string;
  billingAddress: string;
  issueDate: string;
  dueDate: string;
  status: string;
  notes: string;
  terms: string;
  docDiscountOverride: number | null;
  docTaxOverride: number | null;
  includeSignature: boolean;
  signatureId: string | null;
  paidAmount: number;
  items: InvoiceLineItem[];
};

export type InvoiceTotals = {
  subtotal: number;
  lineDiscount: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
};

export type InvoiceSignaturePrint = {
  imageDataUrl: string;
  signerName: string;
  designation?: string;
  label?: string;
};

export type InvoicePayload = InvoiceFormValues & {
  id?: string;
  invoiceNo: string;
  totals: InvoiceTotals;
  paidAmount?: number;
  balanceDue?: number;
  approvalStatus?: string;
  shippingAddress?: string;
  customerEmail?: string;
  customerPhone?: string;
  signature?: InvoiceSignaturePrint | null;
};

export const EMPTY_INVOICE_FORM: InvoiceFormValues = {
  customerId: '',
  customerName: '',
  billingAddress: '',
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: '',
  status: 'paid',
  notes: '',
  terms: '',
  docDiscountOverride: null,
  docTaxOverride: null,
  includeSignature: false,
  signatureId: null,
  paidAmount: 0,
  items: [createEmptyLineItem()],
};

export function recalcLineItem(item: InvoiceLineItem): InvoiceLineItem {
  const qty = Math.max(0, Number(item.qty) || 0);
  const rate = Math.max(0, Number(item.rate) || 0);
  const discountPct = Math.min(100, Math.max(0, Number(item.discountPct) || 0));
  const taxRate = getTaxRateByLabel(item.taxLabel);
  const lineSubtotal = qty * rate;
  const lineDiscount = lineSubtotal * (discountPct / 100);
  const lineTaxable = lineSubtotal - lineDiscount;
  const lineTax = lineTaxable * taxRate;
  const amount = lineTaxable + lineTax;
  return { ...item, qty, rate, discountPct, amount };
}

export function createEmptyLineItem(product?: {
  id: string;
  name: string;
  price?: number;
  sku?: string;
}): InvoiceLineItem {
  const base: InvoiceLineItem = {
    id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    productId: product?.id ?? '',
    description: product?.name ?? '',
    qty: 1,
    rate: Number(product?.price ?? 0),
    discountPct: 0,
    taxLabel: 'No Tax',
    amount: 0,
  };
  return recalcLineItem(base);
}

export function computeInvoiceTotalsFromItems(
  items: InvoiceLineItem[],
  overrides?: { docDiscountOverride?: number | null; docTaxOverride?: number | null },
): InvoiceTotals {
  const active = items.filter((item) => item.description.trim() || item.productId);
  let subtotal = 0;
  let lineDiscount = 0;
  let taxAmount = 0;

  active.forEach((raw) => {
    const item = recalcLineItem(raw);
    const qty = item.qty;
    const rate = item.rate;
    const discountPct = item.discountPct;
    const taxRate = getTaxRateByLabel(item.taxLabel);
    const lineSubtotal = qty * rate;
    const disc = lineSubtotal * (discountPct / 100);
    const taxable = lineSubtotal - disc;
    subtotal += lineSubtotal;
    lineDiscount += disc;
    taxAmount += taxable * taxRate;
  });

  const discountAmount =
    overrides?.docDiscountOverride != null ? Math.max(0, overrides.docDiscountOverride) : lineDiscount;
  const taxFromOverride =
    overrides?.docTaxOverride != null ? Math.max(0, overrides.docTaxOverride) : taxAmount;
  const taxableBase = Math.max(0, subtotal - discountAmount);
  const total = taxableBase + taxFromOverride;

  return {
    subtotal,
    lineDiscount,
    discountAmount,
    taxAmount: taxFromOverride,
    total,
  };
}
