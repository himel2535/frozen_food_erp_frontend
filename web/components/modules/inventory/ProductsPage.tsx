'use client';

import { toast, confirmAction } from '@/lib/ui/feedback';

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Footer } from '@/components/layout/Footer';
import { useChromeSuppressed, useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { useInventoryEditAccess } from '@/hooks/use-inventory-edit-access';
import { InventoryEditActions } from '@/components/modules/inventory/shared/inventory-ui';
import { ModuleToolbarActions } from '@/components/shared/ListToolbar';
import { ModuleFilterBar } from '@/components/shared/ModuleFilterBar';
import { MODULE_FILTER_INPUT } from '@/lib/ui/module-chrome-styles';
import { ModuleKpiSection } from '@/components/shared/ModuleKpiSection';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { InventoryItemThumb } from '@/components/shared/InventoryItemThumb';
import { useAppStore } from '@/lib/state/app-store';
import { Package } from 'lucide-react';
import { INVENTORY_STANDARD_KPI_ICONS as KPI_ICON } from '@/lib/ui/kpi-icons';
import { ProductForm } from '@/components/modules/inventory/product-form/ProductForm';
import type { ProductFormPayload, ProductFormValues } from '@/components/modules/inventory/product-form/product-form-types';
import {
  rowToProductFormValues,
  warehouseStockToStrings,
} from '@/components/modules/inventory/product-form/product-form-types';
import { isModuleApiMode } from '@/lib/config/data-source';
import { usePaginatedApiResource } from '@/hooks/use-paginated-api-resource';
import { useSubmitGuard } from '@/hooks/use-submit-guard';
import { ListPagination } from '@/components/shared/ListPagination';
import { useInventoryLookups } from '@/hooks/use-inventory-lookups';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { isModuleBootLoading, pickApiListRows } from '@/lib/ui/kpi-loading';
import { apiListEmptyMessage } from '@/lib/services/api-list-ui';
import { attachBackgroundImageLater } from '@/lib/services/background-image-attach';
import { fetchNextProductSku, patchProductImageUrl } from '@/lib/services/products-api-service';
import type { PendingImageUpload } from '@/components/shared/ImageUploadField';
import { mapApiProductRow, mapProductPayloadToApi } from '@/lib/services/entity-api-mappers';
import {
  listInventory,
  listCategories,
  listUnits,
  listWarehouses,
  getProductMetrics,
  getProductStockStatus,
  computeTotalStock,
  computeAvailableStock,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleDiscontinued,
  previewProductSku,
  formatMoney,
  PRODUCT_TYPES,
  sortInventoryRowsNewestFirst,
} from '@/lib/services/inventory-service';

function buildEmptyFormValues(
  categories: Array<Record<string, unknown>>,
  units: Array<Record<string, unknown>>,
  warehouses: Array<Record<string, unknown>>,
  sku: string,
): ProductFormValues {
  return {
    name: '',
    sku,
    category: categories[0]?.name ? String(categories[0].name) : '',
    uom: units[0]?.code ? String(units[0].code) : '',
    barcode: '',
    productTypeId: 'finished',
    imageUrl: '',
    imagePublicId: '',
    cost: '',
    price: '',
    taxLabel: 'No Tax',
    openingStock: '0',
    minStock: '10',
    stockDurationDays: '',
    allocateAcrossWarehouses: false,
    reserved: '0',
    wholesalePrice: '',
    reorderLevel: '',
    defaultWarehouse: warehouses[0]?.id ? String(warehouses[0].id) : '',
    description: '',
    discontinued: false,
  };
}

function emptyWarehouseStock(warehouseIds: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  warehouseIds.forEach((id) => {
    result[id] = '0';
  });
  return result;
}

function isDuplicateSkuError(message: string): boolean {
  return /409|duplicate|conflict/i.test(message);
}

export function ProductsPage() {
  const { canEdit, guardEdit } = useInventoryEditAccess();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const apiMode = isModuleApiMode('products');
  const apiStore = usePaginatedApiResource('products', mapApiProductRow, { pageSize: 10 });
  const bootLoading = isModuleBootLoading(apiMode, apiStore.initialized);
  const lookups = useInventoryLookups();
  const [view, setView] = useState<'main' | 'form'>('main');
  const [localSearch, setLocalSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<ProductFormValues | null>(null);
  const [warehouseStock, setWarehouseStock] = useState<Record<string, string>>({});
  const [formKey, setFormKey] = useState(0);
  const [localPage, setLocalPage] = useState(1);
  const { guardSubmit } = useSubmitGuard();
  const pageSize = 10;

  const categories = useMemo(
    () => (apiMode ? lookups.categories : listCategories(appState)),
    [apiMode, lookups.categories, appState],
  );
  const units = useMemo(
    () => (apiMode ? lookups.units : listUnits(appState)),
    [apiMode, lookups.units, appState],
  );
  const warehouses = useMemo(
    () => (apiMode ? lookups.warehouses : listWarehouses(appState)),
    [apiMode, lookups.warehouses, appState],
  );
  const warehouseIds = useMemo(() => warehouses.map((wh) => String(wh.id)), [warehouses]);

  useEffect(() => {
    if (!apiMode) return;
    apiStore.setQueryFilter('category', categoryFilter);
  }, [apiMode, categoryFilter, apiStore.setQueryFilter]);

  useEffect(() => {
    if (!apiMode) return;
    apiStore.setQueryFilter('productType', typeFilter);
  }, [apiMode, typeFilter, apiStore.setQueryFilter]);

  const allProducts = useMemo(() => {
    const local = listInventory(appState, { excludeRaw: true });
    return pickApiListRows(apiMode, apiStore.initialized, apiStore.rows, local);
  }, [apiMode, apiStore.initialized, apiStore.rows, appState]);

  const products = useMemo(() => {
    let data = allProducts;
    if (!apiMode) {
      const q = localSearch.toLowerCase().trim();
      if (q) {
        data = data.filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(q));
      }
      if (categoryFilter !== 'all') data = data.filter((p) => String(p.category) === categoryFilter);
      if (typeFilter !== 'all') data = data.filter((p) => String(p.productType) === typeFilter);
    }
    if (stockFilter !== 'all') {
      data = data.filter((p) => {
        const status = getProductStockStatus(p);
        if (stockFilter === 'low-stock') return status === 'Low Stock';
        if (stockFilter === 'out-of-stock') return status === 'Out of Stock';
        if (stockFilter === 'in-stock') return status === 'In Stock';
        return true;
      });
    }
    if (!apiMode) return sortInventoryRowsNewestFirst(data);
    return data;
  }, [allProducts, apiMode, localSearch, categoryFilter, typeFilter, stockFilter]);

  const displayRows = apiMode ? products : products.slice((localPage - 1) * pageSize, localPage * pageSize);
  const listTotal = apiMode ? apiStore.meta.total : products.length;
  const listPage = apiMode ? apiStore.page : localPage;

  const computedMetrics = useMemo(() => {
    if (apiMode) {
      const totalStock = allProducts.reduce((s, p) => s + computeTotalStock(p), 0);
      const inventoryValue = allProducts.reduce((s, p) => s + computeTotalStock(p) * Number(p.cost ?? 0), 0);
      const lowStock = allProducts.filter((p) => getProductStockStatus(p) === 'Low Stock').length;
      const outOfStock = allProducts.filter((p) => getProductStockStatus(p) === 'Out of Stock').length;
      return {
        totalSkus: apiStore.meta.total,
        totalStock,
        lowStock,
        outOfStock,
        inventoryValue,
      };
    }
    return getProductMetrics(appState, allProducts);
  }, [apiMode, allProducts, appState, apiStore.meta.total]);

  const kpiFiltered = Boolean(
    (apiMode ? apiStore.search : localSearch).trim()
    || categoryFilter !== 'all'
    || typeFilter !== 'all'
    || stockFilter !== 'all',
  );
  const kpiSnapshotRef = useRef(computedMetrics);
  if (!kpiFiltered) kpiSnapshotRef.current = computedMetrics;
  const metrics = kpiFiltered ? kpiSnapshotRef.current : computedMetrics;

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    {
      key: 'details',
      label: 'Product Details',
      render: (row) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <InventoryItemThumb
            imageUrl={String(row.imageUrl ?? '')}
            alt={String(row.name ?? '')}
            fallback={(
              <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 text-slate-500">
                <Package className="w-4 h-4" />
              </span>
            )}
          />
          <div className="min-w-0">
            <div className="font-bold text-slate-800 truncate">{String(row.name)}</div>
            <div className="text-[10px] text-slate-500">{String(row.sku)} · {String(row.uom ?? 'pcs')} · {String(row.productType ?? '')}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => (
        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-[10px]">{String(row.category ?? '—')}</span>
      ),
    },
    {
      key: 'totalStock',
      label: 'Total Stock',
      render: (row) => {
        const ws = (row.warehouseStock as Record<string, number>) ?? {};
        return (
          <div className="space-y-0.5">
            <div className="font-extrabold">{computeTotalStock(row).toLocaleString()}</div>
            {Object.entries(ws).filter(([, v]) => Number(v) > 0).map(([whId, qty]) => (
              <div key={whId} className="text-[10px] text-slate-400">{String(warehouses.find((w) => String(w.id) === whId)?.name ?? whId)}: {qty}</div>
            ))}
          </div>
        );
      },
    },
    { key: 'reserved', label: 'Reserved', render: (row) => <span className="font-semibold">{Number(row.reserved ?? 0)}</span> },
    { key: 'available', label: 'Available', render: (row) => <span className="font-bold text-blue-600">{computeAvailableStock(row)}</span> },
    { key: 'cost', label: 'Cost', render: (row) => formatMoney(Number(row.cost ?? 0)) },
    { key: 'price', label: 'Selling Price', render: (row) => <span className="font-bold">{formatMoney(Number(row.price ?? 0))}</span> },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={getProductStockStatus(row)} /> },
  ], [warehouses]);

  const resetFilters = () => {
    if (apiMode) apiStore.setSearchTerm('');
    else setLocalSearch('');
    setCategoryFilter('all');
    setTypeFilter('all');
    if (apiMode) apiStore.setPage(1);
    else setLocalPage(1);
  };

  const resetForm = useCallback((overrideSku?: string) => {
    const sku = overrideSku ?? (apiMode ? '' : previewProductSku(appState));
    setFormValues(buildEmptyFormValues(categories, units, warehouses, sku));
    setWarehouseStock(emptyWarehouseStock(warehouseIds));
    setEditingId(null);
    setFormKey((k) => k + 1);
  }, [apiMode, appState, categories, units, warehouses, warehouseIds]);

  const openCreate = useCallback(() => {
    resetForm('');
    setView('form');
    if (apiMode) {
      void fetchNextProductSku()
        .then((sku) => {
          setFormValues((prev) => (prev && !prev.sku ? { ...prev, sku } : prev));
        })
        .catch(() => {
          /* SKU loads on Generate click or user input */
        });
    }
  }, [apiMode, resetForm]);

  useChromeSuppressed(view !== 'main');

  useRegisterModuleActions(
    view === 'main' ? (
      <ModuleToolbarActions onAdd={openCreate} addLabel="Add Product SKU" />
    ) : null,
    [view, openCreate],
  );

  const openEdit = (row: Record<string, unknown>) => {
    if (!guardEdit()) return;
    setFormValues(rowToProductFormValues(row, warehouseIds));
    setWarehouseStock(warehouseStockToStrings(row, warehouseIds));
    setEditingId(String(row.id));
    setFormKey((k) => k + 1);
    setView('form');
  };

  const handleSave = async (
    payload: ProductFormPayload,
    action: 'save' | 'save-and-add',
    pendingImageUpload?: Promise<PendingImageUpload | null> | null,
  ): Promise<boolean> => {
    let leftForm = false;
    await guardSubmit(async () => {
      if (editingId && !guardEdit()) return;
      if (apiMode) {
        const body = mapProductPayloadToApi(payload);
        const result = editingId
          ? await apiStore.update(editingId, body)
          : await apiStore.create(body);
        if (!result.ok) {
          const errMsg = 'error' in result ? String(result.error) : 'Save failed';
          if (isDuplicateSkuError(errMsg)) {
            toast.error('SKU already exists', {
              module: 'Products',
              description: 'Generate a new SKU or edit the field, then try again.',
            });
          } else {
            toast.error('Operation failed', { module: 'Products', description: errMsg });
          }
          return;
        }
        if (!editingId && pendingImageUpload && result.ok && 'id' in result) {
          attachBackgroundImageLater({
            recordId: String(result.id),
            savedImageUrl: payload.imageUrl,
            pending: pendingImageUpload,
            patchImage: patchProductImageUrl,
            onAttached: () => apiStore.reload({ silent: true }),
            moduleName: 'Product',
          });
        }
        if (!editingId) resetFilters();
        if (action === 'save-and-add') {
          if (!editingId) resetFilters();
          void fetchNextProductSku().then((nextSku) => resetForm(nextSku));
          return;
        }
        if (!editingId) resetFilters();
        setView('main');
        resetForm();
        leftForm = true;
        return;
      }

      const result = editingId
        ? updateProduct(appState, editingId, payload)
        : createProduct(appState, payload);
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Products', description: 'error' in result ? String(result.error) : 'Save failed' });
        return;
      }
      saveAppState();

      if (action === 'save-and-add') {
        if (!editingId) resetFilters();
        resetForm();
        return;
      }

      if (!editingId) resetFilters();
      setView('main');
      resetForm();
      leftForm = true;
    });
    return leftForm;
  };

  if (view === 'form' && formValues) {
    return (
      <ProductForm
        key={formKey}
        mode={editingId ? 'edit' : 'create'}
        initialValues={formValues}
        warehouseStock={warehouseStock}
        categories={categories}
        units={units}
        warehouses={warehouses}
        onGenerateSku={() => (apiMode ? fetchNextProductSku() : previewProductSku(appState))}
        onCancel={() => {
          setView('main');
          resetForm();
        }}
        onSave={handleSave}
      />
    );
  }

  return (
    <>
      {apiMode ? <ApiModeBanner module="products" error={apiStore.error} /> : null}

      <ModuleKpiSection
        gridClassName="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2"
        kpiCount={5}
        loading={bootLoading}
        items={[
          { key: 'skus', label: 'Total SKUs Listed', value: String(metrics.totalSkus), iconify: KPI_ICON.skus },
          { key: 'stock', label: 'Total Stock Qty', value: `${metrics.totalStock.toLocaleString()} units`, iconify: KPI_ICON.stock },
          { key: 'low', label: 'Low Stock Alerts', value: String(metrics.lowStock), alert: metrics.lowStock > 0, iconify: KPI_ICON.low },
          { key: 'oos', label: 'Out of Stock', value: String(metrics.outOfStock), alert: metrics.outOfStock > 0, iconify: KPI_ICON.oos },
          { key: 'value', label: 'Inventory Value', value: formatMoney(metrics.inventoryValue), iconify: KPI_ICON.value },
        ]}
      />

      <ModuleFilterBar
        search={apiMode ? apiStore.search : localSearch}
        onSearchChange={(v) => {
          if (apiMode) apiStore.setSearchTerm(v);
          else setLocalSearch(v);
          if (apiMode) apiStore.setPage(1);
          else setLocalPage(1);
        }}
        searchPlaceholder="Search product name or SKU..."
        filters={
          <>
            <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); if (apiMode) apiStore.setPage(1); else setLocalPage(1); }} className={MODULE_FILTER_INPUT}>
              <option value="all">All Categories</option>
              {categories.map((c) => <option key={String(c.id)} value={String(c.name)}>{String(c.name)}</option>)}
            </select>
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); if (apiMode) apiStore.setPage(1); else setLocalPage(1); }} className={MODULE_FILTER_INPUT}>
              <option value="all">All Types</option>
              {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={stockFilter} onChange={(e) => { setStockFilter(e.target.value); if (apiMode) apiStore.setPage(1); else setLocalPage(1); }} className={MODULE_FILTER_INPUT}>
              <option value="all">All Stock</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </>
        }
      />

      <AppTable
        columns={columns}
        rows={displayRows}
        loading={bootLoading}
        emptyMessage={apiListEmptyMessage(apiStore.loading, apiStore.initialized, 'products', { totalCount: allProducts.length, filteredCount: products.length })}
        renderActions={(row) => (
          <InventoryEditActions canEdit={canEdit}>
            <TableIconAction variant="edit" onClick={() => openEdit(row)} />
            <TableIconAction
              variant={row.discontinued ? 'restore' : 'discontinue'}
              onClick={async () => {
                if (!guardEdit()) return;
                if (apiMode) {
                  await apiStore.update(String(row.id), {
                    ...mapProductPayloadToApi({
                      name: String(row.name),
                      sku: String(row.sku ?? ''),
                      category: String(row.category ?? ''),
                      uom: String(row.uom ?? 'pcs'),
                      barcode: String(row.barcode ?? ''),
                      productType: String(row.productType ?? 'Finished Goods'),
                      imageUrl: String(row.imageUrl ?? ''),
                      imagePublicId: String(row.imagePublicId ?? ''),
                      cost: Number(row.cost ?? 0),
                      price: Number(row.price ?? 0),
                      taxRate: Number(row.taxRate ?? 0),
                      minStock: Number(row.minStock ?? 0),
                      stockDurationDays: Number(row.stockDurationDays ?? 0),
                      reserved: Number(row.reserved ?? 0),
                      wholesalePrice: Number(row.wholesalePrice ?? 0),
                      reorderLevel: Number(row.reorderLevel ?? 0),
                      defaultWarehouse: String(row.defaultWarehouse ?? ''),
                      description: String(row.description ?? ''),
                      discontinued: !row.discontinued,
                      warehouseStock: (row.warehouseStock as Record<string, number>) ?? {},
                    }),
                  });
                  return;
                }
                toggleDiscontinued(appState, String(row.id));
                saveAppState();
              }}
            />
            <TableIconAction
              variant="delete"
              onClick={() => {
                if (!guardEdit()) return;
                confirmAction({ title: 'Delete', message: 'Delete?', confirmLabel: 'Delete', tone: 'danger', module: 'Products' }).then(async (__ok) => {
                  if (!__ok) return;
                  if (apiMode) {
                    const result = await apiStore.remove(String(row.id));
                    if (!result.ok) toast.error('Delete failed', { module: 'Products', description: result.error });
                    return;
                  }
                  deleteProduct(appState, String(row.id));
                  saveAppState();
                });
              }}
            />
          </InventoryEditActions>
        )}
      />

      <ListPagination
        page={listPage}
        pageSize={pageSize}
        total={listTotal}
        onPageChange={(p) => (apiMode ? apiStore.setPage(p) : setLocalPage(p))}
      />
      <Footer />
    </>
  );
}
