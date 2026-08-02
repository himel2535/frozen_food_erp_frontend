'use client';

import { confirmAction, toast } from '@/lib/ui/feedback';

import { useMemo, useState } from 'react';
import { Footer } from '@/components/layout/Footer';
import { FormHeader } from '@/components/layout/FormHeader';
import { AppFormPage, FORM_GRID_CLS, FORM_INPUT_CLS, FORM_LABEL_CLS, FORM_SELECT_CLS, FORM_TEXTAREA_CLS } from '@/components/shared/AppForm';
import { ListToolbar } from '@/components/shared/ListToolbar';
import { KpiCards, type KpiCardItem } from '@/components/shared/KpiCards';
import { MODULE_FORM_SHELL, MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { FilterTabs } from '@/components/shared/FilterTabs';
import { DetailViewShell } from '@/components/shared/DetailViewShell';
import { LineItemsEditor, type LineItem } from '@/components/shared/LineItemsEditor';
import { AdvancedDetailsToggle } from '@/components/shared/AdvancedDetailsToggle';
import { AppTable } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
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
      toast.error('Operation failed', { module: 'Sales', description: 'error' in result ? String(result.error) : 'Save failed' });
      return;
    }
    saveAppState();
    setView('main');
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!config.delete) return;
    const ok = await confirmAction({
      title: 'Delete record',
      message: 'Delete this record?',
      confirmLabel: 'Delete',
      tone: 'danger',
      module: 'Sales',
    });
    if (!ok) return;
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
                    if (r.ok) { saveAppState(); toast.info('Notice', { module: 'Sales', description: `Created ${r.id}` }); }
                    else toast.error('Operation failed', { module: 'Sales', description: String(r.error ?? 'Failed') });
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
    const formTitle = editingId ? `Edit ${config.title}` : `Create ${config.title}`;

    return (
      <AppFormPage
        title={formTitle}
        subtitle={config.subtitle}
        onBack={() => { setView('main'); resetForm(); }}
        onSubmit={handleSubmit}
        submitLabel="Save"
      >
        <div className={FORM_GRID_CLS}>
          {config.customerField !== false && (
            <div>
              <label className={FORM_LABEL_CLS}>Customer <span className="text-rose-500">*</span></label>
              <input required value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} className={FORM_INPUT_CLS} />
            </div>
          )}
          <div>
            <label className={FORM_LABEL_CLS}>Date</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={`${FORM_INPUT_CLS} cursor-pointer`} />
          </div>
          <div>
            <label className={FORM_LABEL_CLS}>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={FORM_SELECT_CLS}>
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
            <label className={FORM_LABEL_CLS}>Notes</label>
            <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={FORM_TEXTAREA_CLS} />
          </div>
        )}
      </AppFormPage>
    );
  }

  const tabs = config.statusFilterTabs ?? [{ id: 'all', label: 'All' }, ...config.statusOptions.map((s) => ({ id: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))];

  return (
    <div className={MODULE_LIST_SHELL}>
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
      <AppTable
        columns={config.columns.map((col) => ({
          key: col.key,
          label: col.label,
          render: (row) => (col.render ? col.render(row) : String(row[col.key] ?? '—')),
        }))}
        rows={rows}
        emptyMessage="No records yet"
        renderActions={(row) => (
          <>
            <TableIconAction
              variant="view"
              onClick={() => {
                setDetailId(String(row.id));
                setView('detail');
              }}
            />
            <TableIconAction variant="edit" onClick={() => openEdit(row)} />
            {config.delete && (
              <TableIconAction variant="delete" onClick={() => handleDelete(String(row.id))} />
            )}
          </>
        )}
      />
      <Footer />
    </div>
  );
}
