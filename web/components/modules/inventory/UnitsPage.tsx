'use client';

import { useMemo, useState } from 'react';
import { AppFormFields, AppFormModal } from '@/components/shared/AppForm';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { InventoryListLayout, FilterBar, FilterSelect, SearchInput } from '@/components/modules/inventory/shared/inventory-ui';
import { useAppStore } from '@/lib/state/app-store';
import type { PortField } from '@/lib/modules/port-types';
import {
  getUnitMetrics,
  countProductsUsingUnit,
  createUnit,
  updateUnit,
  deleteUnit,
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

  return (
    <>
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
