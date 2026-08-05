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
  listAdjustmentRecords,
  getAdjustmentMetrics,
  createAdjustment,
  approveAdjustment,
  getWarehouseName,
  listInventory,
  formatMoney,
} from '@/lib/services/inventory-service';

export function AdjustmentsPage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [view, setView] = useState<'main' | 'form'>('main');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({
    productId: '', warehouseId: '', type: 'Increase', qty: '', unitValue: '', date: new Date().toISOString().slice(0, 10),
    reason: '', status: 'Pending', approvedBy: '', notes: '',
  });

  const records = useMemo(() => listAdjustmentRecords(appState), [appState]);
  const metrics = useMemo(() => getAdjustmentMetrics(appState), [appState]);
  const products = useMemo(() => listInventory(appState), [appState]);
  const productName = (id: unknown) => products.find((p) => String(p.id) === String(id))?.name ?? String(id);

  const filtered = useMemo(() => {
    let data = records;
    if (statusFilter !== 'all') data = data.filter((r) => String(r.status) === statusFilter);
    if (typeFilter !== 'all') data = data.filter((r) => String(r.type) === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((r) => `${r.id} ${r.reason}`.toLowerCase().includes(q));
    }
    return data;
  }, [records, search, statusFilter, typeFilter]);

  const netPrefix = metrics.netValue > 0 ? '+' : '';

  const resetForm = () => {
    setForm({
      productId: '', warehouseId: '', type: 'Increase', qty: '', unitValue: '', date: new Date().toISOString().slice(0, 10),
      reason: '', status: 'Pending', approvedBy: '', notes: '',
    });
    setShowAdvanced(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = createAdjustment(appState, {
      ...form, qty: Number(form.qty || 0), unitValue: Number(form.unitValue || 0),
    });
    if (!result.ok) { toast.error('Operation failed', { module: 'Stock Correction', description: 'error' in result ? String(result.error) : 'Save failed' }); return; }
    saveAppState();
    setView('main');
    resetForm();
  };

  const handleApprove = (id: string) => {
    const result = approveAdjustment(appState, id);
    if (!result.ok) { toast.error('Operation failed', { module: 'Stock Correction', description: 'error' in result ? String(result.error) : 'Approve failed' }); return; }
    saveAppState();
  };

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    { key: 'id', label: 'ID', render: (row) => <span className="font-mono text-slate-600">{String(row.id)}</span> },
    { key: 'product', label: 'Product', render: (row) => <span className="font-bold text-slate-800">{String(productName(row.productId))}</span> },
    { key: 'warehouse', label: 'Warehouse', render: (row) => getWarehouseName(appState, String(row.warehouseId)) },
    {
      key: 'type',
      label: 'Type',
      render: (row) => {
        const isIncrease = String(row.type) === 'Increase';
        return <span className={`font-bold ${isIncrease ? 'text-emerald-600' : 'text-red-600'}`}>{String(row.type)}</span>;
      },
    },
    { key: 'qty', label: 'Qty', render: (row) => Number(row.qty ?? 0) },
    { key: 'unitValue', label: 'Unit Value', render: (row) => formatMoney(Number(row.unitValue ?? 0)) },
    {
      key: 'impact',
      label: 'Impact',
      render: (row) => {
        const qty = Number(row.qty ?? 0);
        const val = Number(row.unitValue ?? 0);
        const isIncrease = String(row.type) === 'Increase';
        return `${isIncrease ? '+' : '-'}${formatMoney(qty * val)}`;
      },
    },
    { key: 'reason', label: 'Reason', render: (row) => String(row.reason ?? '—') },
    { key: 'date', label: 'Date', render: (row) => String(row.date ?? '—') },
    { key: 'approvedBy', label: 'Approved By', render: (row) => String(row.approvedBy ?? '—') },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={String(row.status ?? 'Pending')} /> },
  ], [appState, products]);

  return (
    <>
    <InventoryListLayout
      title="Stock Adjustments"
      subtitle="Audit and approve inventory quantity corrections."
      addLabel="Create Adjustment"
      onAdd={() => { resetForm(); setView('form'); }}
      kpis={[
        { key: 'total', label: 'Total Adjustments', value: String(metrics.totalRuns) },
        { key: 'inc', label: 'Increased Qty', value: `+${metrics.totalIncreasedQty}` },
        { key: 'dec', label: 'Decreased Qty', value: `-${metrics.totalDecreasedQty}` },
        { key: 'net', label: 'Net Value Change', value: `${netPrefix}${formatMoney(metrics.netValue)}` },
        { key: 'pending', label: 'Pending Audits', value: String(metrics.pendingCount), alert: metrics.pendingCount > 0 },
      ]}
      filters={
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search reason, ID..." />
          <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter}><option value="all">All</option><option value="Pending">Pending</option><option value="Completed">Completed</option></FilterSelect>
          <FilterSelect label="Type" value={typeFilter} onChange={setTypeFilter}><option value="all">All</option><option value="Increase">Increase</option><option value="Decrease">Decrease</option></FilterSelect>
        </FilterBar>
      }
    >
      <AppTable
        columns={columns}
        rows={filtered}
        emptyMessage="No adjustment records found."
        renderActions={(row) => (
          String(row.status) === 'Pending' ? (
            <TableIconAction variant="approve" onClick={() => handleApprove(String(row.id))} />
          ) : null
        )}
      />
    </InventoryListLayout>
    <AppFormModal
      open={view === 'form'}
      onClose={() => { setView('main'); resetForm(); }}
      title="Create Adjustment"
      subtitle="Record stock increases or decreases with audit trail."
      onSubmit={handleSubmit}
      submitLabel="Save Adjustment"
      size="lg"
    >
      <div className={FORM_GRID_CLS}>
        <div><label className={FORM_LABEL_CLS}>Product *</label><ProductSelect state={appState} value={form.productId} onChange={(v) => setForm({ ...form, productId: v })} required /></div>
        <div><label className={FORM_LABEL_CLS}>Warehouse *</label><WarehouseSelect state={appState} value={form.warehouseId} onChange={(v) => setForm({ ...form, warehouseId: v })} required /></div>
        <div><label className={FORM_LABEL_CLS}>Adjustment Type *</label><select required className={FORM_SELECT_CLS} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="Increase">Increase</option><option value="Decrease">Decrease</option></select></div>
        <div><label className={FORM_LABEL_CLS}>Quantity *</label><input required type="number" min={1} className={FORM_INPUT_CLS} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></div>
        <div><label className={FORM_LABEL_CLS}>Unit Value</label><input type="number" min={0} step="0.01" className={FORM_INPUT_CLS} value={form.unitValue} onChange={(e) => setForm({ ...form, unitValue: e.target.value })} /></div>
        <div><label className={FORM_LABEL_CLS}>Date</label><DateInput className={`${FORM_INPUT_CLS} cursor-pointer`} value={form.date} onChange={(v) => setForm({ ...form, date: v })} /></div>
        <div className="md:col-span-2"><label className={FORM_LABEL_CLS}>Reason *</label><input required className={FORM_INPUT_CLS} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
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
