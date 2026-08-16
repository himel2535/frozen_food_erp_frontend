'use client';

import { toast } from '@/lib/ui/feedback';

import { useMemo, useState } from 'react';
import { ChevronDown, Calculator, Download, Info, Layers, Package, Settings2 } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { useChromeSuppressed, useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { useInventoryEditAccess } from '@/hooks/use-inventory-edit-access';
import { AppFormFields, AppFormModal, FORM_GRID_CLS, FORM_LABEL_CLS } from '@/components/shared/AppForm';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { FilterTabs } from '@/components/shared/FilterTabs';
import { ImageUploadField } from '@/components/shared/ImageUploadField';
import { InventoryItemThumb } from '@/components/shared/InventoryItemThumb';
import { ModuleKpiSection } from '@/components/shared/ModuleKpiSection';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { FilterBar, FilterResetButton, FilterSelect } from '@/components/modules/inventory/shared/inventory-ui';
import { InventoryProductDetailView } from '@/components/modules/inventory/shared/InventoryProductDetailView';
import { InventoryProductBomView } from '@/components/modules/inventory/shared/InventoryProductBomView';
import { InventoryStockSummaryView } from '@/components/modules/inventory/shared/InventoryStockSummaryView';
import { InventoryProductionCapacityView } from '@/components/modules/inventory/shared/InventoryProductionCapacityView';
import { InventoryMaterialRequirementView } from '@/components/modules/inventory/shared/InventoryMaterialRequirementView';
import { WarehouseSelect, RecipeSelect } from '@/components/modules/inventory/shared/selects';
import { useAppStore } from '@/lib/state/app-store';
import type { PortField } from '@/lib/modules/port-types';
import { INVENTORY_STANDARD_KPI_ICONS as KPI_ICON } from '@/lib/ui/kpi-icons';
import { isModuleApiMode } from '@/lib/config/data-source';
import { usePaginatedApiResource } from '@/hooks/use-paginated-api-resource';
import { ListPagination } from '@/components/shared/ListPagination';
import { useInventoryLookups } from '@/hooks/use-inventory-lookups';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { isModuleBootLoading, pickApiListRows } from '@/lib/ui/kpi-loading';
import { apiListEmptyMessage } from '@/lib/services/api-list-ui';
import {
  mapApiSemiFinishedRow,
  mapSemiFinishedPayloadToApi,
} from '@/lib/services/inventory-api-mappers';
import {
  createSemiFinishedProduct,
  deleteSemiFinishedProduct,
  formatMoney,
  getSemiFinishedMetrics,
  getSemiFinishedStockStatus,
  getSemiFinishedTotalValue,
  inventoryStockStatusClass,
  listSemiFinishedCategories,
  listSemiFinishedProducts,
  listSemiFinishedUnits,
  listWarehouses,
  previewSemiFinishedCode,
  sortInventoryRowsNewestFirst,
  updateSemiFinishedProduct,
} from '@/lib/services/inventory-service';
import {
  buildSemiFinishedStockSummary,
  downloadInventoryProductCsv,
} from '@/lib/services/inventory-export';
import {
  ensureSemiFinishedRecipe,
  getRecipe,
  syncSemiFinishedRecipeMeta,
} from '@/lib/services/recipes-service';

const PAGE_SIZE_OPTIONS = [10, 15, 25];

const SF_BASIC_FIELDS: PortField[] = [
  { key: 'name', label: 'Product Name', required: true },
  { key: 'category', label: 'Category' },
  { key: 'unit', label: 'Unit', required: true },
  { key: 'quantity', label: 'Stock Quantity', type: 'number', required: true },
  { key: 'avgCost', label: 'Average Cost (BDT)', type: 'number', required: true },
  { key: 'minStock', label: 'Min. Stock Level', type: 'number' },
];

const SF_ADVANCED_FIELDS: PortField[] = [
  { key: 'location', label: 'Bin Location', advanced: true },
  { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
];

const CATEGORY_COLORS: Record<string, string> = {
  'Plastic Parts': 'bg-blue-100 text-blue-700',
  'Action Figure Parts': 'bg-violet-100 text-violet-700',
  'RC Car Components': 'bg-amber-100 text-amber-700',
  Assembly: 'bg-emerald-100 text-emerald-700',
  Electronics: 'bg-rose-100 text-rose-700',
  Textile: 'bg-sky-100 text-sky-700',
};

function ProductThumb({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category] ?? 'bg-slate-100 text-slate-600';
  return (
    <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
      <Package className="w-4 h-4" />
    </span>
  );
}

export function SemiFinishedProductsPage() {
  const { canEdit, guardEdit } = useInventoryEditAccess();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const apiMode = isModuleApiMode('semiFinishedProducts');
  const apiStore = usePaginatedApiResource('semiFinishedProducts', mapApiSemiFinishedRow, { pageSize: 10 });
  const bootLoading = isModuleBootLoading(apiMode, apiStore.initialized);
  const lookups = useInventoryLookups();
  const [view, setView] = useState<'main' | 'form' | 'detail' | 'summary' | 'capacity' | 'materials' | 'bom'>('main');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [capacityId, setCapacityId] = useState<string | null>(null);
  const [materialsId, setMaterialsId] = useState<string | null>(null);
  const [bomId, setBomId] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');
  const [unitFilter, setUnitFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [stockTab, setStockTab] = useState('all');
  const [localPage, setLocalPage] = useState(1);
  const [localPageSize, setLocalPageSize] = useState(10);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: '',
    unit: 'pcs',
    quantity: '',
    avgCost: '',
    minStock: '0',
    warehouseId: '',
    location: '',
    notes: '',
    recipeId: '',
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
    return listSemiFinishedCategories(appState);
  }, [apiMode, apiStore.rows, appState]);
  const units = useMemo(() => {
    if (apiMode) {
      const u = new Set(apiStore.rows.map((r) => String(r.unit ?? 'pcs').trim() || 'pcs'));
      return Array.from(u).sort((a, b) => a.localeCompare(b));
    }
    return listSemiFinishedUnits(appState);
  }, [apiMode, apiStore.rows, appState]);
  const allProducts = useMemo(
    () => pickApiListRows(apiMode, apiStore.initialized, apiStore.rows, listSemiFinishedProducts(appState)),
    [apiMode, apiStore.initialized, apiStore.rows, appState],
  );
  const metrics = useMemo(() => {
    if (apiMode) {
      const items = apiStore.rows;
      const totalValue = items.reduce((s, r) => s + getSemiFinishedTotalValue(r), 0);
      const totalQuantity = items.reduce((s, r) => s + Number(r.quantity ?? 0), 0);
      const lowStock = items.filter((r) => getSemiFinishedStockStatus(r) === 'Low Stock').length;
      const outOfStock = items.filter((r) => getSemiFinishedStockStatus(r) === 'Out of Stock').length;
      return { count: apiStore.meta.total, totalValue, totalQuantity, lowStock, outOfStock };
    }
    return getSemiFinishedMetrics(appState);
  }, [apiMode, apiStore.rows, apiStore.meta.total, appState]);

  const filtered = useMemo(() => {
    let data = allProducts;
    const q = apiMode ? '' : localSearch.toLowerCase().trim();

    if (stockTab === 'low') {
      data = data.filter((row) => getSemiFinishedStockStatus(row) === 'Low Stock');
    } else if (stockTab === 'out') {
      data = data.filter((row) => getSemiFinishedStockStatus(row) === 'Out of Stock');
    }

    if (categoryFilter !== 'all') {
      data = data.filter((row) => String(row.category ?? '') === categoryFilter);
    }
    if (unitFilter !== 'all') {
      data = data.filter((row) => String(row.unit ?? '') === unitFilter);
    }
    if (locationFilter !== 'all') {
      data = data.filter((row) => String(row.warehouseId ?? 'WH-001') === locationFilter);
    }
    if (stockStatusFilter !== 'all') {
      data = data.filter(
        (row) => getSemiFinishedStockStatus(row).toLowerCase().replace(/\s+/g, '-') === stockStatusFilter,
      );
    }
    if (q) {
      data = data.filter((row) =>
        `${row.name} ${row.id} ${row.category}`.toLowerCase().includes(q),
      );
    }

    if (!apiMode) return sortInventoryRowsNewestFirst(data);
    return data;
  }, [allProducts, apiMode, apiStore.search, localSearch, categoryFilter, stockStatusFilter, unitFilter, locationFilter, stockTab]);

  const pageSize = apiMode ? apiStore.pageSize : localPageSize;
  const displayRows = apiMode ? filtered : filtered.slice((localPage - 1) * pageSize, localPage * pageSize);
  const listTotal = apiMode ? apiStore.meta.total : filtered.length;
  const listPage = apiMode ? apiStore.page : localPage;
  const liveTotal = Number(form.quantity || 0) * Number(form.avgCost || 0);

  const onPageChange = (p: number) => {
    if (apiMode) apiStore.setPage(p);
    else setLocalPage(p);
  };

  const resetFilters = () => {
    if (apiMode) apiStore.setSearchTerm('');
    else setLocalSearch('');
    setCategoryFilter('all');
    setStockStatusFilter('all');
    setUnitFilter('all');
    setLocationFilter('all');
    setStockTab('all');
    onPageChange(1);
  };

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    {
      key: 'name',
      label: 'Product',
      render: (row) => {
        const category = String(row.category ?? 'Uncategorized');
        return (
          <div className="flex items-center gap-2.5 min-w-0 max-w-[220px]">
            <InventoryItemThumb
              imageUrl={String(row.imageUrl ?? '')}
              alt={String(row.name ?? '')}
              fallback={<ProductThumb category={category} />}
            />
            <div className="min-w-0">
              <div className="font-bold text-slate-800 truncate">{String(row.name)}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'code',
      label: 'Code',
      render: (row) => (
        <span className="font-mono text-[11px] font-semibold text-slate-600">{String(row.id ?? '—')}</span>
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
      label: 'Stock Qty',
      render: (row) => {
        const qty = Number(row.quantity ?? 0);
        const stockStatus = getSemiFinishedStockStatus(row);
        return (
          <div className="space-y-0.5">
            <div className="font-extrabold text-slate-900">{qty.toLocaleString()}</div>
            <div className={`text-[10px] font-bold ${inventoryStockStatusClass(stockStatus)}`}>{stockStatus}</div>
          </div>
        );
      },
    },
    {
      key: 'minStock',
      label: 'Min. Stock',
      render: (row) => (
        <span className="font-semibold text-slate-600">{Number(row.minStock ?? 0).toLocaleString()}</span>
      ),
    },
    {
      key: 'avgCost',
      label: 'Avg. Cost (৳)',
      render: (row) => <span className="font-semibold">{formatMoney(Number(row.avgCost ?? 0))}</span>,
    },
    {
      key: 'totalValue',
      label: 'Total Value (৳)',
      render: (row) => (
        <span className="font-extrabold text-blue-700">{formatMoney(getSemiFinishedTotalValue(row))}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={getSemiFinishedStockStatus(row)} />,
    },
  ], []);

  const resetForm = () => {
    setForm({
      name: '',
      category: '',
      unit: 'pcs',
      quantity: '',
      avgCost: '',
      minStock: '0',
      warehouseId: warehouses[0]?.id ? String(warehouses[0].id) : '',
      location: '',
      notes: '',
      recipeId: '',
      imageUrl: '',
    });
    setEditingId(null);
    setShowAdvanced(false);
  };

  const openCreate = () => {
    resetForm();
    setView('form');
  };

  const openEdit = (row: Record<string, unknown>) => {
    if (!guardEdit()) return;
    setForm({
      name: String(row.name ?? ''),
      category: String(row.category ?? ''),
      unit: String(row.unit ?? 'pcs'),
      quantity: String(row.quantity ?? ''),
      avgCost: String(row.avgCost ?? ''),
      minStock: String(row.minStock ?? 0),
      warehouseId: String(row.warehouseId ?? warehouses[0]?.id ?? ''),
      location: String(row.location ?? ''),
      notes: String(row.notes ?? ''),
      recipeId: String(row.recipeId ?? ''),
      imageUrl: String(row.imageUrl ?? ''),
    });
    setEditingId(String(row.id));
    setView('form');
  };

  const handleRecipeChange = (recipeId: string) => {
    if (!recipeId) {
      setForm((prev) => ({ ...prev, recipeId: '' }));
      return;
    }
    const recipe = getRecipe(appState, recipeId);
    if (!recipe) {
      setForm((prev) => ({ ...prev, recipeId }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      recipeId,
      name: prev.name.trim() ? prev.name : recipe.product,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && !guardEdit()) return;
    const payload = {
      ...form,
      recipeId: form.recipeId || undefined,
      quantity: Number(form.quantity || 0),
      avgCost: Number(form.avgCost || 0),
      minStock: Number(form.minStock || 0),
      status: 'active',
    };
    if (apiMode) {
      const body = mapSemiFinishedPayloadToApi(payload);
      const result = editingId ? await apiStore.update(editingId, body) : await apiStore.create(body);
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Inventory', description: 'error' in result ? String(result.error) : 'Save failed' });
        return;
      }
      if (!editingId) {
        resetFilters();
      } else {
        onPageChange(1);
      }
      setView('main');
      resetForm();
      return;
    }
    const savedId = editingId ?? previewSemiFinishedCode(appState);
    const result = editingId
      ? updateSemiFinishedProduct(appState, editingId, payload)
      : createSemiFinishedProduct(appState, { ...payload, id: savedId });
    if (!result.ok) {
      toast.error('Operation failed', { module: 'Inventory', description: 'error' in result ? String(result.error) : 'Save failed' });
      return;
    }
    if (form.recipeId) {
      syncSemiFinishedRecipeMeta(appState, savedId, form.recipeId);
    } else {
      ensureSemiFinishedRecipe(appState, {
        id: savedId,
        name: form.name,
      });
    }
    saveAppState();
    if (!editingId) onPageChange(1);
    setView('main');
    resetForm();
  };

  const productFields = [...SF_BASIC_FIELDS, ...SF_ADVANCED_FIELDS];
  const detailRow = useMemo(
    () => (detailId ? allProducts.find((row) => String(row.id) === detailId) ?? null : null),
    [allProducts, detailId],
  );
  const capacityRow = useMemo(
    () => (capacityId ? allProducts.find((row) => String(row.id) === capacityId) ?? null : null),
    [allProducts, capacityId],
  );
  const materialsRow = useMemo(
    () => (materialsId ? allProducts.find((row) => String(row.id) === materialsId) ?? null : null),
    [allProducts, materialsId],
  );
  const bomRow = useMemo(
    () => (bomId ? allProducts.find((row) => String(row.id) === bomId) ?? null : null),
    [allProducts, bomId],
  );
  const stockSummary = useMemo(() => buildSemiFinishedStockSummary(appState), [appState]);

  const openBom = (row: Record<string, unknown>) => {
    setBomId(String(row.id));
    setView('bom');
  };

  const openDetail = (row: Record<string, unknown>) => {
    setDetailId(String(row.id));
    setView('detail');
  };

  const openCapacity = (row: Record<string, unknown>) => {
    setCapacityId(String(row.id));
    setView('capacity');
  };

  const openMaterials = (row: Record<string, unknown>) => {
    setMaterialsId(String(row.id));
    setView('materials');
  };

  useChromeSuppressed(view !== 'main');

  useRegisterModuleActions(
    view === 'main' ? (
      <div className="relative self-start">
        <div className="flex">
          <button
            type="button"
            onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-l-xl cursor-pointer"
          >
            + Add Semi-Finished Product
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
    ) : null,
    [view, showAddMenu, openCreate],
  );

  if (view === 'detail' && detailRow) {
    return (
      <InventoryProductDetailView
        variant="semi-finished"
        row={detailRow}
        appState={appState}
        onBack={() => { setView('main'); setDetailId(null); }}
        onEdit={() => openEdit(detailRow)}
        onManageBom={() => openBom(detailRow)}
      />
    );
  }

  if (view === 'bom' && bomRow) {
    return (
      <InventoryProductBomView
        variant="semi-finished"
        row={bomRow}
        appState={appState}
        onBack={() => { setView('main'); setBomId(null); }}
        onSave={saveAppState}
      />
    );
  }

  if (view === 'summary') {
    return (
      <InventoryStockSummaryView
        summary={stockSummary}
        onBack={() => setView('main')}
      />
    );
  }

  if (view === 'capacity' && capacityRow) {
    return (
      <InventoryProductionCapacityView
        variant="semi-finished"
        row={capacityRow}
        appState={appState}
        onBack={() => { setView('main'); setCapacityId(null); }}
        backLabel="Back to Capacity Report"
        onEdit={() => openEdit(capacityRow)}
        onLinkBom={(recipeId) => {
          const result = updateSemiFinishedProduct(appState, String(capacityRow.id), { recipeId });
          if (!result.ok) {
            toast.error('Failed to link BOM', { module: 'Inventory', description: 'error' in result ? String(result.error) : 'Save failed' });
            return;
          }
          saveAppState();
        }}
      />
    );
  }

  if (view === 'materials' && materialsRow) {
    return (
      <InventoryMaterialRequirementView
        variant="semi-finished"
        row={materialsRow}
        appState={appState}
        onBack={() => { setView('main'); setMaterialsId(null); }}
        backLabel="Back to Semi-Finished Products"
        onEdit={() => openEdit(materialsRow)}
        onLinkBom={(recipeId) => {
          const result = updateSemiFinishedProduct(appState, String(materialsRow.id), { recipeId });
          if (!result.ok) {
            toast.error('Failed to link BOM', { module: 'Inventory', description: 'error' in result ? String(result.error) : 'Save failed' });
            return;
          }
          saveAppState();
        }}
      />
    );
  }

  return (
    <>
        {apiMode && <ApiModeBanner module="semiFinishedProducts" error={apiStore.error} />}
        <ModuleKpiSection
          gridClassName="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2"
          kpiCount={5}
          loading={bootLoading}
          items={[
            { key: 'count', label: 'Total Products', value: String(metrics.count), sub: 'All semi-finished products', iconify: KPI_ICON.count },
            { key: 'stock', label: 'Total Stock Qty', value: `${metrics.totalQuantity.toLocaleString()} pcs`, sub: 'Across all locations', iconify: KPI_ICON.stock },
            { key: 'low', label: 'Low Stock', value: String(metrics.lowStock), alert: metrics.lowStock > 0, sub: metrics.lowStock > 0 ? 'Requires attention' : 'Stock levels healthy', iconify: KPI_ICON.low },
            { key: 'oos', label: 'Out of Stock', value: String(metrics.outOfStock), alert: metrics.outOfStock > 0, sub: metrics.outOfStock > 0 ? 'Need to reorder' : 'No shortages', iconify: KPI_ICON.oos },
            { key: 'value', label: 'Total Inventory Value', value: formatMoney(metrics.totalValue), sub: 'At average cost', iconify: KPI_ICON.value },
          ]}
        />

        <FilterBar
          search={apiMode ? apiStore.search : localSearch}
          onSearchChange={(v) => {
            if (apiMode) apiStore.setSearchTerm(v);
            else setLocalSearch(v);
            onPageChange(1);
          }}
          searchPlaceholder="Search semi-finished product by name or code..."
        >
          <FilterSelect label="Category" value={categoryFilter} onChange={(v) => { setCategoryFilter(v); onPageChange(1); }}>
            <option value="all">All Categories</option>
            {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </FilterSelect>
          <FilterSelect label="Stock Status" value={stockStatusFilter} onChange={(v) => { setStockStatusFilter(v); onPageChange(1); }}>
            <option value="all">All Status</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </FilterSelect>
          <FilterSelect label="Unit" value={unitFilter} onChange={(v) => { setUnitFilter(v); onPageChange(1); }}>
            <option value="all">All Units</option>
            {units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
          </FilterSelect>
          <FilterSelect label="Location" value={locationFilter} onChange={(v) => { setLocationFilter(v); onPageChange(1); }}>
            <option value="all">All Locations</option>
            {warehouses.map((wh) => <option key={String(wh.id)} value={String(wh.id)}>{String(wh.name)}</option>)}
          </FilterSelect>
          <FilterResetButton onClick={resetFilters} />
        </FilterBar>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <FilterTabs
            tabs={[
              { id: 'all', label: `All Products (${allProducts.length})` },
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
          emptyMessage={apiListEmptyMessage(apiStore.loading, apiStore.initialized, 'semi-finished products', { totalCount: allProducts.length, filteredCount: filtered.length })}
          renderActions={(row) => (
            <>
              <TableIconAction
                variant="view"
                onClick={() => openDetail(row)}
              />
              <button
                type="button"
                title="Download"
                onClick={() => downloadInventoryProductCsv(row, 'semi-finished', appState)}
                className="app-table-icon-btn cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
              <TableIconAction
                variant="bom"
                onClick={() => openBom(row)}
              />
              <button
                type="button"
                title="Material Requirements"
                onClick={() => openMaterials(row)}
                className="app-table-icon-btn cursor-pointer"
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Production Report"
                onClick={() => openCapacity(row)}
                className="app-table-icon-btn cursor-pointer"
              >
                <Calculator className="w-4 h-4" />
              </button>
              {canEdit ? <TableIconAction variant="edit" onClick={() => openEdit(row)} /> : null}
            </>
          )}
        />

        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-2 text-xs text-emerald-800">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              <span className="font-bold">Track WIP parts stock by warehouse and location.</span>{' '}
              Monitor semi-finished inventory across production stages.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setView('summary')}
            className="shrink-0 text-xs font-bold text-blue-700 border border-blue-200 bg-white hover:bg-blue-50 px-3 py-2 rounded-xl cursor-pointer"
          >
            View Stock Summary
          </button>
        </div>

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
        title={editingId ? 'Edit Semi-Finished Product' : 'Add Semi-Finished Product'}
        subtitle="Track semi-finished stock, average cost, and warehouse location."
        onSubmit={handleSubmit}
        submitLabel="Save Product"
        size="lg"
      >
        <div className="mb-5">
          <ImageUploadField
            label="Product Image"
            value={form.imageUrl}
            onChange={(url) => setForm({ ...form, imageUrl: url })}
          />
        </div>
        <AppFormFields
          fields={productFields}
          values={form}
          onChange={(key, value) => setForm({ ...form, [key]: value })}
          showAdvanced={showAdvanced}
          onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
        />
        {showAdvanced ? (
          <div className={FORM_GRID_CLS}>
            <div>
              <label className={FORM_LABEL_CLS}>Linked BOM</label>
              <RecipeSelect
                state={appState}
                value={form.recipeId}
                onChange={handleRecipeChange}
                filterProduct={form.name || editingId
                  ? {
                      id: editingId ?? undefined,
                      sku: editingId ?? undefined,
                      name: form.name || undefined,
                    }
                  : undefined}
              />
            </div>
          </div>
        ) : null}
        <div className={FORM_GRID_CLS}>
          <div>
            <label className={FORM_LABEL_CLS}>Warehouse / Location</label>
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
