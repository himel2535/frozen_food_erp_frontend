import type { ProductTypeCardId } from '@/components/modules/inventory/product-form/product-form-options';
import {
  backendToProductTypeCardId,
  getProductTaxRateByLabel,
  productTypeCardIdToBackend,
  taxRateToLabel,
} from '@/components/modules/inventory/product-form/product-form-options';

export type ProductFormValues = {
  name: string;
  sku: string;
  category: string;
  uom: string;
  barcode: string;
  productTypeId: ProductTypeCardId;
  cost: string;
  price: string;
  taxLabel: string;
  openingStock: string;
  minStock: string;
  allocateAcrossWarehouses: boolean;
  reserved: string;
  wholesalePrice: string;
  reorderLevel: string;
  defaultWarehouse: string;
  description: string;
  discontinued: boolean;
};

export type ProductFormPayload = {
  name: string;
  sku: string;
  category: string;
  uom: string;
  barcode: string;
  productType: string;
  cost: number;
  price: number;
  taxRate: number;
  minStock: number;
  reserved: number;
  wholesalePrice: number;
  reorderLevel: number;
  defaultWarehouse: string;
  description: string;
  discontinued: boolean;
  warehouseStock: Record<string, number>;
};

export function computeProfitMargin(cost: number, price: number) {
  const profit = price - cost;
  const marginPct = cost > 0 ? (profit / cost) * 100 : 0;
  return { profit, marginPct };
}

export function resolveWarehouseStock(
  values: ProductFormValues,
  warehouseStock: Record<string, string>,
  warehouseIds: string[],
): Record<string, number> {
  const opening = Number(values.openingStock || 0);
  const result: Record<string, number> = {};
  warehouseIds.forEach((id) => {
    result[id] = 0;
  });

  if (values.allocateAcrossWarehouses) {
    warehouseIds.forEach((id) => {
      result[id] = Number(warehouseStock[id] || 0);
    });
    return result;
  }

  const targetId = values.defaultWarehouse || warehouseIds[0];
  if (targetId) result[targetId] = opening;
  return result;
}

export function formValuesToPayload(
  values: ProductFormValues,
  warehouseStock: Record<string, string>,
  warehouseIds: string[],
): ProductFormPayload {
  return {
    name: values.name.trim(),
    sku: values.sku.trim(),
    category: values.category,
    uom: values.uom,
    barcode: values.barcode.trim(),
    productType: productTypeCardIdToBackend(values.productTypeId),
    cost: Number(values.cost || 0),
    price: Number(values.price || 0),
    taxRate: getProductTaxRateByLabel(values.taxLabel) * 100,
    minStock: Number(values.minStock || 0),
    reserved: Number(values.reserved || 0),
    wholesalePrice: Number(values.wholesalePrice || 0),
    reorderLevel: Number(values.reorderLevel || 0),
    defaultWarehouse: values.defaultWarehouse,
    description: values.description.trim(),
    discontinued: values.discontinued,
    warehouseStock: resolveWarehouseStock(values, warehouseStock, warehouseIds),
  };
}

export function rowToProductFormValues(
  row: Record<string, unknown>,
  warehouseIds: string[],
): ProductFormValues {
  const ws = (row.warehouseStock as Record<string, number>) ?? {};
  const openingStock = Object.values(ws).reduce((s, v) => s + Number(v || 0), 0);
  const usedWarehouses = Object.entries(ws).filter(([, v]) => Number(v) > 0);

  return {
    name: String(row.name ?? ''),
    sku: String(row.sku ?? ''),
    category: String(row.category ?? ''),
    uom: String(row.uom ?? ''),
    barcode: String(row.barcode ?? ''),
    productTypeId: backendToProductTypeCardId(String(row.productType ?? 'Finished Goods')),
    cost: String(row.cost ?? ''),
    price: String(row.price ?? ''),
    taxLabel: taxRateToLabel(Number(row.taxRate ?? 0)),
    openingStock: String(openingStock),
    minStock: String(row.minStock ?? '10'),
    allocateAcrossWarehouses: usedWarehouses.length > 1,
    reserved: String(row.reserved ?? 0),
    wholesalePrice: String(row.wholesalePrice ?? ''),
    reorderLevel: String(row.reorderLevel ?? ''),
    defaultWarehouse: String(row.defaultWarehouse ?? warehouseIds[0] ?? ''),
    description: String(row.description ?? ''),
    discontinued: Boolean(row.discontinued),
  };
}

export function warehouseStockToStrings(
  row: Record<string, unknown>,
  warehouseIds: string[],
): Record<string, string> {
  const ws = (row.warehouseStock as Record<string, number>) ?? {};
  const result: Record<string, string> = {};
  warehouseIds.forEach((id) => {
    result[id] = String(ws[id] ?? 0);
  });
  return result;
}
