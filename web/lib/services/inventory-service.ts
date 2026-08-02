import type { AppState } from '@/lib/state/types';
import { listFromState, createInState, updateInState, deleteFromState, formatCurrency } from '@/lib/services/domain-service';

type Row = Record<string, unknown>;

export const PRODUCT_TYPES = ['Raw Materials', 'Semi-Finished Goods', 'Finished Goods', 'Service'];

export function listInventory(state: AppState, filter?: { productType?: string; excludeRaw?: boolean; rawOnly?: boolean }) {
  let rows = listFromState(state, 'inventory');
  if (filter?.rawOnly) {
    rows = rows.filter((r) => String(r.productType ?? '').toLowerCase().includes('raw'));
  } else if (filter?.excludeRaw) {
    rows = rows.filter((r) => !String(r.productType ?? '').toLowerCase().includes('raw'));
  }
  if (filter?.productType && filter.productType !== 'all') {
    rows = rows.filter((r) => String(r.productType ?? '') === filter.productType);
  }
  return rows;
}

export function listCategories(state: AppState) {
  return listFromState(state, 'inventoryCategories');
}

export function listUnits(state: AppState) {
  return listFromState(state, 'inventoryUnits');
}

export function listWarehouses(state: AppState) {
  return listFromState(state, 'inventoryWarehouses');
}

export function getWarehouseName(state: AppState, id: string) {
  const wh = listWarehouses(state).find((w) => String(w.id) === id);
  return wh ? String(wh.name) : id;
}

export function computeTotalStock(item: Row) {
  const ws = item.warehouseStock as Record<string, number> | undefined;
  if (ws && Object.keys(ws).length) {
    return Object.values(ws).reduce((s, v) => s + Number(v || 0), 0);
  }
  return Number(item.stock ?? 0);
}

export function computeAvailableStock(item: Row) {
  return Math.max(0, computeTotalStock(item) - Number(item.reserved ?? 0));
}

export function getProductStockStatus(item: Row): 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Discontinued' {
  if (item.discontinued) return 'Discontinued';
  const available = computeAvailableStock(item);
  const min = Number(item.minStock ?? item.reorderLevel ?? 0);
  if (available <= 0) return 'Out of Stock';
  if (min > 0 && available <= min) return 'Low Stock';
  return 'In Stock';
}

export function getProductMetrics(state: AppState, products?: Row[]) {
  const items = products ?? listInventory(state, { excludeRaw: false });
  const active = items.filter((i) => !i.discontinued);
  const totalStock = active.reduce((s, i) => s + computeTotalStock(i), 0);
  const lowStock = active.filter((i) => getProductStockStatus(i) === 'Low Stock').length;
  const outOfStock = active.filter((i) => getProductStockStatus(i) === 'Out of Stock').length;
  const inventoryValue = active.reduce((s, i) => s + computeTotalStock(i) * Number(i.cost ?? 0), 0);
  return {
    totalSkus: items.length,
    totalStock,
    lowStock,
    outOfStock,
    inventoryValue,
  };
}

export function syncWarehouseStock(allocations: Record<string, number>) {
  const stock = Object.values(allocations).reduce((s, v) => s + Number(v || 0), 0);
  return { warehouseStock: allocations, stock };
}

export function buildDefaultWarehouseAllocations(state: AppState) {
  const allocations: Record<string, number> = {};
  listWarehouses(state).forEach((wh) => {
    allocations[String(wh.id)] = 0;
  });
  return allocations;
}

