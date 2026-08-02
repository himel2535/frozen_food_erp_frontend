'use client';

import { toast, confirmAction } from '@/lib/ui/feedback';

import { useMemo, useState } from 'react';
import { Footer } from '@/components/layout/Footer';
import { KpiCards } from '@/components/shared/KpiCards';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { useAppStore } from '@/lib/state/app-store';
import { ProductForm } from '@/components/modules/inventory/product-form/ProductForm';
import type { ProductFormPayload, ProductFormValues } from '@/components/modules/inventory/product-form/product-form-types';
import {
  rowToProductFormValues,
  warehouseStockToStrings,
} from '@/components/modules/inventory/product-form/product-form-types';
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
    cost: '',
    price: '',
    taxLabel: 'No Tax',
    openingStock: '0',
    minStock: '10',
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

export function ProductsPage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [view, setView] = useState<'main' | 'form'>('main');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<ProductFormValues | null>(null);
  const [warehouseStock, setWarehouseStock] = useState<Record<string, string>>({});
  const [formKey, setFormKey] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const categories = useMemo(() => listCategories(appState), [appState]);
  const units = useMemo(() => listUnits(appState), [appState]);
  const warehouses = useMemo(() => listWarehouses(appState), [appState]);
  const warehouseIds = useMemo(() => warehouses.map((wh) => String(wh.id)), [warehouses]);

  const allProducts = useMemo(() => listInventory(appState, { excludeRaw: true }), [appState]);

  const products = useMemo(() => {
    let data = allProducts;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(q));
    }
    if (categoryFilter !== 'all') data = data.filter((p) => String(p.category) === categoryFilter);
    if (typeFilter !== 'all') data = data.filter((p) => String(p.productType) === typeFilter);
    return data;
  }, [allProducts, search, categoryFilter, typeFilter]);

  const metrics = useMemo(() => getProductMetrics(appState, allProducts), [appState, allProducts]);
  const paged = products.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(products.length / pageSize));

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    {
      key: 'details',
      label: 'Product Details',
      render: (row) => (
        <>
          <div className="font-bold text-slate-800">{String(row.name)}</div>
          <div className="text-[10px] text-slate-500">{String(row.sku)} · {String(row.uom ?? 'pcs')} · {String(row.productType ?? '')}</div>
        </>
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

  const resetForm = () => {
    const sku = previewProductSku(appState);
    setFormValues(buildEmptyFormValues(categories, units, warehouses, sku));
    setWarehouseStock(emptyWarehouseStock(warehouseIds));
    setEditingId(null);
    setFormKey((k) => k + 1);
  };

  const openCreate = () => {
    resetForm();
    setView('form');
  };

  const openEdit = (row: Record<string, unknown>) => {
    setFormValues(rowToProductFormValues(row, warehouseIds));
    setWarehouseStock(warehouseStockToStrings(row, warehouseIds));
    setEditingId(String(row.id));
    setFormKey((k) => k + 1);
    setView('form');
  };

  const handleSave = (payload: ProductFormPayload, action: 'save' | 'save-and-add') => {
    const result = editingId
      ? updateProduct(appState, editingId, payload)
      : createProduct(appState, payload);
    if (!result.ok) {
      toast.error('Operation failed', { module: 'Products', description: 'error' in result ? String(result.error) : 'Save failed' });
      return;
    }
    saveAppState();

    if (action === 'save-and-add') {
      resetForm();
      return;
    }

    setView('main');
    resetForm();
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
        onGenerateSku={() => previewProductSku(appState)}
        onCancel={() => {
          setView('main');
          resetForm();
        }}
        onSave={handleSave}
      />
    );
  }

  return (
    <div className={MODULE_LIST_SHELL}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Products Master</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage catalog items, stock allocation, pricing, and reorder readiness.</p>
        </div>
        <button type="button" onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer">+ Add Product SKU</button>
      </div>

      <KpiCards
        gridClassName="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2"
        items={[
          { key: 'skus', label: 'Total SKUs Listed', value: String(metrics.totalSkus) },
          { key: 'stock', label: 'Total Stock Qty', value: `${metrics.totalStock.toLocaleString()} units` },
          { key: 'low', label: 'Low Stock Alerts', value: String(metrics.lowStock), alert: metrics.lowStock > 0 },
          { key: 'oos', label: 'Out of Stock', value: String(metrics.outOfStock), alert: metrics.outOfStock > 0 },
          { key: 'value', label: 'Inventory Value', value: formatMoney(metrics.inventoryValue) },
        ]}
      />

      <div className="flex flex-wrap gap-3 items-end">
        <div className="text-xs font-semibold text-slate-700">
          <label className="block mb-1 text-slate-500">Category</label>
          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 cursor-pointer min-w-[140px]">
            <option value="all">All Categories</option>
            {categories.map((c) => <option key={String(c.id)} value={String(c.name)}>{String(c.name)}</option>)}
          </select>
        </div>
        <div className="text-xs font-semibold text-slate-700">
          <label className="block mb-1 text-slate-500">Product Type</label>
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 cursor-pointer min-w-[140px]">
            <option value="all">All Types</option>
            {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <input type="search" placeholder="Search product name or SKU..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs" />
        </div>
      </div>

      <AppTable
        columns={columns}
        rows={paged}
        emptyMessage="No products found."
        renderActions={(row) => (
          <>
            <TableIconAction variant="edit" onClick={() => openEdit(row)} />
            <TableIconAction
              variant={row.discontinued ? 'restore' : 'discontinue'}
              onClick={() => {
                toggleDiscontinued(appState, String(row.id));
                saveAppState();
              }}
            />
            <TableIconAction
              variant="delete"
              onClick={() => {
                confirmAction({ title: 'Delete', message: 'Delete?', confirmLabel: 'Delete', tone: 'danger', module: 'Products' }).then((__ok) => {
                  if (!__ok) return;
                  deleteProduct(appState, String(row.id));
                  saveAppState();
                });
              }}
            />
          </>
        )}
      />

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, products.length)} of {products.length} products</span>
        <div className="flex gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg cursor-pointer disabled:opacity-50">Previous</button>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg cursor-pointer disabled:opacity-50">Next</button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
