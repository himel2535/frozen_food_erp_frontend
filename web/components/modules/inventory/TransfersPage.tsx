'use client';

import { toast } from '@/lib/ui/feedback';

import { useMemo, useState } from 'react';
import { AppFormModal, FORM_GRID_CLS, FORM_INPUT_CLS, FORM_LABEL_CLS, FORM_SELECT_CLS } from '@/components/shared/AppForm';
import { DateInput } from '@/components/shared/DateInput';
import { AdvancedDetailsToggle } from '@/components/shared/AdvancedDetailsToggle';
import { ProductSelect, WarehouseSelect } from '@/components/modules/inventory/shared/selects';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { InventoryListLayout, FilterBar, FilterSelect, SearchInput } from '@/components/modules/inventory/shared/inventory-ui';
import { useAppStore } from '@/lib/state/app-store';
import {
  listTransferRecords,
  getTransferMetrics,
  createTransfer,
  completeTransfer,
  getWarehouseName,
  listInventory,
} from '@/lib/services/inventory-service';

export function TransfersPage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [view, setView] = useState<'main' | 'form'>('main');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({
    productId: '', fromWarehouseId: '', toWarehouseId: '', qty: '', date: new Date().toISOString().slice(0, 10), status: 'Pending', notes: '',
  });

  const records = useMemo(() => listTransferRecords(appState), [appState]);
  const metrics = useMemo(() => getTransferMetrics(appState), [appState]);
  const products = useMemo(() => listInventory(appState), [appState]);
  const productName = (id: unknown) => products.find((p) => String(p.id) === String(id))?.name ?? String(id);

  const filtered = useMemo(() => {
    let data = records;
    if (statusFilter !== 'all') data = data.filter((r) => String(r.status) === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((r) => String(r.id).toLowerCase().includes(q));
    }
    return data;
  }, [records, search, statusFilter]);

  const resetForm = () => {
    setForm({ productId: '', fromWarehouseId: '', toWarehouseId: '', qty: '', date: new Date().toISOString().slice(0, 10), status: 'Pending', notes: '' });
    setShowAdvanced(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = createTransfer(appState, { ...form, qty: Number(form.qty || 0) });
    if (!result.ok) { toast.error('Operation failed', { module: 'Stock Transfers', description: 'error' in result ? String(result.error) : 'Save failed' }); return; }
    saveAppState();
    setView('main');
    resetForm();
  };

  const handleComplete = (id: string) => {
    const result = completeTransfer(appState, id);
    if (!result.ok) { toast.error('Operation failed', { module: 'Stock Transfers', description: 'error' in result ? String(result.error) : 'Complete failed' }); return; }
    saveAppState();
  };

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    { key: 'id', label: 'ID', render: (row) => <span className="font-mono text-slate-600">{String(row.id)}</span> },
    { key: 'product', label: 'Product', render: (row) => <span className="font-bold text-slate-800">{String(productName(row.productId))}</span> },
    { key: 'from', label: 'From', render: (row) => getWarehouseName(appState, String(row.fromWarehouseId ?? row.fromWh)) },
    { key: 'to', label: 'To', render: (row) => getWarehouseName(appState, String(row.toWarehouseId ?? row.toWh)) },
    { key: 'qty', label: 'Qty', render: (row) => Number(row.qty ?? 0) },
    { key: 'date', label: 'Date', render: (row) => String(row.date ?? '—') },
    { key: 'notes', label: 'Notes', className: 'max-w-[120px] truncate', render: (row) => String(row.notes ?? '—') },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={String(row.status ?? 'Pending')} /> },
    { key: 'created', label: 'Created', render: (row) => String(row.date ?? '—') },
  ], [appState, products]);

  return (
    <>
    <InventoryListLayout
      title="Stock Transfers"
      subtitle="Move inventory between warehouse locations."
      addLabel="Create Transfer"
      onAdd={() => { resetForm(); setView('form'); }}
      kpis={[
        { key: 'total', label: 'Total Transfers', value: String(metrics.total) },
        { key: 'pending', label: 'Pending', value: String(metrics.pending), alert: metrics.pending > 0 },
        { key: 'completed', label: 'Completed', value: String(metrics.completed) },
        { key: 'qty', label: 'Total Qty Moved', value: String(metrics.totalQty) },
      ]}
      filters={
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search transfers..." />
          <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter}><option value="all">All</option><option value="Pending">Pending</option><option value="Completed">Completed</option></FilterSelect>
        </FilterBar>
      }
    >
      <AppTable
        columns={columns}
        rows={filtered}
        emptyMessage="No transfer records found."
        renderActions={(row) => (
          String(row.status) === 'Pending' ? (
            <TableIconAction variant="approve" label="Complete" onClick={() => handleComplete(String(row.id))} />
          ) : null
        )}
      />
    </InventoryListLayout>
    <AppFormModal
      open={view === 'form'}
      onClose={() => { setView('main'); resetForm(); }}
      title="Create Transfer"
      subtitle="Move stock between warehouses with from/to tracking."
      onSubmit={handleSubmit}
      submitLabel="Save Transfer"
      size="lg"
    >
      <div className={FORM_GRID_CLS}>
        <div><label className={FORM_LABEL_CLS}>Product *</label><ProductSelect state={appState} value={form.productId} onChange={(v) => setForm({ ...form, productId: v })} required /></div>
        <div><label className={FORM_LABEL_CLS}>Quantity *</label><input required type="number" min={1} className={FORM_INPUT_CLS} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></div>
        <div><label className={FORM_LABEL_CLS}>From Warehouse *</label><WarehouseSelect state={appState} value={form.fromWarehouseId} onChange={(v) => setForm({ ...form, fromWarehouseId: v })} required /></div>
        <div><label className={FORM_LABEL_CLS}>To Warehouse *</label><WarehouseSelect state={appState} value={form.toWarehouseId} onChange={(v) => setForm({ ...form, toWarehouseId: v })} required /></div>
        <div><label className={FORM_LABEL_CLS}>Date</label><DateInput className={`${FORM_INPUT_CLS} cursor-pointer`} value={form.date} onChange={(v) => setForm({ ...form, date: v })} /></div>
      </div>
      <AdvancedDetailsToggle open={showAdvanced} onToggle={() => setShowAdvanced(!showAdvanced)} />
      {showAdvanced && (
        <div className={`${FORM_GRID_CLS} pt-4 border-t border-slate-100/80`}>
          <div><label className={FORM_LABEL_CLS}>Status</label><select className={FORM_SELECT_CLS} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="Pending">Pending</option><option value="Completed">Completed</option></select></div>
          <div className="md:col-span-2"><label className={FORM_LABEL_CLS}>Notes</label><textarea className={FORM_INPUT_CLS} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
      )}
    </AppFormModal>
    </>
  );
}
