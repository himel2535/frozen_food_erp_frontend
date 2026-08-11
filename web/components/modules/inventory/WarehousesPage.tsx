'use client';

import { toast, confirmAction } from '@/lib/ui/feedback';

import { useMemo, useState } from 'react';
import { Warehouse } from 'lucide-react';
import { AppFormFields, AppFormModal } from '@/components/shared/AppForm';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { ImageUploadField } from '@/components/shared/ImageUploadField';
import { InventoryItemThumb } from '@/components/shared/InventoryItemThumb';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { InventoryListLayout, FilterBar, FilterSelect } from '@/components/modules/inventory/shared/inventory-ui';
import { useAppStore } from '@/lib/state/app-store';
import type { PortField } from '@/lib/modules/port-types';
import {
  getWarehouseMetrics,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  formatMoney,
  sortInventoryRowsNewestFirst,
} from '@/lib/services/inventory-service';

const WAREHOUSE_FIELDS: PortField[] = [
  { key: 'name', label: 'Warehouse Name', required: true },
  { key: 'location', label: 'Location' },
  { key: 'capacity', label: 'Capacity (units)', type: 'number' },
  { key: 'type', label: 'Type', type: 'select', options: ['Main Warehouse', 'Regional Warehouse', 'Retail Storage', 'Production WH'] },
  { key: 'manager', label: 'Manager' },
  { key: 'contact', label: 'Contact' },
  { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
  { key: 'allowedProductTypes', label: 'Allowed Product Types', advanced: true },
  { key: 'storageRules', label: 'Storage Rules', advanced: true },
];

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
    allowedProductTypes: '', storageRules: '', imageUrl: '',
  });

  const metrics = useMemo(() => getWarehouseMetrics(appState), [appState]);

  const filtered = useMemo(() => {
    let data = metrics.warehouses;
    if (statusFilter !== 'all') data = data.filter((w) => String(w.status) === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((w) => `${w.name} ${w.location} ${w.manager}`.toLowerCase().includes(q));
    }
    return sortInventoryRowsNewestFirst(data);
  }, [metrics.warehouses, search, statusFilter]);

  const resetForm = () => {
    setForm({ name: '', location: '', capacity: '', type: 'Main Warehouse', manager: '', contact: '', status: 'Active', allowedProductTypes: '', storageRules: '', imageUrl: '' });
    setEditingId(null);
    setShowAdvanced(false);
  };

  const openEdit = (row: Record<string, unknown>) => {
    setForm({
      name: String(row.name ?? ''), location: String(row.location ?? ''), capacity: String(row.capacity ?? ''),
      type: String(row.type ?? 'Main Warehouse'), manager: String(row.manager ?? ''), contact: String(row.contact ?? ''),
      status: String(row.status ?? 'Active'), allowedProductTypes: String(row.allowedProductTypes ?? ''), storageRules: String(row.storageRules ?? ''),
      imageUrl: String(row.imageUrl ?? ''),
    });
    setEditingId(String(row.id));
    setView('form');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, capacity: Number(form.capacity || 0) };
    const result = editingId ? updateWarehouse(appState, editingId, payload) : createWarehouse(appState, payload);
    if (!result.ok) { toast.error('Operation failed', { module: 'Warehouses', description: 'error' in result ? String(result.error) : 'Save failed' }); return; }
    saveAppState();
    setView('main');
    resetForm();
  };

  const handleDelete = async (id: string) => {
    const __ok = await confirmAction({ title: "Delete this warehouse", message: "Delete this warehouse?", confirmLabel: 'Delete', tone: 'danger', module: 'Warehouses' }); if (!__ok) return;
    deleteWarehouse(appState, id);
    saveAppState();
  };

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    {
      key: 'name',
      label: 'Warehouse',
      render: (wh) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <InventoryItemThumb
            imageUrl={String(wh.imageUrl ?? '')}
            alt={String(wh.name ?? '')}
            fallback={(
              <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 text-slate-500">
                <Warehouse className="w-4 h-4" />
              </span>
            )}
          />
          <span className="font-bold text-slate-800 truncate">{String(wh.name)}</span>
        </div>
      ),
    },
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

  return (
    <>
    <InventoryListLayout
      title="Warehouses"
      subtitle="Manage warehouse facilities, capacity, and utilization."
      addLabel="Add Warehouse"
      onAdd={() => { resetForm(); setView('form'); }}
      kpis={[
        { key: 'total', label: 'Total Warehouses', value: String(metrics.warehouses.length), sub: `${metrics.activeWarehouses} active · ${metrics.inactiveWarehouses} inactive` },
        { key: 'capacity', label: 'Total Stock Capacity', value: metrics.totalCapacity.toLocaleString(), sub: 'units across all facilities' },
        { key: 'util', label: 'Current Stock Utilization', value: `${metrics.utilizationPercent.toFixed(1)}%`, sub: `${metrics.totalCurrentStock.toLocaleString()} units stored` },
        { key: 'value', label: 'Total Stock Value', value: formatMoney(metrics.totalStockValue), sub: 'across all warehouses' },
      ]}
      filters={
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search warehouses..."
        >
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
    <AppFormModal
      open={view === 'form'}
      onClose={() => { setView('main'); resetForm(); }}
      title={editingId ? 'Edit Warehouse' : 'Create Warehouse'}
      subtitle="Configure warehouse locations, capacity, and storage rules."
      onSubmit={handleSubmit}
      submitLabel="Save Warehouse"
      size="md"
    >
      <div className="mb-5">
        <ImageUploadField
          label="Warehouse Photo"
          value={form.imageUrl}
          onChange={(url) => setForm({ ...form, imageUrl: url })}
        />
      </div>
      <AppFormFields
        fields={WAREHOUSE_FIELDS}
        values={form}
        onChange={(key, value) => setForm({ ...form, [key]: value })}
        showAdvanced={showAdvanced}
        onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
      />
    </AppFormModal>
    </>
  );
}
