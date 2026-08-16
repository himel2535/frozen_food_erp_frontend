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
import { InventoryListLayout, FilterBar, FilterSelect, InventoryEditActions } from '@/components/modules/inventory/shared/inventory-ui';
import { useInventoryEditAccess } from '@/hooks/use-inventory-edit-access';
import { useAppStore } from '@/lib/state/app-store';
import type { PortField } from '@/lib/modules/port-types';
import { isModuleApiMode } from '@/lib/config/data-source';
import { useApiResourceStore } from '@/hooks/use-api-resource-store';
import { usePaginatedApiResource } from '@/hooks/use-paginated-api-resource';
import { ListPagination } from '@/components/shared/ListPagination';
import { mapApiProductRow } from '@/lib/services/entity-api-mappers';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { isModuleBootLoading } from '@/lib/ui/kpi-loading';
import { apiListEmptyMessage } from '@/lib/services/api-list-ui';
import {
  mapApiWarehouseRow,
  mapWarehousePayloadToApi,
} from '@/lib/services/inventory-api-mappers';
import {
  getWarehouseMetrics,
  getWarehouseDerivedStats,
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
  const { canEdit, guardEdit } = useInventoryEditAccess();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const apiMode = isModuleApiMode('warehouses');
  const apiStore = usePaginatedApiResource('warehouses', mapApiWarehouseRow, { pageSize: 10 });
  const productOptions = useApiResourceStore('products', mapApiProductRow, { pageOnly: true, lookupLimit: 100 });
  const bootLoading = isModuleBootLoading(apiMode, apiStore.initialized);
  const [view, setView] = useState<'main' | 'form'>('main');
  const [localSearch, setLocalSearch] = useState('');
  const [localPage, setLocalPage] = useState(1);
  const [localPageSize, setLocalPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({
    name: '', location: '', capacity: '', type: 'Main Warehouse', manager: '', contact: '', status: 'Active',
    allowedProductTypes: '', storageRules: '', imageUrl: '',
  });

  const metrics = useMemo(() => {
    if (apiMode) {
      const warehouses: Record<string, unknown>[] = apiStore.rows.map((wh) => {
        const derived = getWarehouseDerivedStats(
          { inventory: productOptions.rows } as import('@/lib/state/types').AppState,
          String(wh.id),
        );
        const capacity = Number(wh.capacity ?? 0);
        const utilizationPercent = capacity > 0 ? (derived.currentStock / capacity) * 100 : 0;
        return { ...wh, ...derived, utilizationPercent };
      });
      const totalCapacity = warehouses.reduce((s, w) => s + Number(w.capacity ?? 0), 0);
      const totalCurrentStock = warehouses.reduce((s, w) => s + Number(w.currentStock ?? 0), 0);
      const activeWarehouses = warehouses.filter((w) => String(w.status) === 'Active').length;
      const inactiveWarehouses = warehouses.length - activeWarehouses;
      const utilizationPercent = totalCapacity > 0 ? (totalCurrentStock / totalCapacity) * 100 : 0;
      const totalStockValue = warehouses.reduce((s, w) => s + Number(w.stockValueStored ?? 0), 0);
      return { warehouses, totalCount: apiStore.meta.total, totalCapacity, totalCurrentStock, activeWarehouses, inactiveWarehouses, utilizationPercent, totalStockValue };
    }
    const local = getWarehouseMetrics(appState);
    return { ...local, totalCount: local.warehouses.length };
  }, [apiMode, apiStore.rows, apiStore.meta.total, productOptions.rows, appState]);

  const filtered = useMemo(() => {
    let data = metrics.warehouses;
    if (statusFilter !== 'all') data = data.filter((w) => String(w.status) === statusFilter);
    const q = apiMode ? '' : localSearch.toLowerCase().trim();
    if (q) {
      data = data.filter((w) => `${w.name} ${w.location} ${w.manager}`.toLowerCase().includes(q));
    }
    if (!apiMode) return sortInventoryRowsNewestFirst(data);
    return data;
  }, [metrics.warehouses, apiMode, apiStore.search, localSearch, statusFilter]);

  const pageSize = apiMode ? apiStore.pageSize : localPageSize;
  const displayRows = apiMode
    ? filtered
    : filtered.slice((localPage - 1) * pageSize, localPage * pageSize);
  const listTotal = apiMode ? apiStore.meta.total : filtered.length;
  const listPage = apiMode ? apiStore.page : localPage;

  const onPageChange = (p: number) => {
    if (apiMode) apiStore.setPage(p);
    else setLocalPage(p);
  };

  const resetFilters = () => {
    if (apiMode) apiStore.setSearchTerm('');
    else setLocalSearch('');
    setStatusFilter('all');
    onPageChange(1);
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && !guardEdit()) return;
    const payload = { ...form, capacity: Number(form.capacity || 0) };
    if (apiMode) {
      const body = mapWarehousePayloadToApi(payload);
      const result = editingId ? await apiStore.update(editingId, body) : await apiStore.create(body);
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Warehouses', description: 'error' in result ? String(result.error) : 'Save failed' });
        return;
      }
      if (!editingId) resetFilters();
      setView('main');
      resetForm();
      return;
    }
    const result = editingId ? updateWarehouse(appState, editingId, payload) : createWarehouse(appState, payload);
    if (!result.ok) { toast.error('Operation failed', { module: 'Warehouses', description: 'error' in result ? String(result.error) : 'Save failed' }); return; }
    saveAppState();
    setView('main');
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!guardEdit()) return;
    const __ok = await confirmAction({ title: "Delete this warehouse", message: "Delete this warehouse?", confirmLabel: 'Delete', tone: 'danger', module: 'Warehouses' }); if (!__ok) return;
    if (apiMode) {
      const result = await apiStore.remove(id);
      if (!result.ok) toast.error('Delete failed', { module: 'Warehouses', description: result.error });
      return;
    }
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
    {apiMode && <ApiModeBanner module="warehouses" error={apiStore.error} />}
    <InventoryListLayout
      title="Warehouses"
      subtitle="Manage warehouse facilities, capacity, and utilization."
      addLabel="Add Warehouse"
      onAdd={() => { resetForm(); setView('form'); }}
      kpis={[
        { key: 'total', label: 'Total Warehouses', value: String(metrics.totalCount), sub: `${metrics.activeWarehouses} active · ${metrics.inactiveWarehouses} inactive` },
        { key: 'capacity', label: 'Total Stock Capacity', value: metrics.totalCapacity.toLocaleString(), sub: 'units across all facilities' },
        { key: 'util', label: 'Current Stock Utilization', value: `${metrics.utilizationPercent.toFixed(1)}%`, sub: `${metrics.totalCurrentStock.toLocaleString()} units stored` },
        { key: 'value', label: 'Total Stock Value', value: formatMoney(metrics.totalStockValue), sub: 'across all warehouses' },
      ]}
      bootLoading={bootLoading}
      filters={
        <FilterBar
          search={apiMode ? apiStore.search : localSearch}
          onSearchChange={(v) => {
            if (apiMode) apiStore.setSearchTerm(v);
            else setLocalSearch(v);
            onPageChange(1);
          }}
          searchPlaceholder="Search warehouses..."
        >
          <FilterSelect label="Status" value={statusFilter} onChange={(v) => { setStatusFilter(v); onPageChange(1); }}><option value="all">All</option><option value="Active">Active</option><option value="Inactive">Inactive</option></FilterSelect>
        </FilterBar>
      }
      pagination={
        <ListPagination page={listPage} pageSize={pageSize} total={listTotal} onPageChange={onPageChange} />
      }
    >
      <AppTable
        columns={columns}
        rows={displayRows}
        loading={bootLoading}
        emptyMessage={apiListEmptyMessage(apiStore.loading, apiStore.initialized, 'warehouses', { totalCount: metrics.warehouses.length, filteredCount: filtered.length })}
        renderActions={(wh) => (
          <InventoryEditActions canEdit={canEdit}>
            <TableIconAction variant="edit" onClick={() => { if (!guardEdit()) return; openEdit(wh); }} />
            <TableIconAction variant="delete" onClick={() => handleDelete(String(wh.id))} />
          </InventoryEditActions>
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
