'use client';

import { useMemo, useState } from 'react';
import { AdvancedDetailsToggle } from '@/components/shared/AdvancedDetailsToggle';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { InventoryFormLayout, InventoryListLayout, FilterBar, FilterSelect, SearchInput, INPUT_CLS, SELECT_CLS } from '@/components/modules/inventory/shared/inventory-ui';
import { useAppStore } from '@/lib/state/app-store';
import {
  getWarehouseMetrics,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  formatMoney,
} from '@/lib/services/inventory-service';

export function WarehousesPage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [view, setView] = useState<'main' | 'form'>('main');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({
    name: '', location: '', capacity: '', type: 'Main Warehouse', manager: '', contact: '', status: 'Active',
    allowedProductTypes: '', storageRules: '',
  });

  const metrics = useMemo(() => getWarehouseMetrics(appState), [appState]);

  const filtered = useMemo(() => {
    let data = metrics.warehouses;
    if (statusFilter !== 'all') data = data.filter((w) => String(w.status) === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((w) => `${w.name} ${w.location} ${w.manager}`.toLowerCase().includes(q));
    }
    return data;
  }, [metrics.warehouses, search, statusFilter]);

  const resetForm = () => {
    setForm({ name: '', location: '', capacity: '', type: 'Main Warehouse', manager: '', contact: '', status: 'Active', allowedProductTypes: '', storageRules: '' });
    setEditingId(null);
    setShowAdvanced(false);
  };

  const openEdit = (row: Record<string, unknown>) => {
    setForm({
      name: String(row.name ?? ''), location: String(row.location ?? ''), capacity: String(row.capacity ?? ''),
      type: String(row.type ?? 'Main Warehouse'), manager: String(row.manager ?? ''), contact: String(row.contact ?? ''),
      status: String(row.status ?? 'Active'), allowedProductTypes: String(row.allowedProductTypes ?? ''), storageRules: String(row.storageRules ?? ''),
    });
    setEditingId(String(row.id));
    setView('form');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, capacity: Number(form.capacity || 0) };
    const result = editingId ? updateWarehouse(appState, editingId, payload) : createWarehouse(appState, payload);
    if (!result.ok) { window.alert('error' in result ? result.error : 'Save failed'); return; }
    saveAppState();
    setView('main');
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this warehouse?')) return;
    deleteWarehouse(appState, id);
    saveAppState();
  };

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    { key: 'name', label: 'Warehouse', render: (wh) => <span className="font-bold text-slate-800">{String(wh.name)}</span> },
    { key: 'location', label: 'Location', render: (wh) => String(wh.location ?? '—') },
    { key: 'type', label: 'Type', render: (wh) => String(wh.type ?? '—') },
    { key: 'manager', label: 'Manager', render: (wh) => String(wh.manager ?? '—') },
    { key: 'contact', label: 'Contact', render: (wh) => String(wh.contact ?? '—') },
    { key: 'capacity', label: 'Capacity', render: (wh) => Number(wh.capacity ?? 0).toLocaleString() },
    { key: 'currentStock', label: 'Current Stock', render: (wh) => Number(wh.currentStock ?? 0).toLocaleString() },
    { key: 'utilizationPercent', label: 'Utilization', render: (wh) => `${Number(wh.utilizationPercent ?? 0).toFixed(1)}%` },
    { key: 'stockValueStored', label: 'Stock Value', render: (wh) => formatMoney(Number(wh.stockValueStored ?? 0)) },
    { key: 'activeProductsCount', label: 'Products', render: (wh) => Number(wh.activeProductsCount ?? 0) },
    { key: 'status', label: 'Status', render: (wh) => <StatusBadge status={String(wh.status ?? 'Active')} /> },
  ], []);

  if (view === 'form') {
    return (
      <InventoryFormLayout title={editingId ? 'Edit Warehouse' : 'Create Warehouse'} subtitle="Configure warehouse locations, capacity, and storage rules." onBack={() => { setView('main'); resetForm(); }} onSubmit={handleSubmit} submitLabel="Save Warehouse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="text-xs font-semibold text-slate-600">Warehouse Name *</label><input required className={INPUT_CLS} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="text-xs font-semibold text-slate-600">Location</label><input className={INPUT_CLS} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          <div><label className="text-xs font-semibold text-slate-600">Capacity (units)</label><input type="number" min={0} className={INPUT_CLS} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
          <div><label className="text-xs font-semibold text-slate-600">Type</label><select className={SELECT_CLS} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option>Main Warehouse</option><option>Regional Warehouse</option><option>Retail Storage</option><option>Production WH</option></select></div>
          <div><label className="text-xs font-semibold text-slate-600">Manager</label><input className={INPUT_CLS} value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} /></div>
          <div><label className="text-xs font-semibold text-slate-600">Contact</label><input className={INPUT_CLS} value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></div>
          <div><label className="text-xs font-semibold text-slate-600">Status</label><select className={SELECT_CLS} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
        </div>
        <AdvancedDetailsToggle open={showAdvanced} onToggle={() => setShowAdvanced(!showAdvanced)} />
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div><label className="text-xs font-semibold text-slate-600">Allowed Product Types</label><input className={INPUT_CLS} value={form.allowedProductTypes} onChange={(e) => setForm({ ...form, allowedProductTypes: e.target.value })} /></div>
            <div><label className="text-xs font-semibold text-slate-600">Storage Rules</label><input className={INPUT_CLS} value={form.storageRules} onChange={(e) => setForm({ ...form, storageRules: e.target.value })} /></div>
          </div>
        )}
      </InventoryFormLayout>
    );
  }

  return (
    <InventoryListLayout
      title="Warehouses"
      subtitle="Manage warehouse facilities, capacity, and utilization."
      addLabel="Add Warehouse"
      onAdd={() => { resetForm(); setView('form'); }}
      kpis={[
        { key: 'total', label: 'Total Warehouses', value: String(metrics.warehouses.length), sub: `${metrics.activeWarehouses} active · ${metrics.inactiveWarehouses} inactive` },
        { key: 'capacity', label: 'Total Stock Capacity', value: metrics.totalCapacity.toLocaleString(), sub: 'units across all facilities' },
        { key: 'util', label: 'Current Stock Utilization', value: `${metrics.utilizationPercent.toFixed(1)}%`, sub: `${metrics.totalCurrentStock.toLocaleString()} units stored` },
      ]}
      filters={
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search warehouses..." />
          <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter}><option value="all">All</option><option value="Active">Active</option><option value="Inactive">Inactive</option></FilterSelect>
        </FilterBar>
      }
    >
      <AppTable
        columns={columns}
        rows={filtered}
        emptyMessage="No warehouses found."
        renderActions={(wh) => (
          <>
            <TableIconAction variant="edit" onClick={() => openEdit(wh)} />
            <TableIconAction variant="delete" onClick={() => handleDelete(String(wh.id))} />
          </>
        )}
      />
    </InventoryListLayout>
  );
}
