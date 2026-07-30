'use client';

import { useMemo, useState } from 'react';
import { AppFormFields, AppFormModal, FORM_GRID_CLS, FORM_LABEL_CLS } from '@/components/shared/AppForm';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { InventoryListLayout, FilterBar, SearchInput, PaginationBar } from '@/components/modules/inventory/shared/inventory-ui';
import { SupplierSelect } from '@/components/modules/inventory/shared/selects';
import { useAppStore } from '@/lib/state/app-store';
import type { PortField } from '@/lib/modules/port-types';
import { listSuppliers } from '@/lib/services/purchases-service';
import {
  listRawMaterials,
  getRawMaterialMetrics,
  createRawMaterial,
  updateRawMaterial,
  formatMoney,
} from '@/lib/services/inventory-service';

const PAGE_SIZE = 15;

const RAW_MATERIAL_BASIC_FIELDS: PortField[] = [
  { key: 'name', label: 'Material Name', required: true },
  { key: 'category', label: 'Category' },
  { key: 'unit', label: 'Unit', required: true },
  { key: 'quantity', label: 'Quantity', type: 'number', required: true },
  { key: 'price', label: 'Unit Price (BDT)', type: 'number', required: true },
  { key: 'threshold', label: 'Low Stock Threshold', type: 'number' },
];

const RAW_MATERIAL_ADVANCED_FIELDS: PortField[] = [
  { key: 'supplierPrice', label: 'Supplier Price', type: 'number', advanced: true },
  { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
];

export function RawMaterialsPage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [view, setView] = useState<'main' | 'form'>('main');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({
    name: '', category: '', unit: 'pcs', quantity: '', price: '', supplierId: '', supplierPrice: '', threshold: '0', notes: '',
  });

  const suppliers = useMemo(() => listSuppliers(appState), [appState]);
  const supplierName = (id: string) => String(suppliers.find((s) => String(s.id) === id)?.name ?? 'Unknown');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return listRawMaterials(appState)
      .filter((rm) => {
        const sup = supplierName(String(rm.supplierId ?? '')).toLowerCase();
        return String(rm.name).toLowerCase().includes(q) || sup.includes(q) || String(rm.category ?? '').toLowerCase().includes(q);
      })
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [appState, search, suppliers]);

  const metrics = useMemo(() => getRawMaterialMetrics(appState), [appState]);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const liveTotal = Number(form.quantity || 0) * Number(form.price || 0);

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    {
      key: 'name',
      label: 'Material',
      render: (rm) => {
        const qty = Number(rm.quantity ?? 0);
        const threshold = Number(rm.threshold ?? 100);
        const isLow = qty < threshold;
        return (
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">{String(rm.name)}</span>
            {isLow && <span className="px-1.5 py-0.5 bg-red-50 text-red-500 border border-red-100 rounded text-[9px] font-bold">Low Stock</span>}
          </div>
        );
      },
    },
    { key: 'category', label: 'Category', render: (rm) => String(rm.category || 'Uncategorized') },
    { key: 'unit', label: 'Unit', render: (rm) => String(rm.unit) },
    { key: 'quantity', label: 'Qty', render: (rm) => Number(rm.quantity ?? 0) },
    { key: 'threshold', label: 'Threshold', render: (rm) => Number(rm.threshold ?? 100) },
    { key: 'price', label: 'Price', render: (rm) => Number(rm.price ?? 0).toFixed(2) },
    {
      key: 'totalValue',
      label: 'Total Value',
      render: (rm) => (Number(rm.quantity ?? 0) * Number(rm.price ?? 0)).toFixed(2),
    },
    { key: 'status', label: 'Status', render: () => <StatusBadge status="active" /> },
  ], []);

  const resetForm = () => {
    setForm({ name: '', category: '', unit: 'pcs', quantity: '', price: '', supplierId: '', supplierPrice: '', threshold: '0', notes: '' });
    setEditingId(null);
    setShowAdvanced(false);
  };

  const openEdit = (row: Record<string, unknown>) => {
    setForm({
      name: String(row.name ?? ''), category: String(row.category ?? ''), unit: String(row.unit ?? 'pcs'),
      quantity: String(row.quantity ?? ''), price: String(row.price ?? ''), supplierId: String(row.supplierId ?? ''),
      supplierPrice: String(row.supplierPrice ?? ''), threshold: String(row.threshold ?? 0), notes: String(row.notes ?? ''),
    });
    setEditingId(String(row.id));
    setView('form');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      quantity: Number(form.quantity || 0),
      price: Number(form.price || 0),
      threshold: Number(form.threshold || 0),
      supplierPrice: Number(form.supplierPrice || 0),
    };
    const result = editingId ? updateRawMaterial(appState, editingId, payload) : createRawMaterial(appState, payload);
    if (!result.ok) { window.alert('error' in result ? result.error : 'Save failed'); return; }
    saveAppState();
    setView('main');
    resetForm();
  };

  const materialFields = [...RAW_MATERIAL_BASIC_FIELDS, ...RAW_MATERIAL_ADVANCED_FIELDS];

  return (
    <>
    <InventoryListLayout
      title="Raw Materials"
      subtitle="Manage raw material inventory, suppliers, and stock levels."
      addLabel="Add Raw Material"
      onAdd={() => { resetForm(); setView('form'); }}
      kpis={[
        { key: 'count', label: 'Total Materials', value: String(metrics.count) },
        { key: 'value', label: 'Total Inventory Value', value: formatMoney(metrics.totalValue) },
        { key: 'low', label: 'Low Stock Alerts', value: String(metrics.lowStock), alert: metrics.lowStock > 0 },
      ]}
      filters={<FilterBar><SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search materials, suppliers, categories..." /></FilterBar>}
      pagination={<PaginationBar page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />}
    >
      <AppTable
        className="flex-1"
        columns={columns}
        rows={paged}
        emptyMessage="No raw materials found."
        renderActions={(rm) => <TableIconAction variant="edit" onClick={() => openEdit(rm)} />}
      />
    </InventoryListLayout>
    <AppFormModal
      open={view === 'form'}
      onClose={() => { setView('main'); resetForm(); }}
      title={editingId ? 'Edit Raw Material' : 'Add Raw Material'}
      subtitle="Track raw material stock, pricing, and supplier links."
      onSubmit={handleSubmit}
      submitLabel="Save Material"
      size="lg"
    >
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
        <div className="md:col-span-2 bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-4">
          <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Live Total Value</span>
          <p className="text-lg font-bold text-emerald-700 mt-1">{liveTotal.toFixed(2)} BDT</p>
        </div>
      </div>
    </AppFormModal>
    </>
  );
}
