'use client';

import { useMemo, useState } from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { FormHeader } from '@/components/layout/FormHeader';
import { ListToolbar } from '@/components/shared/ListToolbar';
import { KpiCards, type KpiCardItem } from '@/components/shared/KpiCards';
import { FilterTabs } from '@/components/shared/FilterTabs';
import { DetailViewShell } from '@/components/shared/DetailViewShell';
import { LineItemsEditor, type LineItem } from '@/components/shared/LineItemsEditor';
import { AdvancedDetailsToggle } from '@/components/shared/AdvancedDetailsToggle';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAppStore } from '@/lib/state/app-store';
import { formatMoney } from '@/lib/services/sales-service';

export interface SalesDocColumn {
  key: string;
  label: string;
  render?: (row: Record<string, unknown>) => React.ReactNode;
}

export interface SalesDocumentConfig {
  title: string;
  subtitle: string;
  addLabel: string;
  idPrefix: string;
  statusOptions: string[];
  statusFilterTabs?: { id: string; label: string }[];
  columns: SalesDocColumn[];
  searchKeys: string[];
  kpi?: (rows: Record<string, unknown>[]) => KpiCardItem[];
  list: (appState: import('@/lib/state/types').AppState) => Record<string, unknown>[];
  create: (appState: import('@/lib/state/types').AppState, payload: Record<string, unknown>) => { ok: boolean; id?: string; error?: string };
  update: (appState: import('@/lib/state/types').AppState, id: string, payload: Record<string, unknown>) => { ok: boolean; error?: string };
  delete?: (appState: import('@/lib/state/types').AppState, id: string) => { ok: boolean };
  showLineItems?: boolean;
  customerField?: boolean;
  onConvert?: (appState: import('@/lib/state/types').AppState, id: string) => { ok: boolean; id?: string; error?: string };
  convertLabel?: string;
}

function itemsToLineItems(items: unknown): LineItem[] {
  if (!Array.isArray(items)) return [];
  return items.map((row, idx) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id ?? `li-${idx}`),
      description: String(r.description ?? r.name ?? ''),
      qty: Number(r.qty ?? r.quantity ?? 1),
      rate: Number(r.rate ?? r.price ?? 0),
    };
  });
}

function lineItemsToPayload(items: LineItem[]) {
  return items.map((i) => ({ description: i.description, name: i.description, qty: i.qty, rate: i.rate, price: i.rate }));
}

