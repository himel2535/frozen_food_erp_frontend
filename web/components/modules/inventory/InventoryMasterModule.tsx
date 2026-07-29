'use client';

import { useMemo, useState } from 'react';
import { Footer } from '@/components/layout/Footer';
import { FormHeader } from '@/components/layout/FormHeader';
import { ListToolbar } from '@/components/shared/ListToolbar';
import { KpiCards, type KpiCardItem } from '@/components/shared/KpiCards';
import { MODULE_FORM_SHELL, MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { FilterTabs } from '@/components/shared/FilterTabs';
import { AdvancedDetailsToggle } from '@/components/shared/AdvancedDetailsToggle';
import { AppTable } from '@/components/shared/AppTable';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { useAppStore } from '@/lib/state/app-store';
import type { PortField } from '@/lib/modules/port-types';

export interface InventoryMasterColumn {
  key: string;
  label: string;
  render?: (row: Record<string, unknown>) => React.ReactNode;
}

export interface InventoryMasterConfig {
  title: string;
  subtitle: string;
  addLabel: string;
  fields: PortField[];
  columns: InventoryMasterColumn[];
  searchKeys: string[];
  kpi?: (rows: Record<string, unknown>[]) => KpiCardItem[];
  statusTabs?: { id: string; label: string }[];
  list: (appState: import('@/lib/state/types').AppState) => Record<string, unknown>[];
  create: (appState: import('@/lib/state/types').AppState, payload: Record<string, unknown>) => { ok: boolean; id?: string; error?: string };
  update: (appState: import('@/lib/state/types').AppState, id: string, payload: Record<string, unknown>) => { ok: boolean; error?: string };
  delete?: (appState: import('@/lib/state/types').AppState, id: string) => { ok: boolean };
}

function FieldInput({ field, value, onChange }: { field: PortField; value: string; onChange: (v: string) => void }) {
  const cls = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/10';
  if (field.type === 'select' && field.options) {
    return <select value={value} onChange={(e) => onChange(e.target.value)} className={cls}>{field.options.map((o) => <option key={o} value={o}>{o}</option>)}</select>;
  }
  if (field.type === 'textarea') return <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} className={cls} />;
  return <input type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} required={field.required} value={value} onChange={(e) => onChange(e.target.value)} className={cls} />;
}

export function InventoryMasterModule({ config }: { config: InventoryMasterConfig }) {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [view, setView] = useState<'main' | 'form'>('main');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const basicFields = config.fields.filter((f) => !f.advanced);
  const advancedFields = config.fields.filter((f) => f.advanced);

  const rows = useMemo(() => {
    let data = config.list(appState);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((row) => config.searchKeys.some((k) => String(row[k] ?? '').toLowerCase().includes(q)));
    }
    if (statusFilter !== 'all') {
      data = data.filter((row) => String(row.status ?? '').toLowerCase() === statusFilter.toLowerCase());
    }
    return data;
  }, [appState, config, search, statusFilter]);

  const kpis = useMemo(() => (config.kpi ? config.kpi(rows) : []), [config, rows]);

  const resetForm = () => {
    const next: Record<string, string> = {};
    config.fields.forEach((f) => { next[f.key] = ''; });
    setForm(next);
    setEditingId(null);
    setShowAdvanced(false);
  };

  const openEdit = (row: Record<string, unknown>) => {
    const next: Record<string, string> = {};
    config.fields.forEach((f) => { next[f.key] = String(row[f.key] ?? ''); });
    setForm(next);
    setEditingId(String(row.id));
    setView('form');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { ...form };
    config.fields.forEach((f) => { if (f.type === 'number') payload[f.key] = Number(form[f.key] || 0); });
    const result = editingId ? config.update(appState, editingId, payload) : config.create(appState, payload);
    if (!result.ok) { window.alert('error' in result ? result.error : 'Save failed'); return; }
    saveAppState();
    setView('main');
    resetForm();
  };

  if (view === 'form') {
    return (
      <div className={MODULE_FORM_SHELL}>
        <div className="max-w-4xl mx-auto w-full space-y-6">
          <FormHeader title={editingId ? `Edit ${config.title}` : `Create ${config.title}`} subtitle={config.subtitle} onBack={() => { setView('main'); resetForm(); }} />
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
              {basicFields.map((field) => (
                <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <label className="block mb-2">{field.label}{field.required ? <span className="text-rose-500"> *</span> : null}</label>
                  <FieldInput field={field} value={form[field.key] ?? ''} onChange={(v) => setForm({ ...form, [field.key]: v })} />
                </div>
              ))}
            </div>
            {advancedFields.length > 0 && <AdvancedDetailsToggle open={showAdvanced} onToggle={() => setShowAdvanced(!showAdvanced)} />}
            {showAdvanced && advancedFields.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-700">
                {advancedFields.map((field) => (
                  <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                    <label className="block mb-2">{field.label}</label>
                    <FieldInput field={field} value={form[field.key] ?? ''} onChange={(v) => setForm({ ...form, [field.key]: v })} />
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => { setView('main'); resetForm(); }} className="border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer">Cancel</button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer">Save</button>
            </div>
          </form>
        </div>
        <Footer />
      </div>
    );
  }

  const tabs = config.statusTabs ?? [{ id: 'all', label: 'All' }, { id: 'active', label: 'Active' }, { id: 'inactive', label: 'Inactive' }];

  return (
    <div className={MODULE_LIST_SHELL}>
      <ListToolbar title={config.title} subtitle={config.subtitle} search={search} onSearchChange={setSearch} searchPlaceholder={`Search ${config.title.toLowerCase()}...`} onAdd={() => { resetForm(); setView('form'); }} addLabel={config.addLabel} filters={<FilterTabs tabs={tabs} active={statusFilter} onChange={setStatusFilter} />} />
      {kpis.length > 0 && <KpiCards items={kpis} />}
      <AppTable
        columns={config.columns.map((col) => ({
          key: col.key,
          label: col.label,
          render: (row) => (col.render ? col.render(row) : String(row[col.key] ?? '—')),
        }))}
        rows={rows}
        emptyMessage="No records"
        renderActions={(row) => (
          <>
            <TableIconAction variant="edit" onClick={() => openEdit(row)} />
            {config.delete && (
              <TableIconAction
                variant="delete"
                onClick={() => {
                  if (window.confirm('Delete?')) {
                    config.delete!(appState, String(row.id));
                    saveAppState();
                  }
                }}
              />
            )}
          </>
        )}
      />
      <Footer />
    </div>
  );
}
