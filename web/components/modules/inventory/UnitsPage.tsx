'use client';

import { useMemo, useState } from 'react';
import { AdvancedDetailsToggle } from '@/components/shared/AdvancedDetailsToggle';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { InventoryFormLayout, InventoryListLayout, FilterBar, FilterSelect, SearchInput, INPUT_CLS, SELECT_CLS } from '@/components/modules/inventory/shared/inventory-ui';
import { useAppStore } from '@/lib/state/app-store';
import {
  getUnitMetrics,
  countProductsUsingUnit,
  createUnit,
  updateUnit,
  deleteUnit,
} from '@/lib/services/inventory-service';

export function UnitsPage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [view, setView] = useState<'main' | 'form'>('main');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({
    name: '', code: '', symbol: '', status: 'Active', description: '', baseUnit: '', conversionFactor: '',
  });

  const { total, activeUnits, usedUnits, units } = useMemo(() => getUnitMetrics(appState), [appState]);

  const filtered = useMemo(() => {
    let data = units;
    if (statusFilter !== 'all') data = data.filter((u) => String(u.status) === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((u) => `${u.name} ${u.code} ${u.symbol}`.toLowerCase().includes(q));
    }
    return data;
  }, [units, search, statusFilter]);

  const resetForm = () => {
    setForm({ name: '', code: '', symbol: '', status: 'Active', description: '', baseUnit: '', conversionFactor: '' });
    setEditingId(null);
    setShowAdvanced(false);
  };

  const openEdit = (row: Record<string, unknown>) => {
    setForm({
      name: String(row.name ?? ''), code: String(row.code ?? ''), symbol: String(row.symbol ?? row.code ?? ''),
      status: String(row.status ?? 'Active'), description: String(row.description ?? ''),
      baseUnit: String(row.baseUnit ?? ''), conversionFactor: String(row.conversionFactor ?? ''),
    });
    setEditingId(String(row.id));
    setView('form');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, conversionFactor: Number(form.conversionFactor || 1) };
    const result = editingId ? updateUnit(appState, editingId, payload) : createUnit(appState, payload);
    if (!result.ok) { window.alert('error' in result ? result.error : 'Save failed'); return; }
    saveAppState();
    setView('main');
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this unit?')) return;
    deleteUnit(appState, id);
    saveAppState();
  };

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    { key: 'name', label: 'Unit Name', render: (unit) => <span className="font-bold text-slate-800">{String(unit.name)}</span> },
    { key: 'code', label: 'Code', render: (unit) => String(unit.code) },
    { key: 'symbol', label: 'Symbol', render: (unit) => String(unit.symbol ?? unit.code) },
    { key: 'baseUnit', label: 'Base Unit', render: (unit) => String(unit.baseUnit || '—') },
    { key: 'conversionFactor', label: 'Conversion', render: (unit) => (unit.conversionFactor ? String(unit.conversionFactor) : '1') },
    { key: 'productsUsing', label: 'Products Using', render: (unit) => countProductsUsingUnit(appState, unit) },
    { key: 'description', label: 'Description', className: 'max-w-[160px] truncate', render: (unit) => String(unit.description || '—') },
    { key: 'status', label: 'Status', render: (unit) => <StatusBadge status={String(unit.status ?? 'Active')} /> },
  ], [appState]);

  if (view === 'form') {
    return (
      <InventoryFormLayout title={editingId ? 'Edit Unit' : 'Create Unit'} subtitle="Define measurement units and conversion rules." onBack={() => { setView('main'); resetForm(); }} onSubmit={handleSubmit} submitLabel="Save Unit">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="text-xs font-semibold text-slate-600">Unit Name *</label><input required className={INPUT_CLS} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="text-xs font-semibold text-slate-600">Code *</label><input required className={INPUT_CLS} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
          <div><label className="text-xs font-semibold text-slate-600">Symbol</label><input className={INPUT_CLS} value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} /></div>
          <div><label className="text-xs font-semibold text-slate-600">Status</label><select className={SELECT_CLS} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
        </div>
        <AdvancedDetailsToggle open={showAdvanced} onToggle={() => setShowAdvanced(!showAdvanced)} />
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div><label className="text-xs font-semibold text-slate-600">Description</label><textarea className={INPUT_CLS} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><label className="text-xs font-semibold text-slate-600">Base Unit (for conversion)</label><input className={INPUT_CLS} value={form.baseUnit} onChange={(e) => setForm({ ...form, baseUnit: e.target.value })} placeholder="e.g. kg" /></div>
            <div><label className="text-xs font-semibold text-slate-600">Conversion Factor</label><input type="number" step="0.0001" className={INPUT_CLS} value={form.conversionFactor} onChange={(e) => setForm({ ...form, conversionFactor: e.target.value })} placeholder="1.0" /></div>
          </div>
        )}
      </InventoryFormLayout>
    );
  }

  return (
    <InventoryListLayout
      title="Units of Measure"
      subtitle="Manage units used across products and inventory transactions."
      addLabel="Add Unit"
      onAdd={() => { resetForm(); setView('form'); }}
      kpis={[
        { key: 'total', label: 'Total Units', value: String(total) },
        { key: 'active', label: 'Active Units', value: String(activeUnits) },
        { key: 'used', label: 'In Use by Products', value: String(usedUnits) },
      ]}
      filters={
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search units..." />
          <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter}><option value="all">All</option><option value="Active">Active</option><option value="Inactive">Inactive</option></FilterSelect>
        </FilterBar>
      }
    >
      <AppTable
        columns={columns}
        rows={filtered}
        emptyMessage="No units found."
        renderActions={(unit) => (
          <>
            <TableIconAction variant="edit" onClick={() => openEdit(unit)} />
            <TableIconAction variant="delete" onClick={() => handleDelete(String(unit.id))} />
          </>
        )}
      />
    </InventoryListLayout>
  );
}