export function SalesDocumentModule({ config }: { config: SalesDocumentConfig }) {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [view, setView] = useState<'main' | 'form' | 'detail'>('main');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({ customer: '', status: config.statusOptions[0] ?? 'draft', notes: '', date: new Date().toISOString().slice(0, 10) });
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  const rows = useMemo(() => {
    let data = config.list(appState);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((row) => config.searchKeys.some((k) => String(row[k] ?? '').toLowerCase().includes(q)));
    }
    if (statusFilter !== 'all') {
      data = data.filter((row) => String(row.status ?? '').toLowerCase() === statusFilter);
    }
    return data;
  }, [appState, config, search, statusFilter]);

  const kpis = useMemo(() => (config.kpi ? config.kpi(rows) : []), [config, rows]);
  const detailRow = useMemo(() => rows.find((r) => String(r.id) === detailId), [rows, detailId]);

  const total = lineItems.reduce((s, i) => s + i.qty * i.rate, 0);

  const resetForm = () => {
    setForm({ customer: '', status: config.statusOptions[0] ?? 'draft', notes: '', date: new Date().toISOString().slice(0, 10) });
    setLineItems([{ id: 'li-1', description: '', qty: 1, rate: 0 }]);
    setEditingId(null);
    setShowAdvanced(false);
  };

  const openEdit = (row: Record<string, unknown>) => {
    setEditingId(String(row.id));
    setForm({
      customer: String(row.customer ?? row.customerName ?? ''),
      status: String(row.status ?? config.statusOptions[0]),
      notes: String(row.notes ?? ''),
      date: String(row.date ?? new Date().toISOString().slice(0, 10)),
    });
    setLineItems(itemsToLineItems(row.items).length ? itemsToLineItems(row.items) : [{ id: 'li-1', description: '', qty: 1, rate: 0 }]);
    setView('form');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      items: config.showLineItems ? lineItemsToPayload(lineItems) : undefined,
      total: config.showLineItems ? total : Number((form as Record<string, unknown>).total ?? 0),
    };
    const result = editingId ? config.update(appState, editingId, payload) : config.create(appState, payload);
    if (!result.ok) {
      window.alert('error' in result ? result.error : 'Save failed');
      return;
    }
    saveAppState();
    setView('main');
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (!config.delete || !window.confirm('Delete this record?')) return;
    config.delete(appState, id);
    saveAppState();
  };

  if (view === 'detail' && detailRow) {
    const items = itemsToLineItems(detailRow.items);
    const docTotal = Number(detailRow.total ?? items.reduce((s, i) => s + i.qty * i.rate, 0));
    return (
      <>
        <DetailViewShell
          title={String(detailRow.id)}
          subtitle={`${detailRow.customer ?? ''} • ${detailRow.date ?? ''}`}
          onBack={() => { setView('main'); setDetailId(null); }}
          actions={
            <div className="flex gap-2">
              {config.onConvert && (
                <button
                  type="button"
                  className="px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl cursor-pointer"
                  onClick={() => {
                    const r = config.onConvert!(appState, String(detailRow.id));
                    if (r.ok) { saveAppState(); window.alert(`Created ${r.id}`); }
                    else window.alert(r.error ?? 'Failed');
                  }}
                >
                  {config.convertLabel ?? 'Convert'}
                </button>
              )}
              <button type="button" onClick={() => openEdit(detailRow)} className="px-3 py-2 border border-slate-200 text-xs font-bold rounded-xl cursor-pointer">
                Edit
              </button>
            </div>
          }
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div><span className="text-slate-500 font-semibold">Status</span><div className="mt-1"><StatusBadge status={String(detailRow.status)} /></div></div>
            <div><span className="text-slate-500 font-semibold">Customer</span><div className="mt-1 font-bold">{String(detailRow.customer ?? '—')}</div></div>
            <div><span className="text-slate-500 font-semibold">Date</span><div className="mt-1 font-bold">{String(detailRow.date ?? '—')}</div></div>
            <div><span className="text-slate-500 font-semibold">Total</span><div className="mt-1 font-extrabold">{formatMoney(docTotal)}</div></div>
          </div>
          {config.showLineItems && <LineItemsEditor items={items} onChange={() => {}} readOnly />}
          {detailRow.notes ? <p className="text-xs text-slate-600">{String(detailRow.notes)}</p> : null}
        </DetailViewShell>
        <Footer />
      </>
    );
  }

  if (view === 'form') {
    return (
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50">
        <div className="max-w-4xl mx-auto w-full space-y-6">
          <FormHeader title={editingId ? `Edit ${config.title}` : `Create ${config.title}`} subtitle={config.subtitle} onBack={() => { setView('main'); resetForm(); }} />
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
              {config.customerField !== false && (
                <div>
                  <label className="block mb-2">Customer <span className="text-rose-500">*</span></label>
                  <input required value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" />
                </div>
              )}
              <div>
                <label className="block mb-2">Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer" />
              </div>
              <div>
                <label className="block mb-2">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  {config.statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            {config.showLineItems && <LineItemsEditor items={lineItems} onChange={setLineItems} />}
            {config.showLineItems && (
              <div className="text-right text-sm font-extrabold text-slate-900">Total: {formatMoney(total)}</div>
            )}
            <AdvancedDetailsToggle open={showAdvanced} onToggle={() => setShowAdvanced(!showAdvanced)} />
            {showAdvanced && (
              <div>
                <label className="block mb-2 text-xs font-semibold">Notes</label>
                <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
            )}
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl cursor-pointer">
              Save
            </button>
          </form>
        </div>
        <Footer />
      </div>
    );
  }

  const tabs = config.statusFilterTabs ?? [{ id: 'all', label: 'All' }, ...config.statusOptions.map((s) => ({ id: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))];

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 flex flex-col">
      <ListToolbar
        title={config.title}
        subtitle={config.subtitle}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={`Search ${config.title.toLowerCase()}...`}
        onAdd={() => { resetForm(); setView('form'); }}
        addLabel={config.addLabel}
        filters={<FilterTabs tabs={tabs} active={statusFilter} onChange={setStatusFilter} />}
      />
      {kpis.length > 0 && <KpiCards items={kpis} />}
      <div className="bg-white rounded-xl border border-slate-200/80 premium-shadow overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
            <tr>
              {config.columns.map((col) => (
                <th key={col.key} className="px-4 py-3">{col.label}</th>
              ))}
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr><td colSpan={config.columns.length + 1} className="px-4 py-8 text-center text-slate-400">No records yet</td></tr>
            ) : rows.map((row) => (
              <tr key={String(row.id)} className="hover:bg-slate-50/80">
                {config.columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 font-medium text-slate-700">
                    {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => { setDetailId(String(row.id)); setView('detail'); }} className="inline-flex items-center gap-1 text-blue-600 font-bold cursor-pointer">
                      <Eye className="w-4 h-4" /> View
                    </button>
                    <button type="button" onClick={() => openEdit(row)} className="inline-flex items-center gap-1 text-amber-600 font-bold cursor-pointer">
                      <Pencil className="w-4 h-4" /> Edit
                    </button>
                    {config.delete && (
                      <button type="button" onClick={() => handleDelete(String(row.id))} className="inline-flex items-center gap-1 text-rose-600 font-bold cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Footer />
    </div>
  );
}
