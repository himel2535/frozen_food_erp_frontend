'use client';

import { useMemo, useState } from 'react';
import { AdvancedDetailsToggle } from '@/components/shared/AdvancedDetailsToggle';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { InventoryFormLayout, InventoryListLayout, FilterBar, FilterSelect, SearchInput, INPUT_CLS, SELECT_CLS } from '@/components/modules/inventory/shared/inventory-ui';
import { ProductSelect, WarehouseSelect } from '@/components/modules/inventory/shared/selects';
import { useAppStore } from '@/lib/state/app-store';
import {
  listStockOutRecords,
  getStockOutMetrics,
  createStockOut,
  completeStockOut,
  getWarehouseName,
  listInventory,
  formatMoney,
} from '@/lib/services/inventory-service';

const REASON_CODES = ['Manufacturing', 'Order Fulfillment', 'Damage', 'Expiry', 'Sample', 'Internal Use'];

export function StockOutPage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [view, setView] = useState<'main' | 'form'>('main');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({
    productId: '', warehouseId: '', qty: '', unitValue: '', date: new Date().toISOString().slice(0, 10),
    sourceType: 'Production', reasonCode: 'Manufacturing', refDocId: '', status: 'Pending', notes: '',
  });

  const records = useMemo(() => listStockOutRecords(appState), [appState]);
  const metrics = useMemo(() => getStockOutMetrics(appState), [appState]);
  const products = useMemo(() => listInventory(appState), [appState]);
  const productName = (id: unknown) => products.find((p) => String(p.id) === String(id))?.name ?? String(id);

  const filtered = useMemo(() => {
    let data = records;
    if (statusFilter !== 'all') data = data.filter((r) => String(r.status) === statusFilter);
    if (warehouseFilter !== 'all') data = data.filter((r) => String(r.warehouseId) === warehouseFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((r) => `${r.id} ${r.refDocId} ${r.reasonCode}`.toLowerCase().includes(q));
    }
    return data;
  }, [records, search, statusFilter, warehouseFilter]);

  const resetForm = () => {
    setForm({
      productId: '', warehouseId: '', qty: '', unitValue: '', date: new Date().toISOString().slice(0, 10),
      sourceType: 'Production', reasonCode: 'Manufacturing', refDocId: '', status: 'Pending', notes: '',
    });
    setShowAdvanced(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = createStockOut(appState, {
      ...form, qty: Number(form.qty || 0), unitValue: Number(form.unitValue || 0),
    });
    if (!result.ok) { window.alert('error' in result ? result.error : 'Save failed'); return; }
    saveAppState();
    setView('main');
    resetForm();
  };

  const handleComplete = (id: string) => {
    const result = completeStockOut(appState, id);
    if (!result.ok) { window.alert('error' in result ? result.error : 'Complete failed'); return; }
    saveAppState();
  };

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    { key: 'id', label: 'ID', render: (row) => <span className="font-mono text-slate-600">{String(row.id)}</span> },
    { key: 'product', label: 'Product', render: (row) => <span className="font-bold text-slate-800">{String(productName(row.productId))}</span> },
    { key: 'warehouse', label: 'Warehouse', render: (row) => getWarehouseName(appState, String(row.warehouseId)) },
    { key: 'qty', label: 'Qty', render: (row) => Number(row.qty ?? 0) },
    { key: 'unitValue', label: 'Unit Value', render: (row) => formatMoney(Number(row.unitValue ?? 0)) },
    {
      key: 'total',
      label: 'Total',
      render: (row) => formatMoney(Number(row.qty ?? 0) * Number(row.unitValue ?? 0)),
    },
    { key: 'reasonCode', label: 'Reason', render: (row) => String(row.reasonCode ?? '—') },
    { key: 'sourceType', label: 'Source', render: (row) => String(row.sourceType ?? '—') },
    { key: 'refDocId', label: 'Ref', render: (row) => String(row.refDocId ?? '—') },
    { key: 'date', label: 'Date', render: (row) => String(row.date ?? '—') },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={String(row.status ?? 'Pending')} /> },
  ], [appState, products]);

  if (view === 'form') {
    return (
      <InventoryFormLayout title="Create Stock Out" subtitle="Issue inventory with reason codes and warehouse tracking." onBack={() => { setView('main'); resetForm(); }} onSubmit={handleSubmit} submitLabel="Save Stock-Out">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="text-xs font-semibold text-slate-600">Product *</label><ProductSelect state={appState} value={form.productId} onChange={(v) => setForm({ ...form, productId: v })} required /></div>
          <div><label className="text-xs font-semibold text-slate-600">Warehouse *</label><WarehouseSelect state={appState} value={form.warehouseId} onChange={(v) => setForm({ ...form, warehouseId: v })} required /></div>
          <div><label className="text-xs font-semibold text-slate-600">Quantity *</label><input required type="number" min={1} className={INPUT_CLS} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></div>
          <div><label className="text-xs font-semibold text-slate-600">Unit Value</label><input type="number" min={0} step="0.01" className={INPUT_CLS} value={form.unitValue} onChange={(e) => setForm({ ...form, unitValue: e.target.value })} /></div>
          <div><label className="text-xs font-semibold text-slate-600">Date</label><input type="date" className={INPUT_CLS} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <div><label className="text-xs font-semibold text-slate-600">Reason Code *</label><select required className={SELECT_CLS} value={form.reasonCode} onChange={(e) => setForm({ ...form, reasonCode: e.target.value })}>{REASON_CODES.map((r) => <option key={r} value={r}>{r}</option>)}</select></div>
          <div><label className="text-xs font-semibold text-slate-600">Source Type</label><select className={SELECT_CLS} value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value })}><option>Production</option><option>Sales</option><option>Damage</option><option>Internal</option></select></div>
        </div>
        <AdvancedDetailsToggle open={showAdvanced} onToggle={() => setShowAdvanced(!showAdvanced)} />
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div><label className="text-xs font-semibold text-slate-600">Reference Doc ID</label><input className={INPUT_CLS} value={form.refDocId} onChange={(e) => setForm({ ...form, refDocId: e.target.value })} /></div>
            <div><label className="text-xs font-semibold text-slate-600">Status</label><select className={SELECT_CLS} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="Pending">Pending</option><option value="Completed">Completed</option></select></div>
            <div className="md:col-span-2"><label className="text-xs font-semibold text-slate-600">Notes</label><textarea className={INPUT_CLS} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
        )}
      </InventoryFormLayout>
    );
  }

  return (
    <InventoryListLayout
      title="Stock Out"
      subtitle="Track inventory issues, reasons, and fulfillment runs."
      addLabel="Create Stock Out"
      onAdd={() => { resetForm(); setView('form'); }}
      kpis={[
        { key: 'runs', label: 'Total Runs', value: String(metrics.totalRuns) },
        { key: 'qty', label: 'Total Issued Qty', value: String(metrics.totalQty) },
        { key: 'val', label: 'Total Out Value', value: formatMoney(metrics.totalValue) },
        { key: 'pending', label: 'Pending Stock-Out', value: String(metrics.pendingQty), alert: metrics.pendingQty > 0 },
        { key: 'lost', label: 'Lost/Damaged Value', value: formatMoney(metrics.lostValue), alert: metrics.lostValue > 0 },
      ]}
      filters={
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search ref, reason..." />
          <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter}><option value="all">All</option><option value="Pending">Pending</option><option value="Completed">Completed</option></FilterSelect>
          <FilterSelect label="Warehouse" value={warehouseFilter} onChange={setWarehouseFilter}><option value="all">All Warehouses</option>{appState.inventoryWarehouses?.map((w) => <option key={String(w.id)} value={String(w.id)}>{String(w.name)}</option>)}</FilterSelect>
        </FilterBar>
      }
    >
      <AppTable
        columns={columns}
        rows={filtered}
        emptyMessage="No stock-out records found."
        renderActions={(row) => (
          String(row.status) === 'Pending' ? (
            <TableIconAction variant="approve" label="Complete" onClick={() => handleComplete(String(row.id))} />
          ) : null
        )}
      />
    </InventoryListLayout>
  );
}
