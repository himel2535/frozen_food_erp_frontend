'use client';

import { useMemo, useState } from 'react';
import { Pencil } from 'lucide-react';
import { AdvancedDetailsToggle } from '@/components/shared/AdvancedDetailsToggle';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { InventoryFormLayout, InventoryListLayout, FilterBar, SearchInput, PaginationBar, INPUT_CLS } from '@/components/modules/inventory/shared/inventory-ui';
import { SupplierSelect } from '@/components/modules/inventory/shared/selects';
import { useAppStore } from '@/lib/state/app-store';
import { listSuppliers } from '@/lib/services/purchases-service';
import {
  listRawMaterials,
  getRawMaterialMetrics,
  createRawMaterial,
  updateRawMaterial,
  formatMoney,
} from '@/lib/services/inventory-service';

const PAGE_SIZE = 15;

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

  if (view === 'form') {
    return (
      <InventoryFormLayout title={editingId ? 'Edit Raw Material' : 'Add Raw Material'} subtitle="Track raw material stock, pricing, and supplier links." onBack={() => { setView('main'); resetForm(); }} onSubmit={handleSubmit} submitLabel="Save Material">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="text-xs font-semibold text-slate-600">Material Name *</label><input required className={INPUT_CLS} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="text-xs font-semibold text-slate-600">Category</label><input className={INPUT_CLS} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
          <div><label className="text-xs font-semibold text-slate-600">Unit *</label><input required className={INPUT_CLS} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
          <div><label className="text-xs font-semibold text-slate-600">Quantity *</label><input required type="number" min={0} className={INPUT_CLS} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
          <div><label className="text-xs font-semibold text-slate-600">Unit Price (BDT) *</label><input required type="number" min={0} step="0.01" className={INPUT_CLS} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
          <div><label className="text-xs font-semibold text-slate-600">Supplier</label><SupplierSelect state={appState} value={form.supplierId} onChange={(v) => setForm({ ...form, supplierId: v })} /></div>
          <div><label className="text-xs font-semibold text-slate-600">Low Stock Threshold</label><input type="number" min={0} className={INPUT_CLS} value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} /></div>
          <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-4"><span className="text-xs text-slate-500">Live Total Value</span><p className="text-lg font-bold text-emerald-600">{liveTotal.toFixed(2)} BDT</p></div>
        </div>
        <AdvancedDetailsToggle open={showAdvanced} onToggle={() => setShowAdvanced(!showAdvanced)} />
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div><label className="text-xs font-semibold text-slate-600">Supplier Price</label><input type="number" min={0} step="0.01" className={INPUT_CLS} value={form.supplierPrice} onChange={(e) => setForm({ ...form, supplierPrice: e.target.value })} /></div>
            <div className="md:col-span-2"><label className="text-xs font-semibold text-slate-600">Notes</label><textarea className={INPUT_CLS} rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
        )}
      </InventoryFormLayout>
    );
  }

  return (
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
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-x-auto flex-1">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold"><tr>
            <th className="px-6 py-3">Material</th><th className="px-6 py-3">Category</th><th className="px-6 py-3">Unit</th>
            <th className="px-6 py-3">Qty</th><th className="px-6 py-3">Threshold</th><th className="px-6 py-3">Price</th>
            <th className="px-6 py-3">Total Value</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-center">Actions</th>
          </tr></thead>
          <tbody>
            {paged.map((rm) => {
              const qty = Number(rm.quantity ?? 0);
              const threshold = Number(rm.threshold ?? 100);
              const isLow = qty < threshold;
              const total = qty * Number(rm.price ?? 0);
              return (
                <tr key={String(rm.id)} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-6 py-4"><div className="flex items-center gap-2"><span className="font-bold text-slate-800">{String(rm.name)}</span>{isLow && <span className="px-1.5 py-0.5 bg-red-50 text-red-500 border border-red-100 rounded text-[9px] font-bold">Low Stock</span>}</div></td>
                  <td className="px-6 py-4 text-slate-600">{String(rm.category || 'Uncategorized')}</td>
                  <td className="px-6 py-4 text-slate-600">{String(rm.unit)}</td>
                  <td className="px-6 py-4 text-slate-600">{qty}</td>
                  <td className="px-6 py-4 text-slate-600">{threshold}</td>
                  <td className="px-6 py-4 text-slate-600">{Number(rm.price ?? 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-slate-600">{total.toFixed(2)}</td>
                  <td className="px-6 py-4"><StatusBadge status="active" /></td>
                  <td className="px-6 py-4 text-center"><button type="button" onClick={() => openEdit(rm)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] font-bold cursor-pointer hover:bg-slate-50 inline-flex items-center gap-1"><Pencil className="w-3 h-3" /> Edit</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="p-8 text-center text-slate-400">No raw materials found.</p>}
      </div>
    </InventoryListLayout>
  );
}
