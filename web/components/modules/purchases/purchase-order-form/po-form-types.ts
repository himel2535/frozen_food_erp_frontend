import {
  computePoOrderTotals,
  recalcPoLineItem,
  type PoLineItem,
  type PoOrderTotals,
} from '@/lib/services/purchases-service';

export type { PoLineItem, PoOrderTotals };

export type PoFormValues = {
  supplierId: string;
  supplierName: string;
  date: string;
  expectedDelivery: string;
  reference: string;
  status: string;
  purchaserId: string;
  purchaserName: string;
  shippingAddress: string;
  notes: string;
  terms: string;
  attachmentUrl: string;
  attachmentPublicId: string;
  attachmentName: string;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  paidAmount: string;
  docDiscountOverride: number | null;
  docTaxOverride: number | null;
  items: PoLineItem[];
};

export type PoFormPayload = PoFormValues & {
  id?: string;
  poPreviewId: string;
  totals: PoOrderTotals;
};

export const EMPTY_PO_FORM: PoFormValues = {
  supplierId: '',
  supplierName: '',
  date: new Date().toISOString().slice(0, 10),
  expectedDelivery: '',
  reference: '',
  status: 'Draft',
  purchaserId: '',
  purchaserName: '',
  shippingAddress: '',
  notes: '',
  terms: 'Net 30 - Payment due within 30 days',
  attachmentUrl: '',
  attachmentPublicId: '',
  attachmentName: '',
  paymentStatus: 'unpaid',
  paidAmount: '0',
  docDiscountOverride: null,
  docTaxOverride: null,
  items: [createEmptyPoLineItem()],
};

export function createEmptyPoLineItem(product?: {
  id: string;
  name: string;
  price?: number;
  sku?: string;
  unit?: string;
}): PoLineItem {
  const base: PoLineItem = {
    id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    productId: product?.id ?? '',
    description: product?.name ?? '',
    unit: product?.unit ?? 'pcs',
    qty: 1,
    rate: Number(product?.price ?? 0),
    discountPct: 0,
    taxLabel: 'No Tax',
    amount: 0,
  };
  return recalcPoLineItem(base);
}

export function computePoTotalsFromForm(form: PoFormValues): PoOrderTotals {
  return computePoOrderTotals(form.items.map(recalcPoLineItem), {
    docDiscountOverride: form.docDiscountOverride,
    docTaxOverride: form.docTaxOverride,
  });
}

export function formValuesToPayload(form: PoFormValues, poPreviewId: string, id?: string): PoFormPayload {
  const totals = computePoTotalsFromForm(form);
  const paidAmount = Number(form.paidAmount || 0);
  return {
    ...form,
    id,
    poPreviewId,
    totals,
    paidAmount: String(paidAmount),
    paymentStatus: form.paymentStatus,
  };
}

export function recordToPoFormValues(record: Record<string, unknown>): PoFormValues {
  const rawItems = (Array.isArray(record.items) ? record.items : []) as Record<string, unknown>[];
  const items: PoLineItem[] = rawItems.length
    ? rawItems.map((item, index) =>
        recalcPoLineItem({
          id: String(item.id ?? `line-${index + 1}`),
          productId: String(item.productId ?? ''),
          description: String(item.description ?? item.name ?? record.product ?? ''),
          unit: String(item.unit ?? 'pcs'),
          qty: Number(item.qty ?? item.quantity ?? 1),
          rate: Number(item.rate ?? item.unitCost ?? item.price ?? 0),
          discountPct: Number(item.discountPct ?? 0),
          taxLabel: String(item.taxLabel ?? 'No Tax'),
          amount: Number(item.amount ?? 0),
        }),
      )
    : record.product || record.qty
      ? [recalcPoLineItem({
          id: 'line-1',
          productId: String(record.productId ?? ''),
          description: String(record.product ?? ''),
          unit: 'pcs',
          qty: Number(record.qty ?? 0),
          rate: Number(record.unitCost ?? 0),
          discountPct: 0,
          taxLabel: 'No Tax',
          amount: Number(record.total ?? 0),
        })]
      : [createEmptyPoLineItem()];

  return {
    supplierId: String(record.supplierId ?? ''),
    supplierName: String(record.supplier ?? record.supplierName ?? ''),
    date: String(record.date ?? new Date().toISOString().slice(0, 10)),
    expectedDelivery: String(record.expectedDelivery ?? record.deliveryDate ?? ''),
    reference: String(record.reference ?? ''),
    status: String(record.status ?? 'Draft'),
    purchaserId: String(record.purchaserId ?? ''),
    purchaserName: String(record.purchaserName ?? ''),
    shippingAddress: String(record.shippingAddress ?? ''),
    notes: String(record.notes ?? ''),
    terms: String(record.terms ?? 'Net 30 - Payment due within 30 days'),
    attachmentUrl: String(record.attachmentUrl ?? ''),
    attachmentPublicId: String(record.attachmentPublicId ?? ''),
    attachmentName: String(record.attachmentName ?? ''),
    paymentStatus: (record.paymentStatus as PoFormValues['paymentStatus']) ?? 'unpaid',
    paidAmount: String(record.paidAmount ?? 0),
    docDiscountOverride: record.discountAmount != null ? Number(record.discountAmount) : null,
    docTaxOverride: record.taxAmount != null ? Number(record.taxAmount) : null,
    items,
  };
}

export function payloadToRecord(payload: PoFormPayload) {
  const paidAmount = Number(payload.paidAmount || 0);
  const balanceDue = Math.max(0, payload.totals.total - paidAmount);
  const userVisiblePoId = payload.id ?? payload.poPreviewId;
  return {
    id: userVisiblePoId,
    legacyId: userVisiblePoId,
    supplierId: payload.supplierId,
    supplier: payload.supplierName,
    supplierName: payload.supplierName,
    date: payload.date,
    expectedDelivery: payload.expectedDelivery,
    deliveryDate: payload.expectedDelivery,
    reference: payload.reference,
    status: payload.status,
    purchaserId: payload.purchaserId,
    purchaserName: payload.purchaserName,
    shippingAddress: payload.shippingAddress,
    notes: payload.notes,
    terms: payload.terms,
    attachmentUrl: payload.attachmentUrl,
    attachmentPublicId: payload.attachmentPublicId,
    attachmentName: payload.attachmentName,
    paymentStatus: payload.paymentStatus,
    paidAmount,
    balanceDue,
    items: payload.items.map(recalcPoLineItem),
    subtotal: payload.totals.subtotal,
    discountAmount: payload.totals.discountAmount,
    taxAmount: payload.totals.taxAmount,
    total: payload.totals.total,
    totals: payload.totals,
  };
}
