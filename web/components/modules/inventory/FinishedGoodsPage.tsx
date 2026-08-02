'use client';

import { toast } from '@/lib/ui/feedback';

import { useMemo, useState } from 'react';
import { ChevronDown, Download, Info, MoreVertical, Package, Settings2 } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { AppFormFields, AppFormModal, FORM_GRID_CLS, FORM_LABEL_CLS } from '@/components/shared/AppForm';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { FilterTabs } from '@/components/shared/FilterTabs';
import { KpiCards } from '@/components/shared/KpiCards';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { FilterBar, FilterSelect, SearchInput } from '@/components/modules/inventory/shared/inventory-ui';
import { WarehouseSelect } from '@/components/modules/inventory/shared/selects';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { useAppStore } from '@/lib/state/app-store';
import type { PortField } from '@/lib/modules/port-types';
import {
  createFinishedGood,
  formatMoney,
  getFinishedGoodsAvailable,
  getFinishedGoodsMetrics,
  getFinishedGoodsStockStatus,
  getFinishedGoodsStockValue,
  listFinishedGoods,
  listFinishedGoodsCategories,
  listFinishedGoodsUnits,
  listWarehouses,
  previewFinishedGoodCode,
  updateFinishedGood,
} from '@/lib/services/inventory-service';

const PAGE_SIZE_OPTIONS = [10, 15, 25];

const FG_BASIC_FIELDS: PortField[] = [
  { key: 'name', label: 'Product Name', required: true },
  { key: 'sku', label: 'SKU' },
  { key: 'category', label: 'Category' },
  { key: 'unit', label: 'Unit', required: true },
  { key: 'quantity', label: 'Stock Qty', type: 'number', required: true },
  { key: 'reserved', label: 'Reserved Qty', type: 'number' },
  { key: 'avgCost', label: 'Average Cost (BDT)', type: 'number', required: true },
  { key: 'minStock', label: 'Min. Stock Level', type: 'number' },
];

