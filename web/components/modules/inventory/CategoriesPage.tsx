'use client';

import { toast, confirmAction } from '@/lib/ui/feedback';

import { useMemo, useState } from 'react';
import { Folder } from 'lucide-react';
import { AppFormFields, AppFormModal, FORM_GRID_CLS, FORM_LABEL_CLS } from '@/components/shared/AppForm';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { ImageUploadField } from '@/components/shared/ImageUploadField';
import { InventoryItemThumb } from '@/components/shared/InventoryItemThumb';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { InventoryListLayout, FilterBar, FilterSelect, SELECT_CLS } from '@/components/modules/inventory/shared/inventory-ui';
import { useAppStore } from '@/lib/state/app-store';
import type { PortField } from '@/lib/modules/port-types';
import { isModuleApiMode } from '@/lib/config/data-source';
import { useApiResourceStore } from '@/hooks/use-api-resource-store';
import { useInventoryLookups } from '@/hooks/use-inventory-lookups';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { apiListEmptyMessage } from '@/lib/services/api-list-ui';
import {
  mapApiCategoryRow,
  mapCategoryPayloadToApi,
} from '@/lib/services/inventory-api-mappers';
import {
  getCategoryMetrics,
  createCategory,
  updateCategory,
  deleteCategory,
  computeTotalStock,
  formatMoney,
  PRODUCT_TYPES,
  sortInventoryRowsNewestFirst,
} from '@/lib/services/inventory-service';

