'use client';

import { useMemo, useState } from 'react';
import { Footer } from '@/components/layout/Footer';
import { FormHeader } from '@/components/layout/FormHeader';
import { KpiCards } from '@/components/shared/KpiCards';
import { MODULE_FORM_SHELL, MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { AdvancedDetailsToggle } from '@/components/shared/AdvancedDetailsToggle';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { useAppStore } from '@/lib/state/app-store';
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
  buildDefaultWarehouseAllocations,
  formatMoney,
  PRODUCT_TYPES,
} from '@/lib/services/inventory-service';

export function ProductsPage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [view, setView] = useState<'main' | 'form'>('main');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const categories = useMemo(() => listCategories(appState), [appState]);
  const units = useMemo(() => listUnits(appState), [appState]);
  const warehouses = useMemo(() => listWarehouses(appState), [appState]);

  const [form, setForm] = useState({
    name: '', sku: '', category: '', productType: 'Finished Goods', cost: '', price: '',
    uom: '', reserved: '0', wholesalePrice: '', taxRate: '', minStock: '', reorderLevel: '',
    defaultWarehouse: '', description: '', discontinued: false,
  });
  const [warehouseStock, setWarehouseStock] = useState<Record<string, string>>({});

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
    const alloc = buildDefaultWarehouseAllocations(appState);
    const allocStr: Record<string, string> = {};
    Object.keys(alloc).forEach((k) => { allocStr[k] = '0'; });
    setForm({
      name: '', sku: '', category: categories[0]?.name ? String(categories[0].name) : '',
      productType: 'Finished Goods', cost: '', price: '', uom: units[0]?.code ? String(units[0].code) : '',
      reserved: '0', wholesalePrice: '', taxRate: '', minStock: '', reorderLevel: '',
      defaultWarehouse: warehouses[0]?.id ? String(warehouses[0].id) : '', description: '', discontinued: false,
    });
    setWarehouseStock(allocStr);
    setEditingId(null);
    setShowAdvanced(false);
  };

  const openEdit = (row: Record<string, unknown>) => {
    const ws = (row.warehouseStock as Record<string, number>) ?? {};
    const allocStr: Record<string, string> = {};
    warehouses.forEach((wh) => { allocStr[String(wh.id)] = String(ws[String(wh.id)] ?? 0); });
    setForm({
      name: String(row.name ?? ''), sku: String(row.sku ?? ''), category: String(row.category ?? ''),
      productType: String(row.productType ?? 'Finished Goods'), cost: String(row.cost ?? ''),
      price: String(row.price ?? ''), uom: String(row.uom ?? ''), reserved: String(row.reserved ?? 0),
      wholesalePrice: String(row.wholesalePrice ?? ''), taxRate: String(row.taxRate ?? ''),
      minStock: String(row.minStock ?? ''), reorderLevel: String(row.reorderLevel ?? ''),
      defaultWarehouse: String(row.defaultWarehouse ?? ''), description: String(row.description ?? ''),
      discontinued: Boolean(row.discontinued),
    });
    setWarehouseStock(allocStr);
    setEditingId(String(row.id));
    setView('form');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const alloc: Record<string, number> = {};
    Object.entries(warehouseStock).forEach(([k, v]) => { alloc[k] = Number(v || 0); });
    const payload = {
      ...form,
      cost: Number(form.cost || 0), price: Number(form.price || 0),
      reserved: Number(form.reserved || 0), wholesalePrice: Number(form.wholesalePrice || 0),
      taxRate: Number(form.taxRate || 0), minStock: Number(form.minStock || 0),
      reorderLevel: Number(form.reorderLevel || 0), warehouseStock: alloc,
    };
    const result = editingId ? updateProduct(appState, editingId, payload) : createProduct(appState, payload);
    if (!result.ok) { window.alert('error' in result ? result.error : 'Save failed'); return; }
    saveAppState();
    setView('main');
    resetForm();
  };

  if (view === 'form') {
    return (
      <div className={MODULE_FORM_SHELL}>
        <div className="max-w-4xl mx-auto w-full space-y-6">
          <FormHeader title={editingId ? 'Edit Product' : 'Create Product'} subtitle="Add a new item to your catalog." onBack={() => { setView('main'); resetForm(); }} />
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
              <div className="md:col-span-2">
                <label className="block mb-2">Product Name <span className="text-rose-500">*</span></label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
              <div>
                <label className="block mb-2">SKU Code <span className="text-rose-500">*</span></label>
                <input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
              <div>
                <label className="block mb-2">Category <span className="text-rose-500">*</span></label>
                <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  {categories.map((c) => <option key={String(c.id)} value={String(c.name)}>{String(c.name)}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-2">Product Type <span className="text-rose-500">*</span></label>
                <select value={form.productType} onChange={(e) => setForm({ ...form, productType: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-2">Cost Price ($) <span className="text-rose-500">*</span></label>
                <input required type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
              <div>
                <label className="block mb-2">Selling Price ($) <span className="text-rose-500">*</span></label>
                <input required type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
              <div>
                <label className="block mb-2">UoM (Unit of Measure)</label>
                <select value={form.uom} onChange={(e) => setForm({ ...form, uom: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  <option value="">Select Unit</option>
                  {units.map((u) => <option key={String(u.id)} value={String(u.code)}>{String(u.name)} ({String(u.symbol)})</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-2">Opening Reserved Stock</label>
                <input type="number" value={form.reserved} onChange={(e) => setForm({ ...form, reserved: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 mb-3">Warehouse Stock Allocation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                {warehouses.map((wh) => (
                  <div key={String(wh.id)}>
                    <label className="block mb-2">{String(wh.name)} Stock</label>
                    <input type="number" value={warehouseStock[String(wh.id)] ?? '0'} onChange={(e) => setWarehouseStock({ ...warehouseStock, [String(wh.id)]: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" />
                  </div>
                ))}
              </div>
            </div>
            <AdvancedDetailsToggle open={showAdvanced} onToggle={() => setShowAdvanced(!showAdvanced)} />
            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-700">
                <div><label className="block mb-2">Wholesale Price</label><input type="number" value={form.wholesalePrice} onChange={(e) => setForm({ ...form, wholesalePrice: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" /></div>
                <div><label className="block mb-2">Tax Rate %</label><input type="number" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" /></div>
                <div><label className="block mb-2">Min Stock</label><input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" /></div>
                <div><label className="block mb-2">Reorder Level</label><input type="number" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" /></div>
                <div><label className="block mb-2">Default Warehouse</label>
                  <select value={form.defaultWarehouse} onChange={(e) => setForm({ ...form, defaultWarehouse: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    {warehouses.map((wh) => <option key={String(wh.id)} value={String(wh.id)}>{String(wh.name)}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="discontinued" checked={form.discontinued} onChange={(e) => setForm({ ...form, discontinued: e.target.checked })} className="cursor-pointer" />
                  <label htmlFor="discontinued" className="cursor-pointer">Discontinued</label>
                </div>
                <div className="md:col-span-2"><label className="block mb-2">Description</label><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" /></div>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => { setView('main'); resetForm(); }} className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer">Cancel</button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer">Save Product</button>
            </div>
          </form>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={MODULE_LIST_SHELL}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Products Master</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage catalog items, stock allocation, pricing, and reorder readiness.</p>
        </div>
        <button type="button" onClick={() => { resetForm(); setView('form'); }} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer">+ Add Product SKU</button>
      </div>

      <KpiCards items={[
        { key: 'skus', label: 'Total SKUs Listed', value: String(metrics.totalSkus) },
        { key: 'stock', label: 'Total Stock Qty', value: `${metrics.totalStock.toLocaleString()} units` },
        { key: 'low', label: 'Low Stock Alerts', value: String(metrics.lowStock), alert: metrics.lowStock > 0 },
        { key: 'oos', label: 'Out of Stock', value: String(metrics.outOfStock), alert: metrics.outOfStock > 0 },
        { key: 'value', label: 'Inventory Value', value: formatMoney(metrics.inventoryValue) },
      ]} />

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
                if (window.confirm('Delete?')) {
                  deleteProduct(appState, String(row.id));
                  saveAppState();
                }
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
