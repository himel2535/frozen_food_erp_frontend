import {
  computePoOrderTotals,
  recalcPoLineItem,
  type PoLineItem,
  type PoOrderTotals,
} from '@/lib/services/purchases-service';

export type { PoLineItem as SoLineItem, PoOrderTotals as SoOrderTotals };

export type SoFormValues = {
  customerId: string;
  customerName: string;
  date: string;
  expectedDelivery: string;
  reference: string;
  status: string;
  salesPersonId: string;
  salesPersonName: string;
  deliveryAddress: string;
  notes: string;
  terms: string;
  attachmentUrl: string;
  attachmentName: string;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  paidAmount: string;
  docDiscountOverride: number | null;
  docTaxOverride: number | null;
  items: PoLineItem[];
};

export type SoFormPayload = SoFormValues & {
  id?: string;
  orderPreviewId: string;
  totals: PoOrderTotals;
};

export const EMPTY_SO_FORM: SoFormValues = {
  customerId: '',
  customerName: '',
  date: new Date().toISOString().slice(0, 10),
  expectedDelivery: '',
  reference: '',
  status: 'draft',
  salesPersonId: '',
  salesPersonName: '',
  deliveryAddress: '',
  notes: '',
  terms: 'Net 30 - Payment due within 30 days',
  attachmentUrl: '',
  attachmentName: '',
  paymentStatus: 'unpaid',
  paidAmount: '0',
  docDiscountOverride: null,
  docTaxOverride: null,
  items: [createEmptySoLineItem()],
};

export function createEmptySoLineItem(product?: {
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

export function computeSoTotalsFromForm(form: SoFormValues): PoOrderTotals {
  return computePoOrderTotals(form.items.map(recalcPoLineItem), {
    docDiscountOverride: form.docDiscountOverride,
    docTaxOverride: form.docTaxOverride,
  });
}

export function recordToSoFormValues(record: Record<string, unknown>): SoFormValues {
  const rawItems = (Array.isArray(record.items) ? record.items : []) as Record<string, unknown>[];
  const orderTotal = Number(record.total ?? 0);
  const itemCount = rawItems.length;

  const items: PoLineItem[] = rawItems.length
    ? rawItems.map((item, index) => {
        const qty = Number(item.qty ?? item.quantity ?? 1);
        const inferredRate = item.rate != null || item.price != null
          ? Number(item.rate ?? item.price ?? 0)
          : itemCount > 0 && orderTotal > 0
            ? orderTotal / itemCount / Math.max(qty, 1)
            : 0;
        return recalcPoLineItem({
          id: String(item.id ?? `line-${index + 1}`),
          productId: String(item.productId ?? item.sku ?? ''),
          description: String(item.description ?? item.name ?? ''),
          unit: String(item.unit ?? 'pcs'),
          qty,
          rate: inferredRate,
          discountPct: Number(item.discountPct ?? 0),
          taxLabel: String(item.taxLabel ?? 'No Tax'),
          amount: Number(item.amount ?? item.total ?? 0),
          imageUrl: String(item.imageUrl ?? ''),
        });
      })
    : [createEmptySoLineItem()];

  return {
    customerId: String(record.customerId ?? ''),
    customerName: String(record.customer ?? record.customerName ?? ''),
    date: String(record.date ?? new Date().toISOString().slice(0, 10)),
    expectedDelivery: String(record.expectedDelivery ?? record.deliveryDate ?? ''),
    reference: String(record.reference ?? ''),
    status: String(record.status ?? 'draft'),
    salesPersonId: String(record.salesPersonId ?? ''),
    salesPersonName: String(record.salesPersonName ?? ''),
    deliveryAddress: String(record.deliveryAddress ?? record.shippingAddress ?? ''),
    notes: String(record.notes ?? ''),
    terms: String(record.terms ?? 'Net 30 - Payment due within 30 days'),
    attachmentUrl: String(record.attachmentUrl ?? ''),
    attachmentName: String(record.attachmentName ?? ''),
    paymentStatus: (record.paymentStatus as SoFormValues['paymentStatus']) ?? 'unpaid',
    paidAmount: String(record.paidAmount ?? 0),
    docDiscountOverride: record.discountAmount != null ? Number(record.discountAmount) : null,
    docTaxOverride: record.taxAmount != null ? Number(record.taxAmount) : null,
    items,
  };
}

export function payloadToRecord(payload: SoFormPayload) {
  const paidAmount = Number(payload.paidAmount || 0);
  const balanceDue = Math.max(0, payload.totals.total - paidAmount);
  return {
    id: payload.id ?? payload.orderPreviewId,
    customerId: payload.customerId,
    customer: payload.customerName,
    customerName: payload.customerName,
    date: payload.date,
    expectedDelivery: payload.expectedDelivery,
    deliveryDate: payload.expectedDelivery,
    reference: payload.reference,
    status: payload.status,
    salesPersonId: payload.salesPersonId,
    salesPersonName: payload.salesPersonName,
    deliveryAddress: payload.deliveryAddress,
    shippingAddress: payload.deliveryAddress,
    notes: payload.notes,
    terms: payload.terms,
    attachmentUrl: payload.attachmentUrl,
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