export function previewProductSku(state: AppState): string {
  const rows = listInventory(state, { excludeRaw: false });
  const nums = rows
    .map((r) => String(r.sku ?? ''))
    .filter((sku) => /^TOY-\d+$/i.test(sku))
    .map((sku) => parseInt(sku.replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `TOY-${String(max + 1).padStart(6, '0')}`;
}

export function createProduct(state: AppState, payload: Row) {
  const allocations = (payload.warehouseStock as Record<string, number>) ?? buildDefaultWarehouseAllocations(state);
  const synced = syncWarehouseStock(allocations);
  return createInState(state, 'inventory', {
    ...payload,
    ...synced,
    discontinued: Boolean(payload.discontinued),
    reserved: Number(payload.reserved ?? 0),
    cost: Number(payload.cost ?? 0),
    price: Number(payload.price ?? 0),
    wholesalePrice: Number(payload.wholesalePrice ?? 0),
    taxRate: Number(payload.taxRate ?? 0),
    minStock: Number(payload.minStock ?? 0),
    reorderLevel: Number(payload.reorderLevel ?? 0),
  }, 'SKU');
}

export function updateProduct(state: AppState, id: string, payload: Row) {
  const patch = { ...payload };
  if (payload.warehouseStock) {
    Object.assign(patch, syncWarehouseStock(payload.warehouseStock as Record<string, number>));
  }
  return updateInState(state, 'inventory', id, patch);
}

export function toggleDiscontinued(state: AppState, id: string) {
  const rows = listFromState(state, 'inventory');
  const item = rows.find((r) => String(r.id) === id);
  if (!item) return { ok: false as const, error: 'Not found' };
  return updateInState(state, 'inventory', id, { discontinued: !item.discontinued });
}

export function deleteProduct(state: AppState, id: string) {
  return deleteFromState(state, 'inventory', id);
}

export function createInventoryItem(state: AppState, payload: Row) {
  return createProduct(state, payload);
}

export function updateInventoryItem(state: AppState, id: string, payload: Row) {
  return updateProduct(state, id, payload);
}

export function deleteInventoryItem(state: AppState, id: string) {
  return deleteProduct(state, id);
}

function findProductByIdOrName(state: AppState, productRef: string) {
  const rows = listFromState(state, 'inventory');
  return rows.find((r) => String(r.id) === productRef || String(r.name) === productRef || String(r.sku) === productRef);
}

function applyStockChange(state: AppState, productId: string, warehouseId: string, delta: number) {
  const rows = listFromState(state, 'inventory');
  const idx = rows.findIndex((r) => String(r.id) === productId);
  if (idx < 0) return { ok: false as const, error: 'Product not found' };
  const item = { ...rows[idx] };
  const ws = { ...(item.warehouseStock as Record<string, number> ?? {}) };
  if (warehouseId) {
    ws[warehouseId] = Math.max(0, Number(ws[warehouseId] ?? 0) + delta);
  }
  const synced = syncWarehouseStock(ws);
  Object.assign(item, synced);
  const next = [...rows];
  next[idx] = item;
  (state as Record<string, unknown>).inventory = next;
  return { ok: true as const };
}

export function createStockIn(state: AppState, payload: Row) {
  const product = findProductByIdOrName(state, String(payload.productId ?? payload.product ?? ''));
  if (!product) return { ok: false as const, error: 'Product not found' };
  const qty = Number(payload.qty ?? 0);
  const wh = String(payload.warehouseId ?? payload.warehouse ?? listWarehouses(state)[0]?.id ?? '');
  const unitCost = Number(payload.unitCost ?? 0);
  const status = String(payload.status ?? 'Pending');
  const key = 'inventoryStockIn';
  const result = createInState(state, key, {
    ...payload,
    productId: product.id,
    product: product.name,
    qty,
    unitCost,
    warehouseId: wh,
    date: payload.date ?? new Date().toISOString().slice(0, 10),
    status,
  }, 'SI');
  if (result.ok && status === 'Approved') applyStockChange(state, String(product.id), wh, qty);
  return result;
}

export function createStockOut(state: AppState, payload: Row) {
  const product = findProductByIdOrName(state, String(payload.productId ?? payload.product ?? ''));
  if (!product) return { ok: false as const, error: 'Product not found' };
  const qty = Number(payload.qty ?? 0);
  const wh = String(payload.warehouseId ?? payload.warehouse ?? listWarehouses(state)[0]?.id ?? '');
  const status = String(payload.status ?? 'Pending');
  if (status === 'Completed') {
    const available = computeAvailableStock(product);
    if (qty > available) return { ok: false as const, error: `Insufficient stock (available: ${available})` };
  }
  const result = createInState(state, 'inventoryStockOut', {
    ...payload,
    productId: product.id,
    product: product.name,
    qty,
    unitValue: Number(payload.unitValue ?? product.cost ?? 0),
    warehouseId: wh,
    date: payload.date ?? new Date().toISOString().slice(0, 10),
    status,
  }, 'SO');
  if (result.ok && status === 'Completed') applyStockChange(state, String(product.id), wh, -qty);
  return result;
}

export function createTransfer(state: AppState, payload: Row) {
  const product = findProductByIdOrName(state, String(payload.productId ?? payload.product ?? ''));
  if (!product) return { ok: false as const, error: 'Product not found' };
  const qty = Number(payload.qty ?? 0);
  const from = String(payload.fromWarehouseId ?? payload.fromWh ?? payload.from ?? '');
  const to = String(payload.toWarehouseId ?? payload.toWh ?? payload.to ?? '');
  if (!from || !to) return { ok: false as const, error: 'From and To warehouses required' };
  const status = String(payload.status ?? 'Pending');
  if (status === 'Completed') {
    const ws = (product.warehouseStock as Record<string, number>) ?? {};
    if (Number(ws[from] ?? 0) < qty) return { ok: false as const, error: 'Insufficient stock at source warehouse' };
  }
  const result = createInState(state, 'inventoryStockTransfers', {
    ...payload,
    productId: product.id,
    product: product.name,
    qty,
    fromWarehouseId: from,
    toWarehouseId: to,
    date: payload.date ?? new Date().toISOString().slice(0, 10),
    status,
  }, 'ST');
  if (result.ok && status === 'Completed') {
    applyStockChange(state, String(product.id), from, -qty);
    applyStockChange(state, String(product.id), to, qty);
  }
  return result;
}

export function createAdjustment(state: AppState, payload: Row) {
  const product = findProductByIdOrName(state, String(payload.productId ?? payload.product ?? ''));
  if (!product) return { ok: false as const, error: 'Product not found' };
  const qty = Number(payload.qty ?? payload.delta ?? 0);
  const wh = String(payload.warehouseId ?? payload.warehouse ?? listWarehouses(state)[0]?.id ?? '');
  const status = String(payload.status ?? 'Pending');
  const type = String(payload.type ?? 'Increase');
  const result = createInState(state, 'inventoryStockAdjustments', {
    ...payload,
    productId: product.id,
    product: product.name,
    qty,
    unitValue: Number(payload.unitValue ?? product.cost ?? 0),
    warehouseId: wh,
    type,
    date: payload.date ?? new Date().toISOString().slice(0, 10),
    status,
  }, 'ADJ');
  if (result.ok && status === 'Completed') {
    const delta = type === 'Decrease' ? -qty : qty;
    applyStockChange(state, String(product.id), wh, delta);
  }
  return result;
}

export function createCategory(state: AppState, payload: Row) {
  return createInState(state, 'inventoryCategories', payload, 'CAT');
}

export function updateCategory(state: AppState, id: string, payload: Row) {
  return updateInState(state, 'inventoryCategories', id, payload);
}

export function deleteCategory(state: AppState, id: string) {
  return deleteFromState(state, 'inventoryCategories', id);
}

export function createUnit(state: AppState, payload: Row) {
  return createInState(state, 'inventoryUnits', payload, 'UOM');
}

export function updateUnit(state: AppState, id: string, payload: Row) {
  return updateInState(state, 'inventoryUnits', id, payload);
}

export function deleteUnit(state: AppState, id: string) {
  return deleteFromState(state, 'inventoryUnits', id);
}

export function createWarehouse(state: AppState, payload: Row) {
  return createInState(state, 'inventoryWarehouses', payload, 'WH');
}

export function updateWarehouse(state: AppState, id: string, payload: Row) {
  return updateInState(state, 'inventoryWarehouses', id, payload);
}

export function deleteWarehouse(state: AppState, id: string) {
  return deleteFromState(state, 'inventoryWarehouses', id);
}

export function listRawMaterials(state: AppState) {
  return listFromState(state, 'rawMaterials');
}

export function getRawMaterialMetrics(state: AppState) {
  const items = listRawMaterials(state);
  const totalValue = items.reduce((s, r) => s + getRawMaterialTotalValue(r), 0);
  const totalQuantity = items.reduce((s, r) => s + Number(r.quantity ?? 0), 0);
  const lowStock = items.filter((r) => getRawMaterialStockStatus(r) === 'Low Stock').length;
  const outOfStock = items.filter((r) => getRawMaterialStockStatus(r) === 'Out of Stock').length;
  return { count: items.length, totalValue, totalQuantity, lowStock, outOfStock };
}

export function getRawMaterialStockStatus(rm: Row): 'In Stock' | 'Low Stock' | 'Out of Stock' {
  const qty = Number(rm.quantity ?? 0);
  const threshold = Number(rm.threshold ?? 100);
  if (qty <= 0) return 'Out of Stock';
  if (qty < threshold) return 'Low Stock';
  return 'In Stock';
}

export function getRawMaterialTotalValue(rm: Row) {
  return Number(rm.quantity ?? 0) * Number(rm.price ?? 0);
}

export function getRawMaterialLocationLabel(state: AppState, rm: Row) {
  const whId = String(rm.warehouseId ?? 'WH-001');
  const whName = getWarehouseName(state, whId);
  const bin = String(rm.location ?? '').trim();
  return bin ? `${whName} · ${bin}` : whName;
}

export function listRawMaterialCategories(state: AppState) {
  const cats = new Set(
    listRawMaterials(state).map((r) => String(r.category ?? 'Uncategorized').trim() || 'Uncategorized'),
  );
  return Array.from(cats).sort((a, b) => a.localeCompare(b));
}

export function rawMaterialStockStatusClass(status: string) {
  if (status === 'Out of Stock') return 'text-rose-600';
  if (status === 'Low Stock') return 'text-amber-600';
  return 'text-emerald-600';
}

export function createRawMaterial(state: AppState, payload: Row) {
  return createInState(state, 'rawMaterials', {
    ...payload,
    quantity: Number(payload.quantity ?? 0),
    price: Number(payload.price ?? 0),
    threshold: Number(payload.threshold ?? 0),
    supplierPrice: Number(payload.supplierPrice ?? 0),
    status: payload.status ?? 'active',
    lastUpdated: new Date().toISOString(),
  }, 'RM');
}

export function updateRawMaterial(state: AppState, id: string, payload: Row) {
  return updateInState(state, 'rawMaterials', id, { ...payload, lastUpdated: new Date().toISOString() });
}

export function deleteRawMaterial(state: AppState, id: string) {
  return deleteFromState(state, 'rawMaterials', id);
}

function listStockRecords(state: AppState, primaryKey: string, fallbackKey?: string) {
  const primary = listFromState(state, primaryKey);
  if (primary.length || !fallbackKey) return primary;
  return listFromState(state, fallbackKey);
}

export function listStockInRecords(state: AppState) {
  return listStockRecords(state, 'inventoryStockIn', 'stockIn');
}

export function listStockOutRecords(state: AppState) {
  return listStockRecords(state, 'inventoryStockOut', 'stockOut');
}

export function listTransferRecords(state: AppState) {
  return listStockRecords(state, 'inventoryStockTransfers', 'stockTransfers');
}

export function listAdjustmentRecords(state: AppState) {
  return listStockRecords(state, 'inventoryStockAdjustments', 'stockAdjustments');
}

export function getStockInMetrics(state: AppState) {
  const list = listStockInRecords(state);
  const totalQty = list.reduce((s, i) => s + Number(i.qty ?? 0), 0);
  const totalVal = list.reduce((s, i) => s + Number(i.qty ?? 0) * Number(i.unitCost ?? 0), 0);
  const pending = list.filter((i) => String(i.status) === 'Pending').length;
  return { totalRuns: list.length, totalQty, totalVal, pending };
}

export function getStockOutMetrics(state: AppState) {
  const list = listStockOutRecords(state);
  let totalQty = 0;
  let totalValue = 0;
  let pendingQty = 0;
  let lostValue = 0;
  list.forEach((item) => {
    const val = Number(item.qty ?? 0) * Number(item.unitValue ?? 0);
    if (String(item.status) === 'Completed') {
      totalQty += Number(item.qty ?? 0);
      totalValue += val;
      if (String(item.sourceType) === 'Damage' || ['Damage', 'Expiry'].includes(String(item.reasonCode))) {
        lostValue += val;
      }
    } else if (String(item.status) === 'Pending') {
      pendingQty += Number(item.qty ?? 0);
    }
  });
  return { totalRuns: list.length, totalQty, totalValue, pendingQty, lostValue };
}

export function getTransferMetrics(state: AppState) {
  const list = listTransferRecords(state);
  const pending = list.filter((i) => String(i.status) === 'Pending').length;
  const completed = list.filter((i) => String(i.status) === 'Completed').length;
  const totalQty = list.reduce((s, i) => s + Number(i.qty ?? 0), 0);
  return { total: list.length, pending, completed, totalQty };
}

export function getAdjustmentMetrics(state: AppState) {
  const list = listAdjustmentRecords(state);
  let totalIncreasedQty = 0;
  let totalDecreasedQty = 0;
  let netValue = 0;
  let pendingCount = 0;
  list.forEach((item) => {
    const val = Number(item.qty ?? 0) * Number(item.unitValue ?? 0);
    if (String(item.status) === 'Completed') {
      if (String(item.type) === 'Increase') {
        totalIncreasedQty += Number(item.qty ?? 0);
        netValue += val;
      } else {
        totalDecreasedQty += Number(item.qty ?? 0);
        netValue -= val;
      }
    } else if (String(item.status) === 'Pending') {
      pendingCount += 1;
    }
  });
  return { totalRuns: list.length, totalIncreasedQty, totalDecreasedQty, netValue, pendingCount };
}

export function getCategoryMetrics(state: AppState) {
  const categories = listCategories(state);
  const products = listInventory(state);
  const viewModels: Row[] = categories.map((cat) => {
    const linked = products.filter((p) => String(p.category) === String(cat.name));
    const productCount = linked.length;
    const totalStockValue = linked.reduce((s, p) => s + computeTotalStock(p) * Number(p.cost ?? 0), 0);
    const parent = categories.find((c) => String(c.id) === String(cat.parentId));
    return { ...cat, parentCategoryName: parent ? String(parent.name) : '—', productCount, totalStockValue };
  });
  const activeCategories = viewModels.filter((c) => String(c.status) === 'Active').length;
  const emptyCategories = viewModels.filter((c) => Number(c.productCount ?? 0) === 0).length;
  const topCategory = viewModels.reduce<Row | null>((top, c) => (
    Number(c.totalStockValue ?? 0) > Number(top?.totalStockValue ?? 0) ? c : top
  ), null);
  return { categories: viewModels, activeCategories, emptyCategories, topCategory };
}

export function countProductsUsingUnit(state: AppState, unit: Row) {
  const code = String(unit.code ?? unit.symbol ?? '');
  return listInventory(state).filter((p) => String(p.uom) === code).length;
}

export function getUnitMetrics(state: AppState) {
  const units = listUnits(state);
  const activeUnits = units.filter((u) => String(u.status) === 'Active').length;
  const usedUnits = units.filter((u) => countProductsUsingUnit(state, u) > 0).length;
  return { total: units.length, activeUnits, usedUnits, units };
}

export function getWarehouseDerivedStats(state: AppState, warehouseId: string) {
  return listInventory(state).reduce(
    (summary: { currentStock: number; stockValueStored: number; activeProductsCount: number }, product) => {
      const ws = product.warehouseStock as Record<string, number> | undefined;
      const allocatedQty = Number(ws?.[warehouseId] ?? 0);
      if (allocatedQty <= 0) return summary;
      summary.currentStock += allocatedQty;
      summary.stockValueStored += allocatedQty * Number(product.cost ?? 0);
      summary.activeProductsCount += 1;
      return summary;
    },
    { currentStock: 0, stockValueStored: 0, activeProductsCount: 0 },
  );
}

export function getWarehouseViewModels(state: AppState): Row[] {
  return listWarehouses(state).map((wh) => {
    const derived = getWarehouseDerivedStats(state, String(wh.id));
    const capacity = Number(wh.capacity ?? 0);
    const utilizationPercent = capacity > 0 ? (derived.currentStock / capacity) * 100 : 0;
    return { ...wh, ...derived, utilizationPercent };
  });
}

export function getWarehouseMetrics(state: AppState) {
  const warehouses = getWarehouseViewModels(state);
  const totalCapacity = warehouses.reduce((s, w) => s + Number(w.capacity ?? 0), 0);
  const totalCurrentStock = warehouses.reduce((s, w) => s + Number(w.currentStock ?? 0), 0);
  const activeWarehouses = warehouses.filter((w) => String(w.status) === 'Active').length;
  const inactiveWarehouses = warehouses.length - activeWarehouses;
  const utilizationPercent = totalCapacity > 0 ? (totalCurrentStock / totalCapacity) * 100 : 0;
  return { warehouses, totalCapacity, totalCurrentStock, activeWarehouses, inactiveWarehouses, utilizationPercent };
}

export function updateStockIn(state: AppState, id: string, payload: Row) {
  const key = Array.isArray((state as Record<string, unknown>).inventoryStockIn) ? 'inventoryStockIn' : 'stockIn';
  return updateInState(state, key, id, payload);
}

export function approveStockIn(state: AppState, id: string) {
  const rows = listStockInRecords(state);
  const item = rows.find((r) => String(r.id) === id);
  if (!item) return { ok: false as const, error: 'Not found' };
  if (String(item.status) === 'Approved') return { ok: true as const };
  const wh = String(item.warehouseId ?? '');
  const productId = String(item.productId ?? '');
  applyStockChange(state, productId, wh, Number(item.qty ?? 0));
  const key = Array.isArray((state as Record<string, unknown>).inventoryStockIn) ? 'inventoryStockIn' : 'stockIn';
  return updateInState(state, key, id, { status: 'Approved', approvedBy: 'Current User' });
}

export function updateStockOut(state: AppState, id: string, payload: Row) {
  const key = Array.isArray((state as Record<string, unknown>).inventoryStockOut) ? 'inventoryStockOut' : 'stockOut';
  return updateInState(state, key, id, payload);
}

export function completeStockOut(state: AppState, id: string) {
  const rows = listStockOutRecords(state);
  const item = rows.find((r) => String(r.id) === id);
  if (!item) return { ok: false as const, error: 'Not found' };
  if (String(item.status) === 'Completed') return { ok: true as const };
  const product = findProductByIdOrName(state, String(item.productId ?? ''));
  if (!product) return { ok: false as const, error: 'Product not found' };
  const qty = Number(item.qty ?? 0);
  const available = computeAvailableStock(product);
  if (qty > available) return { ok: false as const, error: `Insufficient stock (available: ${available})` };
  applyStockChange(state, String(product.id), String(item.warehouseId ?? ''), -qty);
  const key = Array.isArray((state as Record<string, unknown>).inventoryStockOut) ? 'inventoryStockOut' : 'stockOut';
  return updateInState(state, key, id, { status: 'Completed' });
}

export function approveAdjustment(state: AppState, id: string) {
  const rows = listAdjustmentRecords(state);
  const item = rows.find((r) => String(r.id) === id);
  if (!item) return { ok: false as const, error: 'Not found' };
  if (String(item.status) === 'Completed') return { ok: true as const };
  const qty = Number(item.qty ?? 0);
  const delta = String(item.type) === 'Decrease' ? -qty : qty;
  applyStockChange(state, String(item.productId ?? ''), String(item.warehouseId ?? ''), delta);
  const key = Array.isArray((state as Record<string, unknown>).inventoryStockAdjustments) ? 'inventoryStockAdjustments' : 'stockAdjustments';
  return updateInState(state, key, id, { status: 'Completed', approvedBy: 'Current User' });
}

export function updateTransfer(state: AppState, id: string, payload: Row) {
  const key = Array.isArray((state as Record<string, unknown>).inventoryStockTransfers) ? 'inventoryStockTransfers' : 'stockTransfers';
  return updateInState(state, key, id, payload);
}

export function completeTransfer(state: AppState, id: string) {
  const rows = listTransferRecords(state);
  const item = rows.find((r) => String(r.id) === id);
  if (!item) return { ok: false as const, error: 'Not found' };
  if (String(item.status) === 'Completed') return { ok: true as const };
  const product = findProductByIdOrName(state, String(item.productId ?? ''));
  if (!product) return { ok: false as const, error: 'Product not found' };
  const qty = Number(item.qty ?? 0);
  const from = String(item.fromWarehouseId ?? item.fromWh ?? '');
  const to = String(item.toWarehouseId ?? item.toWh ?? '');
  const ws = (product.warehouseStock as Record<string, number>) ?? {};
  if (Number(ws[from] ?? 0) < qty) return { ok: false as const, error: 'Insufficient stock at source warehouse' };
  applyStockChange(state, String(product.id), from, -qty);
  applyStockChange(state, String(product.id), to, qty);
  const key = Array.isArray((state as Record<string, unknown>).inventoryStockTransfers) ? 'inventoryStockTransfers' : 'stockTransfers';
  return updateInState(state, key, id, { status: 'Completed' });
}

export { formatCurrency as formatMoney };
