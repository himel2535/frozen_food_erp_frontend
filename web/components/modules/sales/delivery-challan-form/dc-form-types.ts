export type DeliveryChallanLineItem = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  imageUrl: string;
  orderedQty: number;
  previouslyDelivered: number;
  deliverNow: number;
  remainingQty: number;
  unit: string;
};

export type DeliveryChallanFormValues = {
  date: string;
  customerId: string;
  customerName: string;
  orderId: string;
  deliveryAddress: string;
  contactPerson: string;
  contactPhone: string;
  expectedDeliveryDate: string;
  deliveryMethod: string;
  vehicleNo: string;
  driverName: string;
  driverPhone: string;
  warehouseId: string;
  attachmentName: string;
  notes: string;
  status: string;
  items: DeliveryChallanLineItem[];
};

export type DeliveryChallanPayload = DeliveryChallanFormValues & {
  id?: string;
  warehouseName: string;
  preparedBy: string;
  authorizedBy: string;
  totalDeliverQty: number;
  totalItems: number;
};

export const EMPTY_DELIVERY_CHALLAN_FORM: DeliveryChallanFormValues = {
  date: new Date().toISOString().slice(0, 10),
  customerId: '',
  customerName: '',
  orderId: '',
  deliveryAddress: '',
  contactPerson: '',
  contactPhone: '',
  expectedDeliveryDate: '',
  deliveryMethod: 'By Our Transport',
  vehicleNo: '',
  driverName: '',
  driverPhone: '',
  warehouseId: '',
  attachmentName: '',
  notes: '',
  status: 'draft',
  items: [],
};

export function computeLineRemaining(item: Pick<DeliveryChallanLineItem, 'orderedQty' | 'previouslyDelivered' | 'deliverNow'>) {
  return Math.max(0, Number(item.orderedQty || 0) - Number(item.previouslyDelivered || 0) - Number(item.deliverNow || 0));
}

export function summarizeChallanItems(items: DeliveryChallanLineItem[]) {
  const active = items.filter((item) => item.productName.trim());
  const totalDeliverQty = active.reduce((sum, item) => sum + Number(item.deliverNow || 0), 0);
  return { totalItems: active.length, totalDeliverQty };
}
