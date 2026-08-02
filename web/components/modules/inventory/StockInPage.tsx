'use client';

import { toast } from '@/lib/ui/feedback';

import { useMemo, useState } from 'react';
import { AppFormModal, FORM_GRID_CLS, FORM_INPUT_CLS, FORM_LABEL_CLS, FORM_SELECT_CLS } from '@/components/shared/AppForm';
import { AdvancedDetailsToggle } from '@/components/shared/AdvancedDetailsToggle';
import { ProductSelect, WarehouseSelect } from '@/components/modules/inventory/shared/selects';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { InventoryListLayout, FilterBar, FilterSelect, SearchInput } from '@/components/modules/inventory/shared/inventory-ui';
import { useAppStore } from '@/lib/state/app-store';
import {
  listStockInRecords,
  getStockInMetrics,
  createStockIn,
  approveStockIn,
  getWarehouseName,
  listInventory,
  formatMoney,
} from '@/lib/services/inventory-service';

export function StockInPage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [view, setView] = useState<'main' | 'form'>('main');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({
    productId: '', warehouseId: '', qty: '', unitCost: '', date: new Date().toISOString().slice(0, 10),
    sourceType: 'Purchase', refDocId: '', supplier: '', status: 'Pending', batchNumber: '', expiryDate: '', notes: '',
  });

  const records = useMemo(() => listStockInRecords(appState), [appState]);
  const metrics = useMemo(() => getStockInMetrics(appState), [appState]);
  const products = useMemo(() => listInventory(appState), [appState]);

  const filtered = useMemo(() => {
    let data = records;
    if (statusFilter !== 'all') data = data.filter((r) => String(r.status) === statusFilter);
    if (warehouseFilter !== 'all') data = data.filter((r) => String(r.warehouseId) === warehouseFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((r) => `${r.id} ${r.refDocId} ${r.supplier}`.toLowerCase().includes(q));
    }
    return data;
  }, [records, search, statusFilter, warehouseFilter]);

  const totalValue = Number(form.qty || 0) * Number(form.unitCost || 0);

  const productName = (id: unknown) => products.find((p) => String(p.id) === String(id))?.name ?? String(id);

  const resetForm = () => {
    setForm({
      productId: '', warehouseId: '', qty: '', unitCost: '', date: new Date().toISOString().slice(0, 10),
      sourceType: 'Purchase', refDocId: '', supplier: '', status: 'Pending', batchNumber: '', expiryDate: '', notes: '',
    });
    setShowAdvanced(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = createStockIn(appState, {
      ...form, qty: Number(form.qty || 0), unitCost: Number(form.unitCost || 0),
    });
    if (!result.ok) { toast.error('Operation failed', { module: 'Inventory', description: 'error' in result ? String(result.error) : 'Save failed' }); return; }
    saveAppState();
    setView('main');
    resetForm();
  };

  const handleApprove = (id: string) => {
    const result = approveStockIn(appState, id);
    if (!result.ok) { toast.error('Operation failed', { module: 'Inventory', description: 'error' in result ? String(result.error) : 'Approve failed' }); return; }
    saveAppState();
  };

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    { key: 'id', label: 'ID', render: (row) => <span className="font-mono text-slate-600">{String(row.id)}</span> },
    { key: 'product', label: 'Product', render: (row) => <span className="font-bold text-slate-800">{String(productName(row.productId))}</span> },
    { key: 'warehouse', label: 'Warehouse', render: (row) => getWarehouseName(appState, String(row.warehouseId)) },
    { key: 'qty', label: 'Qty', render: (row) => Number(row.qty ?? 0) },
    { key: 'unitCost', label: 'Unit Cost', render: (row) => formatMoney(Number(row.unitCost ?? 0)) },
    {
      key: 'total',
      label: 'Total',
      render: (row) => formatMoney(Number(row.qty ?? 0) * Number(row.unitCost ?? 0)),
    },
    { key: 'sourceType', label: 'Source', render: (row) => String(row.sourceType ?? '—') },
    { key: 'refDocId', label: 'Ref Doc', render: (row) => String(row.refDocId ?? '—') },
    { key: 'date', label: 'Date', render: (row) => String(row.date ?? '—') },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={String(row.status ?? 'Pending')} /> },
  ], [appState, products]);

  return (
    <>
    <InventoryListLayout
      title="Stock In"
      subtitle="Record and verify incoming inventory runs."
      addLabel="Create Stock In"
      onAdd={() => { resetForm(); setView('form'); }}
      kpis={[
        { key: 'runs', label: 'Total Stock-In Runs', value: `${metrics.totalRuns} runs` },
        { key: 'qty', label: 'Total Incoming Qty', value: `${metrics.totalQty.toLocaleString()} units` },
        { key: 'val', label: 'Total Stock-In Value', value: formatMoney(metrics.totalVal) },
        { key: 'pending', label: 'Pending Verification', value: `${metrics.pending} pending`, alert: metrics.pending > 0 },
      ]}
      filters={
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search ref, supplier..." />
          <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter}><option value="all">All</option><option value="Pending">Pending</option><option value="Approved">Approved</option></FilterSelect>
          <FilterSelect label="Warehouse" value={warehouseFilter} onChange={setWarehouseFilter}><option value="all">All Warehouses</option>{appState.inventoryWarehouses?.map((w) => <option key={String(w.id)} value={String(w.id)}>{String(w.name)}</option>)}</FilterSelect>
        </FilterBar>
      }
    >
      <AppTable
        columns={columns}
        rows={filtered}
        emptyMessage="No stock-in records found."
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
      title="Create Stock In"
      subtitle="Record incoming inventory with product, warehouse, and cost details."
      onSubmit={handleSubmit}
      submitLabel="Save Stock-In"
      size="lg"
    >
      <div className={FORM_GRID_CLS}>
        <div><label className={FORM_LABEL_CLS}>Product *</label><ProductSelect state={appState} value={form.productId} onChange={(v) => setForm({ ...form, productId: v })} required /></div>
        <div><label className={FORM_LABEL_CLS}>Warehouse *</label><WarehouseSelect state={appState} value={form.warehouseId} onChange={(v) => setForm({ ...form, warehouseId: v })} required /></div>
        <div><label className={FORM_LABEL_CLS}>Quantity *</label><input required type="number" min={1} className={FORM_INPUT_CLS} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></div>
        <div><label className={FORM_LABEL_CLS}>Unit Cost *</label><input required type="number" min={0} step="0.01" className={FORM_INPUT_CLS} value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} /></div>
        <div><label className={FORM_LABEL_CLS}>Date</label><input type="date" className={`${FORM_INPUT_CLS} cursor-pointer`} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
        <div><label className={FORM_LABEL_CLS}>Source Type</label><select className={FORM_SELECT_CLS} value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value })}><option>Purchase</option><option>Production</option><option>Return</option><option>Transfer</option></select></div>
        <div className="md:col-span-2 bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-4"><span className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Total Value</span><p className="text-lg font-bold text-emerald-700 mt-1">{formatMoney(totalValue)}</p></div>
      </div>
      <AdvancedDetailsToggle open={showAdvanced} onToggle={() => setShowAdvanced(!showAdvanced)} />
      {showAdvanced && (
        <div className={`${FORM_GRID_CLS} pt-4 border-t border-slate-100/80`}>
          <div><label className={FORM_LABEL_CLS}>Reference Doc ID</label><input className={FORM_INPUT_CLS} value={form.refDocId} onChange={(e) => setForm({ ...form, refDocId: e.target.value })} /></div>
          <div><label className={FORM_LABEL_CLS}>Supplier</label><input className={FORM_INPUT_CLS} value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></div>
          <div><label className={FORM_LABEL_CLS}>Batch Number</label><input className={FORM_INPUT_CLS} value={form.batchNumber} onChange={(e) => setForm({ ...form, batchNumber: e.target.value })} /></div>
          <div><label className={FORM_LABEL_CLS}>Expiry Date</label><input type="date" className={`${FORM_INPUT_CLS} cursor-pointer`} value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></div>
          <div><label className={FORM_LABEL_CLS}>Status</label><select className={FORM_SELECT_CLS} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="Pending">Pending</option><option value="Approved">Approved</option></select></div>
          <div className="md:col-span-2"><label className={FORM_LABEL_CLS}>Notes</label><textarea className={FORM_INPUT_CLS} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
      )}
    </AppFormModal>
    </>
  );
}
