'use client';

import { useMemo, useState } from 'react';
import { Footer } from '@/components/layout/Footer';
import { FormHeader } from '@/components/layout/FormHeader';
import { ListToolbar } from '@/components/shared/ListToolbar';
import { KpiCards, type KpiCardItem } from '@/components/shared/KpiCards';
import { FilterTabs } from '@/components/shared/FilterTabs';
import { AdvancedDetailsToggle } from '@/components/shared/AdvancedDetailsToggle';
import { AppTable } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { useAppStore } from '@/lib/state/app-store';
import type { PortField, PortModuleConfig } from '@/lib/modules/port-types';

export interface DedicatedModuleConfig extends PortModuleConfig {
  kpi?: (rows: Record<string, unknown>[]) => KpiCardItem[];
  statusTabs?: { id: string; label: string }[];
  columnRender?: Record<string, (row: Record<string, unknown>) => React.ReactNode>;
  computedFields?: Record<string, (form: Record<string, string>) => string>;
  rowActions?: (row: Record<string, unknown>, ctx: { appState: import('@/lib/state/types').AppState; save: () => void }) => React.ReactNode;
}

function FieldInput({ field, value, onChange }: { field: PortField; value: string; onChange: (v: string) => void }) {
  const cls = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500';
  if (field.type === 'select' && field.options) {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${cls} cursor-pointer`}>
        {field.placeholder && <option value="">{field.placeholder}</option>}
        {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    );
  }
  if (field.type === 'textarea') return <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} className={cls} />;
  return (
    <input
      type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : 'text'}
      required={field.required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cls}
    />
  );
}

export function DedicatedModule({ config }: { config: DedicatedModuleConfig }) {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [view, setView] = useState<'main' | 'form'>('main');
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const rows = useMemo(() => {
    let data = config.adapter.list(appState);
    if (search) {
      const q = search.toLowerCase();
      const keys = config.searchKeys ?? config.columns.map((c) => c.key);
      data = data.filter((row) => keys.some((k) => String(row[k] ?? '').toLowerCase().includes(q)));
    }
    config.filters?.forEach((f) => {
      const val = filterValues[f.key];
      if (val && val !== 'all') data = data.filter((row) => String(row[f.key] ?? '') === val);
    });
    if (statusFilter !== 'all') {
      data = data.filter((row) => String(row.status ?? '').toLowerCase() === statusFilter.toLowerCase());
    }
    return data;
  }, [appState, config, search, filterValues, statusFilter]);

  const kpis = useMemo(() => {
    if (config.kpi) return config.kpi(rows);
    return [
      { key: 'total', label: `Total ${config.title}`, value: String(rows.length) },
      { key: 'active', label: 'Active Records', value: String(rows.filter((r) => ['active', 'approved', 'paid', 'completed', 'received', 'present'].includes(String(r.status ?? '').toLowerCase())).length) },
    ];
  }, [config, rows]);
  const basicFields = config.fields.filter((f) => !f.advanced);
  const advancedFields = config.fields.filter((f) => f.advanced);

  const resetForm = () => {
    const initial = config.adapter.getInitialForm?.(appState) ?? {};
    const next: Record<string, string> = {};
    config.fields.forEach((f) => { next[f.key] = String(initial[f.key] ?? ''); });
    setForm(next);
    setEditingId(null);
    setShowAdvanced(false);
  };

  const openEdit = (row: Record<string, unknown>) => {
    const mapped = config.adapter.mapRowToForm?.(row) ?? row;
    const next: Record<string, string> = {};
    config.fields.forEach((f) => { next[f.key] = String(mapped[f.key] ?? ''); });
    setForm(next);
    setEditingId(String(row.id));
    setView('form');
  };

  const setField = (key: string, value: string) => {
    const next = { ...form, [key]: value };
    if (config.computedFields) {
      Object.entries(config.computedFields).forEach(([k, fn]) => { next[k] = fn(next); });
    }
    setForm(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { ...form };
    config.fields.forEach((f) => { if (f.type === 'number') payload[f.key] = Number(form[f.key] || 0); });
    const result = editingId && config.adapter.update
      ? config.adapter.update(appState, editingId, payload)
      : config.adapter.create?.(appState, payload) ?? { ok: false, error: 'Create not supported' };
    if (!result.ok) { window.alert(result.error ?? 'Save failed'); return; }
    saveAppState();
    setView('main');
    resetForm();
  };

  if (view === 'form') {
    return (
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50">
        <div className="max-w-4xl mx-auto w-full space-y-6">
          <FormHeader title={editingId ? `Edit ${config.title.replace(/s$/, '')}` : `Create ${config.title.replace(/s$/, '')}`} subtitle={config.subtitle} onBack={() => { setView('main'); resetForm(); }} />
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
              {basicFields.map((field) => (
                <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <label className="block mb-2">{field.label}{field.required ? <span className="text-rose-500"> *</span> : null}</label>
                  <FieldInput field={field} value={form[field.key] ?? ''} onChange={(v) => setField(field.key, v)} />
                </div>
              ))}
            </div>
            {advancedFields.length > 0 && <AdvancedDetailsToggle open={showAdvanced} onToggle={() => setShowAdvanced(!showAdvanced)} />}
            {showAdvanced && advancedFields.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-700">
                {advancedFields.map((field) => (
                  <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                    <label className="block mb-2">{field.label}</label>
                    <FieldInput field={field} value={form[field.key] ?? ''} onChange={(v) => setField(field.key, v)} />
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

  const tabs = config.statusTabs ?? [{ id: 'all', label: 'All' }, { id: 'active', label: 'Active' }, { id: 'pending', label: 'Pending' }];

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 flex flex-col">
      <ListToolbar
        title={config.title}
        subtitle={config.subtitle}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={`Search ${config.title.toLowerCase()}...`}
        onAdd={() => { resetForm(); setView('form'); }}
        addLabel={config.addLabel ?? `Add ${config.title.replace(/s$/, '')}`}
        filters={
          <>
            <FilterTabs tabs={tabs} active={statusFilter} onChange={setStatusFilter} />
            {config.filters?.map((f) => (
              <select key={f.key} value={filterValues[f.key] ?? 'all'} onChange={(e) => setFilterValues({ ...filterValues, [f.key]: e.target.value })} className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 cursor-pointer">
                <option value="all">All {f.label}</option>
                {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ))}
          </>
        }
      />
      {kpis.length > 0 && <KpiCards items={kpis} />}
      <AppTable
        columns={config.columns.map((col) => ({
          key: col.key,
          label: col.label,
          render: (row) =>
            col.render?.(row)
            ?? config.columnRender?.[col.key]?.(row)
            ?? (col.key === 'status' ? <StatusBadge status={String(row.status ?? '—')} /> : String(row[col.key] ?? '—')),
        }))}
        rows={rows}
        emptyMessage="No records yet"
        renderActions={(row) => (
          <>
            {config.rowActions?.(row, { appState, save: saveAppState })}
            <TableIconAction variant="edit" onClick={() => openEdit(row)} />
            {config.adapter.delete && (
              <TableIconAction
                variant="delete"
                onClick={() => {
                  if (window.confirm('Delete?')) {
                    config.adapter.delete!(appState, String(row.id));
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
