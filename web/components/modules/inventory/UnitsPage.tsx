'use client';

import { toast, confirmAction } from '@/lib/ui/feedback';

import { useMemo, useState } from 'react';
import { AppFormFields, AppFormModal } from '@/components/shared/AppForm';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
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
  mapApiUnitRow,
  mapUnitPayloadToApi,
} from '@/lib/services/inventory-api-mappers';
import {
  getUnitMetrics,
  countProductsUsingUnit,
  createUnit,
  updateUnit,
  deleteUnit,
  sortInventoryRowsNewestFirst,
} from '@/lib/services/inventory-service';

const UNIT_FIELDS: PortField[] = [
  { key: 'name', label: 'Unit Name', required: true },
  { key: 'code', label: 'Code', required: true },
  { key: 'symbol', label: 'Symbol' },
  { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
  { key: 'description', label: 'Description', type: 'textarea', advanced: true },
  { key: 'baseUnit', label: 'Base Unit (for conversion)', advanced: true, placeholder: 'e.g. kg' },
  { key: 'conversionFactor', label: 'Conversion Factor', type: 'number', advanced: true, placeholder: '1.0' },
];

export function UnitsPage() {
  const { canEdit, guardEdit } = useInventoryEditAccess();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const apiMode = isModuleApiMode('units');
  const apiStore = usePaginatedApiResource('units', mapApiUnitRow, { pageSize: 10 });
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
    name: '', code: '', symbol: '', status: 'Active', description: '', baseUnit: '', conversionFactor: '',
  });

  const { total, activeUnits, usedUnits, units } = useMemo(() => {
    if (apiMode) {
      const rows = apiStore.rows;
      const active = rows.filter((u) => String(u.status) === 'Active').length;
      const used = rows.filter((u) => countProductsUsingUnit({ inventory: productOptions.rows } as import('@/lib/state/types').AppState, u) > 0).length;
      return { total: apiStore.meta.total, activeUnits: active, usedUnits: used, units: rows };
    }
    return getUnitMetrics(appState);
  }, [apiMode, apiStore.rows, apiStore.meta.total, productOptions.rows, appState]);

  const filtered = useMemo(() => {
    let data = units;
    if (statusFilter !== 'all') data = data.filter((u) => String(u.status) === statusFilter);
    const q = (apiMode ? apiStore.search : localSearch).toLowerCase().trim();
    if (q) {
      data = data.filter((u) => `${u.name} ${u.code} ${u.symbol}`.toLowerCase().includes(q));
    }
    if (!apiMode) return sortInventoryRowsNewestFirst(data);
    return data;
  }, [units, apiMode, apiStore.search, localSearch, statusFilter]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && !guardEdit()) return;
    const payload = { ...form, conversionFactor: Number(form.conversionFactor || 1) };
    if (apiMode) {
      const body = mapUnitPayloadToApi(payload);
      const result = editingId ? await apiStore.update(editingId, body) : await apiStore.create(body);
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Units', description: 'error' in result ? String(result.error) : 'Save failed' });
        return;
      }
      if (!editingId) resetFilters();
      setView('main');
      resetForm();
      return;
    }
    const result = editingId ? updateUnit(appState, editingId, payload) : createUnit(appState, payload);
    if (!result.ok) { toast.error('Operation failed', { module: 'Units', description: 'error' in result ? String(result.error) : 'Save failed' }); return; }
    saveAppState();
    setView('main');
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!guardEdit()) return;
    const __ok = await confirmAction({ title: "Delete this unit", message: "Delete this unit?", confirmLabel: 'Delete', tone: 'danger', module: 'Units' }); if (!__ok) return;
    if (apiMode) {
      const result = await apiStore.remove(id);
      if (!result.ok) toast.error('Delete failed', { module: 'Units', description: result.error });
      return;
    }
    deleteUnit(appState, id);
    saveAppState();
  };

  const countProducts = (unit: Record<string, unknown>) => {
    if (apiMode) return countProductsUsingUnit({ inventory: productOptions.rows } as import('@/lib/state/types').AppState, unit);
    return countProductsUsingUnit(appState, unit);
  };

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    { key: 'name', label: 'Unit Name', render: (unit) => <span className="font-bold text-slate-800">{String(unit.name)}</span> },
    { key: 'code', label: 'Code', render: (unit) => String(unit.code) },
    { key: 'symbol', label: 'Symbol', render: (unit) => String(unit.symbol ?? unit.code) },
    { key: 'baseUnit', label: 'Base Unit', render: (unit) => String(unit.baseUnit || '—') },
    { key: 'conversionFactor', label: 'Conversion', render: (unit) => (unit.conversionFactor ? String(unit.conversionFactor) : '1') },
    { key: 'productsUsing', label: 'Products Using', render: (unit) => countProducts(unit) },
    { key: 'description', label: 'Description', className: 'max-w-[160px] truncate', render: (unit) => String(unit.description || '—') },
    { key: 'status', label: 'Status', render: (unit) => <StatusBadge status={String(unit.status ?? 'Active')} /> },
  ], [countProducts]);

  return (
    <>
    {apiMode && <ApiModeBanner module="units" error={apiStore.error} />}
    <InventoryListLayout
      title="Units of Measure"
      subtitle="Manage units used across products and inventory transactions."
      addLabel="Add Unit"
      onAdd={() => { resetForm(); setView('form'); }}
      kpis={[
        { key: 'total', label: 'Total Units', value: String(total) },
        { key: 'active', label: 'Active Units', value: String(activeUnits) },
        { key: 'used', label: 'In Use by Products', value: String(usedUnits) },
        { key: 'unused', label: 'Unused Units', value: String(Math.max(0, total - usedUnits)) },
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
          searchPlaceholder="Search units..."
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
        emptyMessage={apiListEmptyMessage(apiStore.loading, apiStore.initialized, 'units', { totalCount: units.length, filteredCount: filtered.length })}
        renderActions={(unit) => (
          <InventoryEditActions canEdit={canEdit}>
            <TableIconAction variant="edit" onClick={() => { if (!guardEdit()) return; openEdit(unit); }} />
            <TableIconAction variant="delete" onClick={() => handleDelete(String(unit.id))} />
          </InventoryEditActions>
        )}
      />
    </InventoryListLayout>
    <AppFormModal
      open={view === 'form'}
      onClose={() => { setView('main'); resetForm(); }}
      title={editingId ? 'Edit Unit' : 'Create Unit'}
      subtitle="Define measurement units and conversion rules."
      onSubmit={handleSubmit}
      submitLabel="Save Unit"
      size="md"
    >
      <AppFormFields
        fields={UNIT_FIELDS}
        values={form}
        onChange={(key, value) => setForm({ ...form, [key]: value })}
        showAdvanced={showAdvanced}
        onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
      />
    </AppFormModal>
    </>
  );
}