const FG_ADVANCED_FIELDS: PortField[] = [
  { key: 'barcode', label: 'Barcode', advanced: true },
  { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
];

const CATEGORY_COLORS: Record<string, string> = {
  'Toy Car': 'bg-blue-100 text-blue-700',
  'Building Blocks': 'bg-sky-100 text-sky-700',
  'Toy Train': 'bg-indigo-100 text-indigo-700',
  'Action Figures': 'bg-violet-100 text-violet-700',
  Dolls: 'bg-pink-100 text-pink-700',
  'RC Toys': 'bg-amber-100 text-amber-700',
  Puzzles: 'bg-teal-100 text-teal-700',
  'Plush Toys': 'bg-rose-100 text-rose-700',
  'Outdoor Toys': 'bg-lime-100 text-lime-700',
  'Board Games': 'bg-emerald-100 text-emerald-700',
  'Role Play': 'bg-orange-100 text-orange-700',
  'Musical Toys': 'bg-fuchsia-100 text-fuchsia-700',
  'Craft Toys': 'bg-cyan-100 text-cyan-700',
  'Baby Toys': 'bg-yellow-100 text-yellow-700',
  'Sports Toys': 'bg-green-100 text-green-700',
  'Bath Toys': 'bg-slate-100 text-slate-600',
};

function ProductThumb({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category] ?? 'bg-slate-100 text-slate-600';
  return (
    <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
      <Package className="w-4 h-4" />
    </span>
  );
}

export function FinishedGoodsPage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [view, setView] = useState<'main' | 'form'>('main');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');
  const [unitFilter, setUnitFilter] = useState('all');
  const [stockTab, setStockTab] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: '',
    unit: 'pcs',
    quantity: '',
    reserved: '0',
    avgCost: '',
    minStock: '0',
    warehouseId: '',
    barcode: '',
    notes: '',
  });

  const warehouses = useMemo(() => listWarehouses(appState), [appState]);
  const categories = useMemo(() => listFinishedGoodsCategories(appState), [appState]);
  const units = useMemo(() => listFinishedGoodsUnits(appState), [appState]);
  const allProducts = useMemo(() => listFinishedGoods(appState), [appState]);
  const metrics = useMemo(() => getFinishedGoodsMetrics(appState), [appState]);

  const filtered = useMemo(() => {
    let data = allProducts;
    const q = search.toLowerCase().trim();

    if (stockTab === 'in') {
      data = data.filter((row) => getFinishedGoodsStockStatus(row) === 'In Stock');
    } else if (stockTab === 'low') {
      data = data.filter((row) => getFinishedGoodsStockStatus(row) === 'Low Stock');
    } else if (stockTab === 'out') {
      data = data.filter((row) => getFinishedGoodsStockStatus(row) === 'Out of Stock');
    }

    if (categoryFilter !== 'all') {
      data = data.filter((row) => String(row.category ?? '') === categoryFilter);
    }
    if (warehouseFilter !== 'all') {
      data = data.filter((row) => String(row.warehouseId ?? 'WH-001') === warehouseFilter);
    }
    if (unitFilter !== 'all') {
      data = data.filter((row) => String(row.unit ?? '') === unitFilter);
    }
    if (stockStatusFilter !== 'all') {
      data = data.filter(
        (row) => getFinishedGoodsStockStatus(row).toLowerCase().replace(/\s+/g, '-') === stockStatusFilter,
      );
    }
    if (q) {
      data = data.filter((row) =>
        `${row.name} ${row.id} ${row.sku} ${row.barcode} ${row.category}`.toLowerCase().includes(q),
      );
    }

    return [...data].sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [allProducts, search, categoryFilter, warehouseFilter, stockStatusFilter, unitFilter, stockTab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const liveStockValue = Number(form.quantity || 0) * Number(form.avgCost || 0);

  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setWarehouseFilter('all');
    setStockStatusFilter('all');
    setUnitFilter('all');
    setStockTab('all');
    setPage(1);
  };

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    {
      key: 'name',
      label: 'Product',
      render: (row) => {
        const category = String(row.category ?? 'Uncategorized');
        return (
          <div className="flex items-center gap-2.5 min-w-0 max-w-[220px]">
            <ProductThumb category={category} />
            <div className="min-w-0">
              <div className="font-bold text-slate-800 truncate">{String(row.name)}</div>
              <div className="text-[10px] font-semibold text-slate-400">{String(row.id ?? '—')}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'sku',
      label: 'SKU',
      render: (row) => (
        <span className="font-mono text-[11px] font-semibold text-slate-600">{String(row.sku || '—')}</span>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => (
        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-[10px]">
          {String(row.category || 'Uncategorized')}
        </span>
      ),
    },
    {
      key: 'unit',
      label: 'Unit',
      render: (row) => <span className="font-semibold text-slate-700">{String(row.unit ?? 'pcs')}</span>,
    },
    {
      key: 'quantity',
      label: 'Stock',
      render: (row) => (
        <span className="font-extrabold text-blue-700">{Number(row.quantity ?? 0).toLocaleString()}</span>
      ),
    },
    {
      key: 'reserved',
      label: 'Reserved',
      render: (row) => (
        <span className="font-extrabold text-amber-600">{Number(row.reserved ?? 0).toLocaleString()}</span>
      ),
    },
    {
      key: 'available',
      label: 'Available',
      render: (row) => (
        <span className="font-extrabold text-emerald-600">{getFinishedGoodsAvailable(row).toLocaleString()}</span>
      ),
    },
    {
      key: 'avgCost',
      label: 'Avg. Cost',
      render: (row) => <span className="font-semibold">{formatMoney(Number(row.avgCost ?? 0))}</span>,
    },
    {
      key: 'stockValue',
      label: 'Stock Value',
      render: (row) => (
        <span className="font-extrabold text-blue-700">{formatMoney(getFinishedGoodsStockValue(row))}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={getFinishedGoodsStockStatus(row)} />,
    },
  ], []);

  const resetForm = () => {
    setForm({
      name: '',
      sku: '',
      category: '',
      unit: 'pcs',
      quantity: '',
      reserved: '0',
      avgCost: '',
      minStock: '0',
      warehouseId: warehouses[0]?.id ? String(warehouses[0].id) : '',
      barcode: '',
      notes: '',
    });
    setEditingId(null);
    setShowAdvanced(false);
  };

  const openCreate = () => {
    resetForm();
    setView('form');
  };

  const openEdit = (row: Record<string, unknown>) => {
    setForm({
      name: String(row.name ?? ''),
      sku: String(row.sku ?? ''),
      category: String(row.category ?? ''),
      unit: String(row.unit ?? 'pcs'),
      quantity: String(row.quantity ?? ''),
      reserved: String(row.reserved ?? 0),
      avgCost: String(row.avgCost ?? ''),
      minStock: String(row.minStock ?? 0),
      warehouseId: String(row.warehouseId ?? warehouses[0]?.id ?? ''),
      barcode: String(row.barcode ?? ''),
      notes: String(row.notes ?? ''),
    });
    setEditingId(String(row.id));
    setView('form');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      quantity: Number(form.quantity || 0),
      reserved: Number(form.reserved || 0),
      avgCost: Number(form.avgCost || 0),
      minStock: Number(form.minStock || 0),
      status: 'active',
    };
    const result = editingId
      ? updateFinishedGood(appState, editingId, payload)
      : createFinishedGood(appState, { ...payload, id: previewFinishedGoodCode(appState) });
    if (!result.ok) {
      toast.error('Operation failed', { module: 'Inventory', description: 'error' in result ? String(result.error) : 'Save failed' });
      return;
    }
    saveAppState();
    setView('main');
    resetForm();
  };

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i += 1) pages.push(i);
    return pages;
  }, [page, totalPages]);

  const productFields = [...FG_BASIC_FIELDS, ...FG_ADVANCED_FIELDS];

  return (
    <>
      <div className={MODULE_LIST_SHELL}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Finished Goods Inventory</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage completed and ready-to-deliver product inventory.</p>
          </div>
          <div className="relative self-start">
            <div className="flex">
              <button
                type="button"
                onClick={openCreate}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-l-xl cursor-pointer"
              >
                + Add Finished Product
              </button>
              <button
                type="button"
                onClick={() => setShowAddMenu((v) => !v)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-2.5 rounded-r-xl border-l border-blue-500 cursor-pointer"
                aria-label="More add options"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            {showAddMenu ? (
              <div className="absolute right-0 top-full mt-1 z-20 min-w-[160px] rounded-xl border border-slate-200 bg-white shadow-lg py-1">
                <button
                  type="button"
                  onClick={() => { setShowAddMenu(false); toast.info('Feature coming soon', { module: 'Inventory', description: "Import products" }); }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Import Products
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddMenu(false); toast.info('Feature coming soon', { module: 'Inventory', description: "Bulk add" }); }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Bulk Add
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <KpiCards
          gridClassName="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2"
          items={[
            { key: 'count', label: 'Total Products', value: String(metrics.count), sub: 'All finished goods' },
            { key: 'stock', label: 'Total Stock Qty', value: metrics.totalQuantity.toLocaleString(), sub: 'Across all warehouses' },
            { key: 'low', label: 'Low Stock', value: String(metrics.lowStock), alert: metrics.lowStock > 0, sub: metrics.lowStock > 0 ? 'Requires attention' : 'Stock levels healthy' },
            { key: 'oos', label: 'Out of Stock', value: String(metrics.outOfStock), alert: metrics.outOfStock > 0, sub: metrics.outOfStock > 0 ? 'Need to reorder' : 'No shortages' },
            { key: 'value', label: 'Total Stock Value', value: formatMoney(metrics.totalValue), sub: 'At average cost' },
          ]}
        />

        <FilterBar>
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search by product name, SKU, barcode..."
          />
          <FilterSelect label="Category" value={categoryFilter} onChange={(v) => { setCategoryFilter(v); setPage(1); }}>
            <option value="all">All Categories</option>
            {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </FilterSelect>
          <FilterSelect label="Warehouse" value={warehouseFilter} onChange={(v) => { setWarehouseFilter(v); setPage(1); }}>
            <option value="all">All Warehouses</option>
            {warehouses.map((wh) => <option key={String(wh.id)} value={String(wh.id)}>{String(wh.name)}</option>)}
          </FilterSelect>
          <FilterSelect label="Stock Status" value={stockStatusFilter} onChange={(v) => { setStockStatusFilter(v); setPage(1); }}>
            <option value="all">All Status</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </FilterSelect>
          <FilterSelect label="Unit" value={unitFilter} onChange={(v) => { setUnitFilter(v); setPage(1); }}>
            <option value="all">All Units</option>
            {units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
          </FilterSelect>
          <button type="button" onClick={resetFilters} className="text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer px-2 py-2">
            Reset
          </button>
        </FilterBar>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <FilterTabs
            tabs={[
              { id: 'all', label: `All Products (${allProducts.length})` },
              { id: 'in', label: `In Stock (${metrics.inStock})` },
              { id: 'low', label: `Low Stock (${metrics.lowStock})` },
              { id: 'out', label: `Out of Stock (${metrics.outOfStock})` },
            ]}
            active={stockTab}
            onChange={(id) => { setStockTab(id); setPage(1); }}
          />
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => toast.info('Feature coming soon', { module: 'Inventory', description: "Export" })}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 rounded-xl cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button
              type="button"
              title="Table settings"
              onClick={() => toast.info('Feature coming soon', { module: 'Inventory', description: "Column settings" })}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 cursor-pointer"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <AppTable
          className="flex-1"
          columns={columns}
          rows={paged}
          emptyMessage="No finished goods found."
          renderActions={(row) => (
            <>
              <TableIconAction
                variant="view"
                onClick={() => toast.info('Feature coming soon', { module: 'Inventory', description: "View ${String(row.name)} — coming soon." })}
              />
              <button
                type="button"
                title="Download"
                onClick={() => toast.info('Feature coming soon', { module: 'Inventory', description: "Download spec" })}
                className="app-table-icon-btn cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
              <TableIconAction variant="edit" onClick={() => openEdit(row)} />
              <button
                type="button"
                title="More actions"
                onClick={() => toast.info('Feature coming soon', { module: 'Inventory', description: "More actions for ${String(row.name)} — coming soon." })}
                className="app-table-icon-btn cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </>
          )}
        />

        <div className="rounded-xl border border-blue-200/80 bg-blue-50/80 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-2 text-xs text-blue-800">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              <span className="font-bold">Available Qty = Stock Qty − Reserved Qty.</span>{' '}
              Reserved qty are allocated for customer orders but not delivered yet.
            </p>
          </div>
          <button
            type="button"
            onClick={() => toast.info('Feature coming soon', { module: 'Inventory', description: "Stock summary" })}
            className="shrink-0 text-xs font-bold text-blue-700 border border-blue-200 bg-white hover:bg-blue-50 px-3 py-2 rounded-xl cursor-pointer"
          >
            View Stock Summary
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
          <span>
            Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} entries
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg cursor-pointer disabled:opacity-50"
            >
              Previous
            </button>
            {pageNumbers.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={`min-w-[32px] px-2 py-1.5 rounded-lg font-bold cursor-pointer ${
                  n === page ? 'bg-blue-600 text-white' : 'border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg cursor-pointer disabled:opacity-50"
            >
              Next
            </button>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 cursor-pointer"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size} / page</option>
              ))}
            </select>
          </div>
        </div>
        <Footer />
      </div>

      <AppFormModal
        open={view === 'form'}
        onClose={() => { setView('main'); resetForm(); }}
        title={editingId ? 'Edit Finished Product' : 'Add Finished Product'}
        subtitle="Track finished goods stock, reserved qty, and warehouse location."
        onSubmit={handleSubmit}
        submitLabel="Save Product"
        size="lg"
      >
        <AppFormFields
          fields={productFields}
          values={form}
          onChange={(key, value) => setForm({ ...form, [key]: value })}
          showAdvanced={showAdvanced}
          onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
        />
        <div className={FORM_GRID_CLS}>
          <div>
            <label className={FORM_LABEL_CLS}>Warehouse</label>
            <WarehouseSelect state={appState} value={form.warehouseId} onChange={(v) => setForm({ ...form, warehouseId: v })} />
          </div>
          <div className="md:col-span-2 bg-blue-50/80 border border-blue-200/80 rounded-xl p-4">
            <span className="text-[11px] font-bold uppercase tracking-wide text-blue-700">Live Stock Value</span>
            <p className="text-lg font-bold text-blue-700 mt-1">{formatMoney(liveStockValue)}</p>
          </div>
        </div>
      </AppFormModal>
    </>
  );
}
