import { apiDocId } from '@/lib/services/api-resource-service';

function meta(doc: Record<string, unknown>): Record<string, unknown> {
  return (doc.meta ?? {}) as Record<string, unknown>;
}

function mapBaseRow(doc: Record<string, unknown>): Record<string, unknown> {
  return {
    id: apiDocId(doc),
    legacyId: doc.legacyId ?? '',
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function mapApiCategoryRow(doc: Record<string, unknown>): Record<string, unknown> {
  return {
    ...mapBaseRow(doc),
    name: doc.name ?? '',
    code: doc.code ?? '',
    type: doc.type ?? 'Finished Goods',
    status: doc.status ?? 'Active',
    description: doc.description ?? '',
    parentId: doc.parentId ?? '',
    defaultTaxRate: doc.defaultTaxRate ?? 0,
    defaultUnitType: doc.defaultUnitType ?? '',
    stockPolicy: doc.stockPolicy ?? 'FIFO',
    imageUrl: doc.imageUrl ?? '',
  };
}

export function mapCategoryPayloadToApi(body: Record<string, unknown>): Record<string, unknown> {
  return {
    name: body.name,
    type: body.type ?? 'Finished Goods',
    status: body.status ?? 'Active',
    description: body.description ?? '',
    parentId: body.parentId ?? '',
    defaultTaxRate: Number(body.defaultTaxRate ?? 0),
    defaultUnitType: body.defaultUnitType ?? '',
    stockPolicy: body.stockPolicy ?? 'FIFO',
    imageUrl: body.imageUrl ?? '',
    ...(body.code && String(body.code).trim() ? { code: String(body.code).trim() } : {}),
  };
}

export function mapApiUnitRow(doc: Record<string, unknown>): Record<string, unknown> {
  return {
    ...mapBaseRow(doc),
    name: doc.name ?? '',
    code: doc.code ?? '',
    symbol: doc.symbol ?? doc.code ?? '',
    status: doc.status ?? 'Active',
    description: doc.description ?? '',
    baseUnit: doc.baseUnit ?? '',
    conversionFactor: doc.conversionFactor ?? 1,
  };
}

export function mapUnitPayloadToApi(body: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: body.name,
    symbol: body.symbol ?? body.code ?? '',
    status: body.status ?? 'Active',
    description: body.description ?? '',
    baseUnit: body.baseUnit ?? '',
    conversionFactor: Number(body.conversionFactor ?? 1),
  };
  if (body.code && String(body.code).trim()) payload.code = String(body.code).trim();
  return payload;
}

export function mapApiWarehouseRow(doc: Record<string, unknown>): Record<string, unknown> {
  return {
    ...mapBaseRow(doc),
    name: doc.name ?? '',
    location: doc.location ?? '',
    capacity: doc.capacity ?? 0,
    type: doc.type ?? 'Main Warehouse',
    manager: doc.manager ?? '',
    contact: doc.contact ?? '',
    status: doc.status ?? 'Active',
    allowedProductTypes: doc.allowedProductTypes ?? '',
    storageRules: doc.storageRules ?? '',
    imageUrl: doc.imageUrl ?? '',
  };
}

export function mapWarehousePayloadToApi(body: Record<string, unknown>): Record<string, unknown> {
  return {
    name: body.name,
    location: body.location ?? '',
    capacity: Number(body.capacity ?? 0),
    type: body.type ?? 'Main Warehouse',
    manager: body.manager ?? '',
    contact: body.contact ?? '',
    status: body.status ?? 'Active',
    allowedProductTypes: body.allowedProductTypes ?? '',
    storageRules: body.storageRules ?? '',
    imageUrl: body.imageUrl ?? '',
  };
}

export function mapApiRawMaterialRow(doc: Record<string, unknown>): Record<string, unknown> {
  const m = meta(doc);
  return {
    ...mapBaseRow(doc),
    name: doc.name ?? '',
    category: doc.category ?? '',
    unit: doc.unit ?? 'pcs',
    quantity: doc.quantity ?? 0,
    price: doc.price ?? 0,
    threshold: doc.threshold ?? 0,
    warehouseId: doc.warehouseId ?? '',
    location: doc.location ?? '',
    supplierId: doc.supplierId ?? m.supplierId ?? '',
    supplierPrice: doc.supplierPrice ?? 0,
    notes: doc.notes ?? '',
    imageUrl: doc.imageUrl ?? '',
    status: doc.status ?? 'active',
  };
}

export function mapRawMaterialPayloadToApi(body: Record<string, unknown>): Record<string, unknown> {
  return {
    name: body.name,
    category: body.category ?? '',
    unit: body.unit ?? 'pcs',
    quantity: Number(body.quantity ?? 0),
    price: Number(body.price ?? 0),
    threshold: Number(body.threshold ?? 0),
    warehouseId: body.warehouseId ?? '',
    location: body.location ?? '',
    supplierId: body.supplierId ?? '',
    supplierPrice: Number(body.supplierPrice ?? 0),
    notes: body.notes ?? '',
    imageUrl: body.imageUrl ?? '',
    status: body.status ?? 'active',
  };
}

export function mapApiSemiFinishedRow(doc: Record<string, unknown>): Record<string, unknown> {
  return {
    ...mapBaseRow(doc),
    name: doc.name ?? '',
    category: doc.category ?? '',
    unit: doc.unit ?? 'pcs',
    quantity: doc.quantity ?? 0,
    avgCost: doc.avgCost ?? 0,
    minStock: doc.minStock ?? 0,
    warehouseId: doc.warehouseId ?? '',
    location: doc.location ?? '',
    recipeId: doc.recipeId ?? '',
    notes: doc.notes ?? '',
    imageUrl: doc.imageUrl ?? '',
    status: doc.status ?? 'active',
  };
}

export function mapSemiFinishedPayloadToApi(body: Record<string, unknown>): Record<string, unknown> {
  return {
    name: body.name,
    category: body.category ?? '',
    unit: body.unit ?? 'pcs',
    quantity: Number(body.quantity ?? 0),
    avgCost: Number(body.avgCost ?? body.price ?? 0),
    minStock: Number(body.minStock ?? body.threshold ?? 0),
    warehouseId: body.warehouseId ?? '',
    location: body.location ?? '',
    recipeId: body.recipeId ?? '',
    notes: body.notes ?? '',
    imageUrl: body.imageUrl ?? '',
    status: body.status ?? 'active',
  };
}

export function mapApiFinishedGoodRow(doc: Record<string, unknown>): Record<string, unknown> {
  return {
    ...mapBaseRow(doc),
    name: doc.name ?? '',
    category: doc.category ?? '',
    unit: doc.unit ?? 'pcs',
    quantity: doc.quantity ?? 0,
    reserved: doc.reserved ?? 0,
    avgCost: doc.avgCost ?? 0,
    minStock: doc.minStock ?? 0,
    warehouseId: doc.warehouseId ?? '',
    location: doc.location ?? '',
    notes: doc.notes ?? '',
    imageUrl: doc.imageUrl ?? '',
    status: doc.status ?? 'active',
  };
}

export function mapFinishedGoodPayloadToApi(body: Record<string, unknown>): Record<string, unknown> {
  return {
    name: body.name,
    category: body.category ?? '',
    unit: body.unit ?? 'pcs',
    quantity: Number(body.quantity ?? 0),
    reserved: Number(body.reserved ?? 0),
    avgCost: Number(body.avgCost ?? body.price ?? 0),
    minStock: Number(body.minStock ?? body.threshold ?? 0),
    warehouseId: body.warehouseId ?? '',
    location: body.location ?? '',
    notes: body.notes ?? '',
    imageUrl: body.imageUrl ?? '',
    status: body.status ?? 'active',
  };
}

export function mapApiStockInRow(doc: Record<string, unknown>): Record<string, unknown> {
  return {
    ...mapBaseRow(doc),
    productId: doc.productId ?? '',
    product: doc.product ?? '',
    warehouseId: doc.warehouseId ?? '',
    qty: doc.qty ?? 0,
    unitCost: doc.unitCost ?? 0,
    date: doc.date ?? '',
    sourceType: doc.sourceType ?? 'Purchase',
    refDocId: doc.refDocId ?? '',
    supplier: doc.supplier ?? '',
    status: doc.status ?? 'Pending',
    batchNumber: doc.batchNumber ?? '',
    expiryDate: doc.expiryDate ?? '',
    notes: doc.notes ?? '',
    approvedBy: doc.approvedBy ?? '',
  };
}

export function mapStockInPayloadToApi(
  body: Record<string, unknown>,
  productName?: string,
): Record<string, unknown> {
  return {
    productId: body.productId,
    product: productName ?? body.product ?? '',
    warehouseId: body.warehouseId ?? '',
    qty: Number(body.qty ?? 0),
    unitCost: Number(body.unitCost ?? 0),
    date: body.date ?? new Date().toISOString().slice(0, 10),
    sourceType: body.sourceType ?? 'Purchase',
    refDocId: body.refDocId ?? '',
    supplier: body.supplier ?? '',
    status: body.status ?? 'Pending',
    batchNumber: body.batchNumber ?? '',
    expiryDate: body.expiryDate ?? '',
    notes: body.notes ?? '',
  };
}

export function mapApiStockOutRow(doc: Record<string, unknown>): Record<string, unknown> {
  return {
    ...mapBaseRow(doc),
    productId: doc.productId ?? '',
    product: doc.product ?? '',
    warehouseId: doc.warehouseId ?? '',
    qty: doc.qty ?? 0,
    unitValue: doc.unitValue ?? 0,
    date: doc.date ?? '',
    sourceType: doc.sourceType ?? 'Sales',
    refDocId: doc.refDocId ?? '',
    reasonCode: doc.reasonCode ?? '',
    status: doc.status ?? 'Pending',
    notes: doc.notes ?? '',
  };
}

export function mapStockOutPayloadToApi(
  body: Record<string, unknown>,
  productName?: string,
): Record<string, unknown> {
  return {
    productId: body.productId,
    product: productName ?? body.product ?? '',
    warehouseId: body.warehouseId ?? '',
    qty: Number(body.qty ?? 0),
    unitValue: Number(body.unitValue ?? 0),
    date: body.date ?? new Date().toISOString().slice(0, 10),
    sourceType: body.sourceType ?? 'Sales',
    refDocId: body.refDocId ?? '',
    reasonCode: body.reasonCode ?? '',
    status: body.status ?? 'Pending',
    notes: body.notes ?? '',
  };
}

export function mapApiStockTransferRow(doc: Record<string, unknown>): Record<string, unknown> {
  return {
    ...mapBaseRow(doc),
    productId: doc.productId ?? '',
    product: doc.product ?? '',
    fromWarehouseId: doc.fromWarehouseId ?? '',
    toWarehouseId: doc.toWarehouseId ?? '',
    qty: doc.qty ?? 0,
    date: doc.date ?? '',
    status: doc.status ?? 'Pending',
    notes: doc.notes ?? '',
  };
}

export function mapStockTransferPayloadToApi(
  body: Record<string, unknown>,
  productName?: string,
): Record<string, unknown> {
  return {
    productId: body.productId,
    product: productName ?? body.product ?? '',
    fromWarehouseId: body.fromWarehouseId ?? body.fromWh ?? body.from ?? '',
    toWarehouseId: body.toWarehouseId ?? body.toWh ?? body.to ?? '',
    qty: Number(body.qty ?? 0),
    date: body.date ?? new Date().toISOString().slice(0, 10),
    status: body.status ?? 'Pending',
    notes: body.notes ?? '',
  };
}

export function mapApiStockAdjustmentRow(doc: Record<string, unknown>): Record<string, unknown> {
  return {
    ...mapBaseRow(doc),
    productId: doc.productId ?? '',
    product: doc.product ?? '',
    warehouseId: doc.warehouseId ?? '',
    qty: doc.qty ?? 0,
    unitValue: doc.unitValue ?? 0,
    type: doc.type ?? 'Increase',
    date: doc.date ?? '',
    reason: doc.reason ?? '',
    status: doc.status ?? 'Pending',
    notes: doc.notes ?? '',
    approvedBy: doc.approvedBy ?? '',
  };
}

export function mapStockAdjustmentPayloadToApi(
  body: Record<string, unknown>,
  productName?: string,
): Record<string, unknown> {
  return {
    productId: body.productId,
    product: productName ?? body.product ?? '',
    warehouseId: body.warehouseId ?? '',
    qty: Number(body.qty ?? body.delta ?? 0),
    unitValue: Number(body.unitValue ?? 0),
    type: body.type ?? 'Increase',
    date: body.date ?? new Date().toISOString().slice(0, 10),
    reason: body.reason ?? '',
    status: body.status ?? 'Pending',
    notes: body.notes ?? '',
  };
}
