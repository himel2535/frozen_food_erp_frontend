import {
  computeLineTotal,
  computePoTotals,
  type PurchaseRmLineItem,
  type PurchaseRmTotals,
  type PurchaseRmReceiveProof,
  type PurchaseRmReceiveProofItem,
  type PurchaseRmReceiveAttachment,
} from '@/lib/services/purchase-rm-service';

export type { PurchaseRmLineItem, PurchaseRmTotals, PurchaseRmReceiveProof, PurchaseRmReceiveProofItem, PurchaseRmReceiveAttachment };

export type PurchaseRmFormValues = {
  date: string;
  expectedDelivery: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  notes: string;
  vatPct: number;
  aitPct: number;
  otherCharges: number;
  status: string;
  items: PurchaseRmLineItem[];
};

export type PurchaseRmPayload = PurchaseRmFormValues & {
  id?: string;
  totals: PurchaseRmTotals;
  createdBy: string;
};

export const EMPTY_PURCHASE_RM_FORM: PurchaseRmFormValues = {
  date: new Date().toISOString().slice(0, 10),
  expectedDelivery: '',
  supplierId: '',
  supplierName: '',
  warehouseId: '',
  warehouseName: '',
  notes: '',
  vatPct: 15,
  aitPct: 1,
  otherCharges: 0,
  status: 'draft',
  items: [],
};

export function summarizePurchaseRmItems(
  items: PurchaseRmLineItem[],
  opts?: { vatPct?: number; aitPct?: number; otherCharges?: number },
): PurchaseRmTotals {
  return computePoTotals(items, opts);
}

export function recalcLineItem(item: PurchaseRmLineItem): PurchaseRmLineItem {
  return { ...item, lineTotal: computeLineTotal(item) };
}

export function createEmptyLineItem(material?: {
  id: string;
  name: string;
  category?: string;
  unit?: string;
  standardCost?: number;
  availability?: number;
  code?: string;
}): PurchaseRmLineItem {
  return {
    id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    materialId: material?.id ?? '',
    productName: material?.name ?? '',
    sku: material?.code ?? material?.id ?? '',
    category: material?.category ?? '',
    imageUrl: '/images/logo-toys.png',
    currentStock: Number(material?.availability ?? 0),
    unit: material?.unit ?? 'pcs',
    qty: 0,
    unitPrice: Number(material?.standardCost ?? 0),
    discountPct: 0,
    taxPct: 15,
    lineTotal: 0,
    receivedQty: 0,
  };
}
