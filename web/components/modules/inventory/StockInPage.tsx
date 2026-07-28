'use client';

import { useMemo, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { AdvancedDetailsToggle } from '@/components/shared/AdvancedDetailsToggle';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { InventoryFormLayout, InventoryListLayout, FilterBar, FilterSelect, SearchInput, INPUT_CLS, SELECT_CLS } from '@/components/modules/inventory/shared/inventory-ui';
import { ProductSelect, WarehouseSelect } from '@/components/modules/inventory/shared/selects';
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
    if (!result.ok) { window.alert('error' in result ? result.error : 'Save failed'); return; }
    saveAppState();
    setView('main');
    resetForm();
  };

  const handleApprove = (id: string) => {
    const result = approveStockIn(appState, id);
    if (!result.ok) { window.alert('error' in result ? result.error : 'Approve failed'); return; }
    saveAppState();
  };

  if (view === 'form') {
    return (
      <InventoryFormLayout title="Create Stock In" subtitle="Record incoming inventory with product, warehouse, and cost details." onBack={() => { setView('main'); resetForm(); }} onSubmit={handleSubmit} submitLabel="Save Stock-In">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="text-xs font-semibold text-slate-600">Product *</label><ProductSelect state={appState} value={form.productId} onChange={(v) => setForm({ ...form, productId: v })} required /></div>
          <div><label className="text-xs font-semibold text-slate-600">Warehouse *</label><WarehouseSelect state={appState} value={form.warehouseId} onChange={(v) => setForm({ ...form, warehouseId: v })} required /></div>
          <div><label className="text-xs font-semibold text-slate-600">Quantity *</label><input required type="number" min={1} className={INPUT_CLS} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></div>
          <div><label className="text-xs font-semibold text-slate-600">Unit Cost *</label><input required type="number" min={0} step="0.01" className={INPUT_CLS} value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} /></div>
          <div><label className="text-xs font-semibold text-slate-600">Date</label><input type="date" className={INPUT_CLS} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <div><label className="text-xs font-semibold text-slate-600">Source Type</label><select className={SELECT_CLS} value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value })}><option>Purchase</option><option>Production</option><option>Return</option><option>Transfer</option></select></div>
          <div className="md:col-span-2 bg-emerald-50 border border-emerald-200 rounded-xl p-4"><span className="text-xs text-emerald-700">Total Value</span><p className="text-lg font-bold text-emerald-700">{formatMoney(totalValue)}</p></div>
        </div>
        <AdvancedDetailsToggle open={showAdvanced} onToggle={() => setShowAdvanced(!showAdvanced)} />
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div><label className="text-xs font-semibold text-slate-600">Reference Doc ID</label><input className={INPUT_CLS} value={form.refDocId} onChange={(e) => setForm({ ...form, refDocId: e.target.value })} /></div>
            <div><label className="text-xs font-semibold text-slate-600">Supplier</label><input className={INPUT_CLS} value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></div>
            <div><label className="text-xs font-semibold text-slate-600">Batch Number</label><input className={INPUT_CLS} value={form.batchNumber} onChange={(e) => setForm({ ...form, batchNumber: e.target.value })} /></div>
            <div><label className="text-xs font-semibold text-slate-600">Expiry Date</label><input type="date" className={INPUT_CLS} value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></div>
            <div><label className="text-xs font-semibold text-slate-600">Status</label><select className={SELECT_CLS} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="Pending">Pending</option><option value="Approved">Approved</option></select></div>
            <div className="md:col-span-2"><label className="text-xs font-semibold text-slate-600">Notes</label><textarea className={INPUT_CLS} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
        )}
      </InventoryFormLayout>
    );
  }

  return (
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
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold"><tr>
            <th className="px-6 py-3">ID</th><th className="px-6 py-3">Product</th><th className="px-6 py-3">Warehouse</th>
            <th className="px-6 py-3">Qty</th><th className="px-6 py-3">Unit Cost</th><th className="px-6 py-3">Total</th>
            <th className="px-6 py-3">Source</th><th className="px-6 py-3">Ref Doc</th><th className="px-6 py-3">Date</th>
            <th className="px-6 py-3">Status</th><th className="px-6 py-3 text-center">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map((row) => {
              const qty = Number(row.qty ?? 0);
              const cost = Number(row.unitCost ?? 0);
              return (
                <tr key={String(row.id)} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-mono text-slate-600">{String(row.id)}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{String(productName(row.productId))}</td>
                  <td className="px-6 py-4 text-slate-600">{getWarehouseName(appState, String(row.warehouseId))}</td>
                  <td className="px-6 py-4 text-slate-600">{qty}</td>
                  <td className="px-6 py-4 text-slate-600">{formatMoney(cost)}</td>
                  <td className="px-6 py-4 text-slate-600">{formatMoney(qty * cost)}</td>
                  <td className="px-6 py-4 text-slate-600">{String(row.sourceType ?? '—')}</td>
                  <td className="px-6 py-4 text-slate-600">{String(row.refDocId ?? '—')}</td>
                  <td className="px-6 py-4 text-slate-600">{String(row.date ?? '—')}</td>
                  <td className="px-6 py-4"><StatusBadge status={String(row.status ?? 'Pending')} /></td>
                  <td className="px-6 py-4 text-center">
                    {String(row.status) === 'Pending' && (
                      <button type="button" onClick={() => handleApprove(String(row.id))} className="inline-flex items-center gap-1 px-3 py-1.5 text-emerald-600 border border-emerald-200 rounded-lg text-[11px] font-bold cursor-pointer hover:bg-emerald-50">
                        <CheckCircle className="w-3 h-3" /> Approve
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </InventoryListLayout>
  );
}