const CATEGORY_BASIC_FIELDS: PortField[] = [
  { key: 'name', label: 'Category Name', required: true },
  { key: 'code', label: 'Code' },
  { key: 'type', label: 'Product Type', type: 'select', options: [...PRODUCT_TYPES] },
  { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
  { key: 'description', label: 'Description', type: 'textarea' },
];

const CATEGORY_ADVANCED_FIELDS: PortField[] = [
  { key: 'defaultTaxRate', label: 'Default Tax Rate (%)', type: 'number', advanced: true },
  { key: 'defaultUnitType', label: 'Default Unit Type', advanced: true, placeholder: 'kg, pcs, etc.' },
  { key: 'stockPolicy', label: 'Stock Policy', type: 'select', options: ['FIFO', 'FEFO', 'LIFO'], advanced: true },
];

function buildCategoryMetrics(
  categoryRows: Record<string, unknown>[],
  productRows: Record<string, unknown>[],
): {
  categories: Record<string, unknown>[];
  activeCategories: number;
  emptyCategories: number;
  topCategory: Record<string, unknown> | null;
} {
  const viewModels: Record<string, unknown>[] = categoryRows.map((cat) => {
    const linked = productRows.filter((p) => String(p.category) === String(cat.name));
    const productCount = linked.length;
    const totalStockValue = linked.reduce((s, p) => s + computeTotalStock(p) * Number(p.cost ?? 0), 0);
    const parent = categoryRows.find((c) => String(c.id) === String(cat.parentId));
    return { ...cat, parentCategoryName: parent ? String(parent.name) : '—', productCount, totalStockValue };
  });
  const activeCategories = viewModels.filter((c) => String(c.status) === 'Active').length;
  const emptyCategories = viewModels.filter((c) => Number(c.productCount ?? 0) === 0).length;
  const topCategory = viewModels.reduce<Record<string, unknown> | null>((top, c) => (
    Number(c.totalStockValue ?? 0) > Number(top?.totalStockValue ?? 0) ? c : top
  ), null);
  return { categories: viewModels, activeCategories, emptyCategories, topCategory };
}

export function CategoriesPage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const apiMode = isModuleApiMode('categories');
  const apiStore = useApiResourceStore('categories', mapApiCategoryRow);
  const lookups = useInventoryLookups();
  const [view, setView] = useState<'main' | 'form'>('main');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({
    name: '', code: '', type: 'Finished Goods', description: '', parentId: '', status: 'Active',
    defaultTaxRate: '', defaultUnitType: '', stockPolicy: 'FIFO', imageUrl: '',
  });

  const { categories, activeCategories, emptyCategories, topCategory } = useMemo(() => {
    if (apiMode) return buildCategoryMetrics(apiStore.rows, lookups.products);
    return getCategoryMetrics(appState);
  }, [apiMode, apiStore.rows, lookups.products, appState]);

  const filtered = useMemo(() => {
    let data = categories;
    if (statusFilter !== 'all') data = data.filter((c) => String(c.status) === statusFilter);
    if (typeFilter !== 'all') data = data.filter((c) => String(c.type) === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((c) => `${c.name} ${c.code}`.toLowerCase().includes(q));
    }
    return sortInventoryRowsNewestFirst(data);
  }, [categories, search, statusFilter, typeFilter]);

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  const resetForm = () => {
    setForm({ name: '', code: '', type: 'Finished Goods', description: '', parentId: '', status: 'Active', defaultTaxRate: '', defaultUnitType: '', stockPolicy: 'FIFO', imageUrl: '' });
    setEditingId(null);
    setShowAdvanced(false);
  };

  const openEdit = (row: Record<string, unknown>) => {
    setForm({
      name: String(row.name ?? ''), code: String(row.code ?? ''), type: String(row.type ?? 'Finished Goods'),
      description: String(row.description ?? ''), parentId: String(row.parentId ?? ''), status: String(row.status ?? 'Active'),
      defaultTaxRate: String(row.defaultTaxRate ?? ''), defaultUnitType: String(row.defaultUnitType ?? ''), stockPolicy: String(row.stockPolicy ?? 'FIFO'),
      imageUrl: String(row.imageUrl ?? ''),
    });
    setEditingId(String(row.id));
    setView('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, defaultTaxRate: Number(form.defaultTaxRate || 0) };
    if (apiMode) {
      const body = mapCategoryPayloadToApi(payload);
      const result = editingId ? await apiStore.update(editingId, body) : await apiStore.create(body);
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Categories', description: 'error' in result ? String(result.error) : 'Save failed' });
        return;
      }
      if (!editingId) resetFilters();
      setView('main');
      resetForm();
      return;
    }
    const result = editingId ? updateCategory(appState, editingId, payload) : createCategory(appState, payload);
    if (!result.ok) { toast.error('Operation failed', { module: 'Categories', description: 'error' in result ? String(result.error) : 'Save failed' }); return; }
    saveAppState();
    setView('main');
    resetForm();
  };

  const handleDelete = async (id: string) => {
    const __ok = await confirmAction({ title: "Delete this category", message: "Delete this category?", confirmLabel: 'Delete', tone: 'danger', module: 'Categories' }); if (!__ok) return;
    if (apiMode) {
      const result = await apiStore.remove(id);
      if (!result.ok) toast.error('Delete failed', { module: 'Categories', description: result.error });
      return;
    }
    deleteCategory(appState, id);
    saveAppState();
  };

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    {
      key: 'name',
      label: 'Category',
      render: (cat) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <InventoryItemThumb
            imageUrl={String(cat.imageUrl ?? '')}
            alt={String(cat.name ?? '')}
            fallback={(
              <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 text-slate-500">
                <Folder className="w-4 h-4" />
              </span>
            )}
          />
          <span className="font-bold text-slate-800 truncate">{String(cat.name)}</span>
        </div>
      ),
    },
    { key: 'code', label: 'Code', render: (cat) => String(cat.code ?? '—') },
    { key: 'type', label: 'Type', render: (cat) => String(cat.type ?? '—') },
    { key: 'parent', label: 'Parent', render: (cat) => String(cat.parentCategoryName) },
    { key: 'productCount', label: 'Products', render: (cat) => Number(cat.productCount ?? 0) },
    { key: 'totalStockValue', label: 'Stock Value', render: (cat) => formatMoney(Number(cat.totalStockValue ?? 0)) },
    { key: 'stockPolicy', label: 'Policy', render: (cat) => String(cat.stockPolicy ?? 'FIFO') },
    { key: 'status', label: 'Status', render: (cat) => <StatusBadge status={String(cat.status ?? 'Active')} /> },
  ], []);

  const categoryFields = useMemo(
    () => [...CATEGORY_BASIC_FIELDS, ...CATEGORY_ADVANCED_FIELDS],
    [],
  );

  const setField = (key: string, value: string) => setForm({ ...form, [key]: value });

  return (
    <>
    {apiMode && <ApiModeBanner module="categories" error={apiStore.error} />}
    <InventoryListLayout
      title="Categories"
      subtitle="Organize products with hierarchical categories and stock policies."
      addLabel="Add Category"
      onAdd={() => { resetForm(); setView('form'); }}
      kpis={[
        { key: 'total', label: 'Total Categories', value: String(categories.length), sub: 'organized product groups in the master list' },
        { key: 'active', label: 'Active Categories', value: String(activeCategories), sub: 'available for product assignment' },
        { key: 'empty', label: 'Empty Categories', value: String(emptyCategories), sub: 'currently have no linked products' },
        { key: 'top', label: 'Top Category Value', value: topCategory ? formatMoney(Number(topCategory.totalStockValue ?? 0)) : '$0.00', sub: topCategory ? String(topCategory.name) : '—' },
      ]}
      filters={
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search categories..."
        >
          <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter}><option value="all">All</option><option value="Active">Active</option><option value="Inactive">Inactive</option></FilterSelect>
          <FilterSelect label="Type" value={typeFilter} onChange={setTypeFilter}><option value="all">All Types</option>{PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</FilterSelect>
        </FilterBar>
      }
    >
      <AppTable
        columns={columns}
        rows={filtered}
        emptyMessage={apiListEmptyMessage(apiStore.loading, apiStore.initialized, 'categories', { totalCount: categories.length, filteredCount: filtered.length })}
        renderActions={(cat) => (
          <>
            <TableIconAction variant="edit" onClick={() => openEdit(cat)} />
            <TableIconAction variant="delete" onClick={() => handleDelete(String(cat.id))} />
          </>
        )}
      />
    </InventoryListLayout>
    <AppFormModal
      open={view === 'form'}
      onClose={() => { setView('main'); resetForm(); }}
      title={editingId ? 'Edit Category' : 'Create Category'}
      subtitle="Organize products with hierarchy, tax defaults, and stock policies."
      onSubmit={handleSubmit}
      submitLabel="Save Category"
      size="md"
    >
      <div className="mb-5">
        <ImageUploadField
          label="Category Photo"
          value={form.imageUrl}
          onChange={(url) => setForm({ ...form, imageUrl: url })}
        />
      </div>
      <AppFormFields
        fields={categoryFields}
        values={form}
        onChange={setField}
        showAdvanced={showAdvanced}
        onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
      />
      {showAdvanced && (
        <div className={`${FORM_GRID_CLS} pt-4 border-t border-slate-100/80`}>
          <div>
            <label className={FORM_LABEL_CLS}>Parent Category</label>
            <select className={SELECT_CLS} value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
              <option value="">None</option>
              {categories.filter((c) => String(c.id) !== editingId).map((c) => (
                <option key={String(c.id)} value={String(c.id)}>{String(c.name)}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </AppFormModal>
    </>
  );
}
