'use client';

import { useMemo, useState } from 'react';
import { AdvancedDetailsToggle } from '@/components/shared/AdvancedDetailsToggle';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { InventoryFormLayout, InventoryListLayout, FilterBar, FilterSelect, SearchInput, INPUT_CLS, SELECT_CLS } from '@/components/modules/inventory/shared/inventory-ui';
import { useAppStore } from '@/lib/state/app-store';
import {
  getCategoryMetrics,
  createCategory,
  updateCategory,
  deleteCategory,
  formatMoney,
  PRODUCT_TYPES,
} from '@/lib/services/inventory-service';

export function CategoriesPage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [view, setView] = useState<'main' | 'form'>('main');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({
    name: '', code: '', type: 'Finished Goods', description: '', parentId: '', status: 'Active',
    defaultTaxRate: '', defaultUnitType: '', stockPolicy: 'FIFO',
  });

  const { categories, activeCategories, emptyCategories, topCategory } = useMemo(() => getCategoryMetrics(appState), [appState]);

  const filtered = useMemo(() => {
    let data = categories;
    if (statusFilter !== 'all') data = data.filter((c) => String(c.status) === statusFilter);
    if (typeFilter !== 'all') data = data.filter((c) => String(c.type) === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((c) => `${c.name} ${c.code}`.toLowerCase().includes(q));
    }
    return data;
  }, [categories, search, statusFilter, typeFilter]);

  const resetForm = () => {
    setForm({ name: '', code: '', type: 'Finished Goods', description: '', parentId: '', status: 'Active', defaultTaxRate: '', defaultUnitType: '', stockPolicy: 'FIFO' });
    setEditingId(null);
    setShowAdvanced(false);
  };

  const openEdit = (row: Record<string, unknown>) => {
    setForm({
      name: String(row.name ?? ''), code: String(row.code ?? ''), type: String(row.type ?? 'Finished Goods'),
      description: String(row.description ?? ''), parentId: String(row.parentId ?? ''), status: String(row.status ?? 'Active'),
      defaultTaxRate: String(row.defaultTaxRate ?? ''), defaultUnitType: String(row.defaultUnitType ?? ''), stockPolicy: String(row.stockPolicy ?? 'FIFO'),
    });
    setEditingId(String(row.id));
    setView('form');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, defaultTaxRate: Number(form.defaultTaxRate || 0) };
    const result = editingId ? updateCategory(appState, editingId, payload) : createCategory(appState, payload);
    if (!result.ok) { window.alert('error' in result ? result.error : 'Save failed'); return; }
    saveAppState();
    setView('main');
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this category?')) return;
    deleteCategory(appState, id);
    saveAppState();
  };

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    { key: 'name', label: 'Category', render: (cat) => <span className="font-bold text-slate-800">{String(cat.name)}</span> },
    { key: 'code', label: 'Code', render: (cat) => String(cat.code ?? '—') },
    { key: 'type', label: 'Type', render: (cat) => String(cat.type ?? '—') },
    { key: 'parent', label: 'Parent', render: (cat) => String(cat.parentCategoryName) },
    { key: 'productCount', label: 'Products', render: (cat) => Number(cat.productCount ?? 0) },
    { key: 'totalStockValue', label: 'Stock Value', render: (cat) => formatMoney(Number(cat.totalStockValue ?? 0)) },
    { key: 'stockPolicy', label: 'Policy', render: (cat) => String(cat.stockPolicy ?? 'FIFO') },
    { key: 'status', label: 'Status', render: (cat) => <StatusBadge status={String(cat.status ?? 'Active')} /> },
  ], []);

  if (view === 'form') {
    return (
      <InventoryFormLayout title={editingId ? 'Edit Category' : 'Create Category'} subtitle="Organize products with hierarchy, tax defaults, and stock policies." onBack={() => { setView('main'); resetForm(); }} onSubmit={handleSubmit} submitLabel="Save Category">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="text-xs font-semibold text-slate-600">Category Name *</label><input required className={INPUT_CLS} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="text-xs font-semibold text-slate-600">Code</label><input className={INPUT_CLS} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
          <div><label className="text-xs font-semibold text-slate-600">Product Type</label><select className={SELECT_CLS} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
          <div><label className="text-xs font-semibold text-slate-600">Status</label><select className={SELECT_CLS} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
          <div className="md:col-span-2"><label className="text-xs font-semibold text-slate-600">Description</label><textarea className={INPUT_CLS} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
        <AdvancedDetailsToggle open={showAdvanced} onToggle={() => setShowAdvanced(!showAdvanced)} />
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div><label className="text-xs font-semibold text-slate-600">Parent Category</label><select className={SELECT_CLS} value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}><option value="">None</option>{categories.filter((c) => String(c.id) !== editingId).map((c) => <option key={String(c.id)} value={String(c.id)}>{String(c.name)}</option>)}</select></div>
            <div><label className="text-xs font-semibold text-slate-600">Default Tax Rate (%)</label><input type="number" className={INPUT_CLS} value={form.defaultTaxRate} onChange={(e) => setForm({ ...form, defaultTaxRate: e.target.value })} /></div>
            <div><label className="text-xs font-semibold text-slate-600">Default Unit Type</label><input className={INPUT_CLS} value={form.defaultUnitType} onChange={(e) => setForm({ ...form, defaultUnitType: e.target.value })} placeholder="kg, pcs, etc." /></div>
            <div><label className="text-xs font-semibold text-slate-600">Stock Policy</label><select className={SELECT_CLS} value={form.stockPolicy} onChange={(e) => setForm({ ...form, stockPolicy: e.target.value })}><option value="FIFO">FIFO</option><option value="FEFO">FEFO</option><option value="LIFO">LIFO</option></select></div>
          </div>
        )}
      </InventoryFormLayout>
    );
  }

  return (
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
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search categories..." />
          <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter}><option value="all">All</option><option value="Active">Active</option><option value="Inactive">Inactive</option></FilterSelect>
          <FilterSelect label="Type" value={typeFilter} onChange={setTypeFilter}><option value="all">All Types</option>{PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</FilterSelect>
        </FilterBar>
      }
    >
      <AppTable
        columns={columns}
        rows={filtered}
        emptyMessage="No categories found."
        renderActions={(cat) => (
          <>
            <TableIconAction variant="edit" onClick={() => openEdit(cat)} />
            <TableIconAction variant="delete" onClick={() => handleDelete(String(cat.id))} />
          </>
        )}
      />
    </InventoryListLayout>
  );
}
