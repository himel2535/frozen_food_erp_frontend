'use client';

import { toast, confirmAction } from '@/lib/ui/feedback';

import { useMemo, useState } from 'react';
import { Download, Package, Settings2 } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { useChromeSuppressed, useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { AppFormFields, AppFormModal, FORM_GRID_CLS, FORM_LABEL_CLS } from '@/components/shared/AppForm';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { FilterTabs } from '@/components/shared/FilterTabs';
import { ImageUploadField } from '@/components/shared/ImageUploadField';
import { InventoryItemThumb } from '@/components/shared/InventoryItemThumb';
import { ModuleKpiSection } from '@/components/shared/ModuleKpiSection';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { FilterBar, FilterResetButton, FilterSelect, InventoryEditActions } from '@/components/modules/inventory/shared/inventory-ui';
import { useInventoryEditAccess } from '@/hooks/use-inventory-edit-access';
import { SupplierSelect, WarehouseSelect } from '@/components/modules/inventory/shared/selects';
import { useAppStore } from '@/lib/state/app-store';
import type { PortField } from '@/lib/modules/port-types';
import { INVENTORY_STANDARD_KPI_ICONS as KPI_ICON } from '@/lib/ui/kpi-icons';
import { isModuleApiMode } from '@/lib/config/data-source';
import { usePaginatedApiResource } from '@/hooks/use-paginated-api-resource';
import { ListPagination } from '@/components/shared/ListPagination';
import { useInventoryLookups, resolveWarehouseName } from '@/hooks/use-inventory-lookups';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { isModuleBootLoading, pickApiListRows } from '@/lib/ui/kpi-loading';
import { apiListEmptyMessage } from '@/lib/services/api-list-ui';
import {
  mapApiRawMaterialRow,
  mapRawMaterialPayloadToApi,
} from '@/lib/services/inventory-api-mappers';
import {
  createRawMaterial,
  deleteRawMaterial,
  formatMoney,
  getRawMaterialLocationLabel,
  getRawMaterialMetrics,
  getRawMaterialStockStatus,
  getRawMaterialTotalValue,
  listRawMaterialCategories,
  listRawMaterials,
  listWarehouses,
  rawMaterialStockStatusClass,
  sortInventoryRowsNewestFirst,
  updateRawMaterial,
} from '@/lib/services/inventory-service';

const PAGE_SIZE_OPTIONS = [10, 15, 25];

const RAW_MATERIAL_BASIC_FIELDS: PortField[] = [
  { key: 'name', label: 'Material Name', required: true },
  { key: 'category', label: 'Category' },
  { key: 'unit', label: 'Unit', required: true },
  { key: 'quantity', label: 'Quantity', type: 'number', required: true },
  { key: 'price', label: 'Unit Price (BDT)', type: 'number', required: true },
  { key: 'threshold', label: 'Min. Stock Level', type: 'number' },
];

const RAW_MATERIAL_ADVANCED_FIELDS: PortField[] = [
  { key: 'location', label: 'Bin Location', advanced: true },
  { key: 'supplierPrice', label: 'Supplier Price', type: 'number', advanced: true },
  { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
];

const CATEGORY_COLORS: Record<string, string> = {
  Packaging: 'bg-amber-100 text-amber-700',
  Electronics: 'bg-violet-100 text-violet-700',
  Equipment: 'bg-slate-200 text-slate-700',
  Textile: 'bg-sky-100 text-sky-700',
  Plastic: 'bg-blue-100 text-blue-700',
  Metal: 'bg-zinc-200 text-zinc-700',
  Chemicals: 'bg-rose-100 text-rose-700',
  Hardware: 'bg-orange-100 text-orange-700',
  Rubber: 'bg-emerald-100 text-emerald-700',
};

function MaterialThumb({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category] ?? 'bg-slate-100 text-slate-600';
  return (
    <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
      <Package className="w-4 h-4" />
    </span>
  );
}

export function RawMaterialsPage() {
  const { canEdit, guardEdit } = useInventoryEditAccess();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const apiMode = isModuleApiMode('rawMaterials');
  const apiStore = usePaginatedApiResource('rawMaterials', mapApiRawMaterialRow, { pageSize: 10 });
  const bootLoading = isModuleBootLoading(apiMode, apiStore.initialized);
  const lookups = useInventoryLookups();
  const [view, setView] = useState<'main' | 'form'>('main');
  const [localSearch, setLocalSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stockLevelFilter, setStockLevelFilter] = useState('all');
  const [stockTab, setStockTab] = useState('all');
  const [localPage, setLocalPage] = useState(1);
  const [localPageSize, setLocalPageSize] = useState(10);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: '',
    unit: 'pcs',
    quantity: '',
    price: '',
    supplierId: '',
    supplierPrice: '',
    threshold: '0',
    warehouseId: '',
    location: '',
    notes: '',
    imageUrl: '',
  });

  const warehouses = useMemo(
    () => (apiMode ? lookups.warehouses : listWarehouses(appState)),
    [apiMode, lookups.warehouses, appState],
  );
  const categories = useMemo(() => {
    if (apiMode) {
      const cats = new Set(apiStore.rows.map((r) => String(r.category ?? 'Uncategorized').trim() || 'Uncategorized'));
      return Array.from(cats).sort((a, b) => a.localeCompare(b));
    }
    return listRawMaterialCategories(appState);
  }, [apiMode, apiStore.rows, appState]);
  const allMaterials = useMemo(
    () => pickApiListRows(apiMode, apiStore.initialized, apiStore.rows, listRawMaterials(appState)),
    [apiMode, apiStore.initialized, apiStore.rows, appState],
  );
  const metrics = useMemo(() => {
    if (apiMode) {
      const items = apiStore.rows;
      const totalValue = items.reduce((s, r) => s + getRawMaterialTotalValue(r), 0);
      const totalQuantity = items.reduce((s, r) => s + Number(r.quantity ?? 0), 0);
      const lowStock = items.filter((r) => getRawMaterialStockStatus(r) === 'Low Stock').length;
      const outOfStock = items.filter((r) => getRawMaterialStockStatus(r) === 'Out of Stock').length;
      return { count: apiStore.meta.total, totalValue, totalQuantity, lowStock, outOfStock };
    }
    return getRawMaterialMetrics(appState);
  }, [apiMode, apiStore.rows, apiStore.meta.total, appState]);

  const filtered = useMemo(() => {
    let data = allMaterials;
    const q = (apiMode ? apiStore.search : localSearch).toLowerCase().trim();

    if (stockTab === 'low') {
      data = data.filter((rm) => getRawMaterialStockStatus(rm) === 'Low Stock');
    } else if (stockTab === 'out') {
      data = data.filter((rm) => getRawMaterialStockStatus(rm) === 'Out of Stock');
    }

    if (categoryFilter !== 'all') {
      data = data.filter((rm) => String(rm.category ?? '') === categoryFilter);
    }
    if (warehouseFilter !== 'all') {
      data = data.filter((rm) => String(rm.warehouseId ?? 'WH-001') === warehouseFilter);
    }
    if (statusFilter !== 'all') {
      data = data.filter((rm) => String(rm.status ?? 'active').toLowerCase() === statusFilter);
    }
    if (stockLevelFilter !== 'all') {
      data = data.filter((rm) => getRawMaterialStockStatus(rm).toLowerCase().replace(/\s+/g, '-') === stockLevelFilter);
    }
    if (q) {
      data = data.filter((rm) =>
        `${rm.name} ${rm.id} ${rm.category}`.toLowerCase().includes(q),
      );
    }

    if (!apiMode) return sortInventoryRowsNewestFirst(data);
    return data;
  }, [allMaterials, apiMode, apiStore.search, localSearch, categoryFilter, warehouseFilter, statusFilter, stockLevelFilter, stockTab]);

  const pageSize = apiMode ? apiStore.pageSize : localPageSize;
  const displayRows = apiMode
    ? filtered
    : filtered.slice((localPage - 1) * pageSize, localPage * pageSize);
  const listTotal = apiMode ? apiStore.meta.total : filtered.length;
  const listPage = apiMode ? apiStore.page : localPage;
  const liveTotal = Number(form.quantity || 0) * Number(form.price || 0);

  const resetFilters = () => {
    if (apiMode) apiStore.setSearchTerm('');
    else setLocalSearch('');
    setCategoryFilter('all');
    setWarehouseFilter('all');
    setStatusFilter('all');
    setStockLevelFilter('all');
    setStockTab('all');
    if (apiMode) apiStore.setPage(1);
    else setLocalPage(1);
  };

  const bumpPage = () => {
    if (apiMode) apiStore.setPage(1);
    else setLocalPage(1);
  };

  const materialLocation = (rm: Record<string, unknown>) => {
    if (apiMode) {
      const whName = resolveWarehouseName(lookups.warehouses, String(rm.warehouseId ?? ''));
      const bin = String(rm.location ?? '').trim();
      return bin ? `${whName} · ${bin}` : whName;
    }
    return getRawMaterialLocationLabel(appState, rm);
  };

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    {
      key: 'name',
      label: 'Material',
      render: (rm) => {
        const category = String(rm.category ?? 'Uncategorized');
        return (
          <div className="flex items-center gap-2.5 min-w-0 max-w-[220px]">
            <InventoryItemThumb
              imageUrl={String(rm.imageUrl ?? '')}
              alt={String(rm.name ?? '')}
              fallback={<MaterialThumb category={category} />}
            />
            <div className="min-w-0">
              <div className="font-bold text-slate-800 truncate">{String(rm.name)}</div>
              <div className="text-[10px] text-slate-400 font-semibold truncate">{String(rm.id ?? '—')}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'category',
      label: 'Category',
      render: (rm) => (
        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-[10px]">
          {String(rm.category || 'Uncategorized')}
        </span>
      ),
    },
    { key: 'unit', label: 'Unit', render: (rm) => <span className="font-semibold text-slate-700">{String(rm.unit)}</span> },
    {
      key: 'quantity',
      label: 'Stock Qty',
      render: (rm) => {
        const qty = Number(rm.quantity ?? 0);
        const stockStatus = getRawMaterialStockStatus(rm);
        return (
          <div className="space-y-0.5">
            <div className="font-extrabold text-slate-900">{qty.toLocaleString()}</div>
            <div className={`text-[10px] font-bold ${rawMaterialStockStatusClass(stockStatus)}`}>{stockStatus}</div>
          </div>
        );
      },
    },
    {
      key: 'threshold',
      label: 'Min. Level',
      render: (rm) => <span className="font-semibold text-slate-600">{Number(rm.threshold ?? 0).toLocaleString()}</span>,
    },
    {
      key: 'price',
      label: 'Price (৳)',
      render: (rm) => <span className="font-semibold">{formatMoney(Number(rm.price ?? 0))}</span>,
    },
    {
      key: 'totalValue',
      label: 'Total Value (৳)',
      render: (rm) => <span className="font-extrabold text-blue-700">{formatMoney(getRawMaterialTotalValue(rm))}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (rm) => <StatusBadge status={getRawMaterialStockStatus(rm)} />,
    },
    {
      key: 'location',
      label: 'Location',
      render: (rm) => (
        <span className="text-[11px] font-medium text-slate-600 leading-snug block max-w-[140px]">
          {materialLocation(rm)}
        </span>
      ),
    },
  ], [materialLocation]);

  const resetForm = () => {
    setForm({
      name: '',
      category: '',
      unit: 'pcs',
      quantity: '',
      price: '',
      supplierId: '',
      supplierPrice: '',
      threshold: '0',
      warehouseId: warehouses[0]?.id ? String(warehouses[0].id) : '',
      location: '',
      notes: '',
      imageUrl: '',
    });
    setEditingId(null);
    setShowAdvanced(false);
  };

  const openEdit = (row: Record<string, unknown>) => {
    if (!guardEdit()) return;
    setForm({
      name: String(row.name ?? ''),
      category: String(row.category ?? ''),
      unit: String(row.unit ?? 'pcs'),
      quantity: String(row.quantity ?? ''),
      price: String(row.price ?? ''),
      supplierId: String(row.supplierId ?? ''),
      supplierPrice: String(row.supplierPrice ?? ''),
      threshold: String(row.threshold ?? 0),
      warehouseId: String(row.warehouseId ?? warehouses[0]?.id ?? ''),
      location: String(row.location ?? ''),
      notes: String(row.notes ?? ''),
      imageUrl: String(row.imageUrl ?? ''),
    });
    setEditingId(String(row.id));
    setView('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && !guardEdit()) return;
    const payload = {
      ...form,
      quantity: Number(form.quantity || 0),
      price: Number(form.price || 0),
      threshold: Number(form.threshold || 0),
      supplierPrice: Number(form.supplierPrice || 0),
      status: 'active',
    };
    if (apiMode) {
      const body = mapRawMaterialPayloadToApi(payload);
      const result = editingId ? await apiStore.update(editingId, body) : await apiStore.create(body);
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Inventory', description: 'error' in result ? String(result.error) : 'Save failed' });
        return;
      }
      if (!editingId) {
        resetFilters();
      } else {
        bumpPage();
      }
      setView('main');
      resetForm();
      return;
    }
    const result = editingId
      ? updateRawMaterial(appState, editingId, payload)
      : createRawMaterial(appState, payload);
    if (!result.ok) {
      toast.error('Operation failed', { module: 'Inventory', description: 'error' in result ? String(result.error) : 'Save failed' });
      return;
    }
    saveAppState();
    if (!editingId) bumpPage();
    setView('main');
    resetForm();
  };

  const materialFields = [...RAW_MATERIAL_BASIC_FIELDS, ...RAW_MATERIAL_ADVANCED_FIELDS];

  const onPageChange = (p: number) => {
    if (apiMode) apiStore.setPage(p);
    else setLocalPage(p);
  };

  useChromeSuppressed(view === 'form');

  useRegisterModuleActions(
    view === 'main' ? (
      <button
        type="button"
        onClick={() => { resetForm(); setView('form'); }}
        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer"
      >
        + Add Raw Material
      </button>
    ) : null,
    [view],
  );

  return (
    <>
        {apiMode && <ApiModeBanner module="rawMaterials" error={apiStore.error} />}
        <ModuleKpiSection
          gridClassName="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2"
          kpiCount={5}
          loading={bootLoading}
          items={[
            { key: 'count', label: 'Total Materials', value: String(metrics.count), sub: 'All raw materials', iconify: KPI_ICON.count },
            { key: 'stock', label: 'Total Stock Qty', value: `${metrics.totalQuantity.toLocaleString()} units`, sub: 'Across all warehouses', iconify: KPI_ICON.stock },
            { key: 'low', label: 'Low Stock Alerts', value: String(metrics.lowStock), alert: metrics.lowStock > 0, sub: metrics.lowStock > 0 ? 'Requires attention' : 'Stock levels healthy', iconify: KPI_ICON.low },
            { key: 'oos', label: 'Out of Stock', value: String(metrics.outOfStock), alert: metrics.outOfStock > 0, sub: metrics.outOfStock > 0 ? 'Need to reorder' : 'No shortages', iconify: KPI_ICON.oos },
            { key: 'value', label: 'Total Inventory Value', value: formatMoney(metrics.totalValue), sub: 'At current prices', iconify: KPI_ICON.value },
          ]}
        />

        <FilterBar
          search={apiMode ? apiStore.search : localSearch}
          onSearchChange={(v) => {
            if (apiMode) apiStore.setSearchTerm(v);
            else setLocalSearch(v);
            onPageChange(1);
          }}
          searchPlaceholder="Search materials by name, code, category..."
        >
          <FilterSelect label="Category" value={categoryFilter} onChange={(v) => { setCategoryFilter(v); onPageChange(1); }}>
            <option value="all">All Categories</option>
            {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </FilterSelect>
          <FilterSelect label="Warehouse" value={warehouseFilter} onChange={(v) => { setWarehouseFilter(v); onPageChange(1); }}>
            <option value="all">All Warehouses</option>
            {warehouses.map((wh) => <option key={String(wh.id)} value={String(wh.id)}>{String(wh.name)}</option>)}
          </FilterSelect>
          <FilterSelect label="Status" value={statusFilter} onChange={(v) => { setStatusFilter(v); onPageChange(1); }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </FilterSelect>
          <FilterSelect label="Stock Level" value={stockLevelFilter} onChange={(v) => { setStockLevelFilter(v); onPageChange(1); }}>
            <option value="all">All Levels</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </FilterSelect>
          <FilterResetButton onClick={resetFilters} />
        </FilterBar>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <FilterTabs
            tabs={[
              { id: 'all', label: `All Materials (${allMaterials.length})` },
              { id: 'low', label: `Low Stock (${metrics.lowStock})` },
              { id: 'out', label: `Out of Stock (${metrics.outOfStock})` },
            ]}
            active={stockTab}
            onChange={(id) => { setStockTab(id); onPageChange(1); }}
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
          rows={displayRows}
          loading={bootLoading}
          emptyMessage={apiListEmptyMessage(apiStore.loading, apiStore.initialized, 'raw materials', { totalCount: allMaterials.length, filteredCount: filtered.length })}
          renderActions={(rm) => (
            <InventoryEditActions canEdit={canEdit}>
              <TableIconAction variant="edit" onClick={() => openEdit(rm)} />
              <TableIconAction
                variant="delete"
                onClick={() => {
                  if (!guardEdit()) return;
                  confirmAction({ title: 'Delete raw material', message: 'Delete this raw material?', confirmLabel: 'Delete', tone: 'danger', module: 'Raw Materials' }).then(async (__ok) => {
                    if (!__ok) return;
                    if (apiMode) {
                      const result = await apiStore.remove(String(rm.id));
                      if (!result.ok) toast.error('Delete failed', { module: 'Raw Materials', description: result.error });
                      return;
                    }
                    deleteRawMaterial(appState, String(rm.id));
                    saveAppState();
                  });
                }}
              />
            </InventoryEditActions>
          )}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
          <span>
            Showing {listTotal === 0 ? 0 : (listPage - 1) * pageSize + 1} to {Math.min(listPage * pageSize, listTotal)} of {listTotal} entries
          </span>
          {!apiMode ? (
            <select
              value={localPageSize}
              onChange={(e) => { setLocalPageSize(Number(e.target.value)); setLocalPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 cursor-pointer"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size} / page</option>
              ))}
            </select>
          ) : null}
        </div>
        <ListPagination page={listPage} pageSize={pageSize} total={listTotal} onPageChange={onPageChange} />
        <Footer />

      <AppFormModal
        open={view === 'form'}
        onClose={() => { setView('main'); resetForm(); }}
        title={editingId ? 'Edit Raw Material' : 'Add Raw Material'}
        subtitle="Track raw material stock, pricing, warehouse location, and supplier links."
        onSubmit={handleSubmit}
        submitLabel="Save Material"
        size="lg"
      >
        <div className="mb-5">
          <ImageUploadField
            label="Material Image"
            value={form.imageUrl}
            onChange={(url) => setForm({ ...form, imageUrl: url })}
          />
        </div>
        <AppFormFields
          fields={materialFields}
          values={form}
          onChange={(key, value) => setForm({ ...form, [key]: value })}
          showAdvanced={showAdvanced}
          onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
        />
        <div className={FORM_GRID_CLS}>
          <div>
            <label className={FORM_LABEL_CLS}>Supplier</label>
            <SupplierSelect state={appState} value={form.supplierId} onChange={(v) => setForm({ ...form, supplierId: v })} />
          </div>
          <div>
            <label className={FORM_LABEL_CLS}>Warehouse</label>
            <WarehouseSelect state={appState} items={apiMode ? warehouses : undefined} value={form.warehouseId} onChange={(v) => setForm({ ...form, warehouseId: v })} />
          </div>
          <div className="md:col-span-2 bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-4">
            <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Live Total Value</span>
            <p className="text-lg font-bold text-emerald-700 mt-1">{formatMoney(liveTotal)}</p>
          </div>
        </div>
      </AppFormModal>
    </>
  );
}
