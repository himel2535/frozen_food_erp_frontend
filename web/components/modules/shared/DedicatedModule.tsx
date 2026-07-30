'use client';

import { useMemo, useState } from 'react';
import { Footer } from '@/components/layout/Footer';
import { AppFormFields, AppFormModal } from '@/components/shared/AppForm';
import { ListToolbar } from '@/components/shared/ListToolbar';
import { KpiCards, type KpiCardItem } from '@/components/shared/KpiCards';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { FilterTabs } from '@/components/shared/FilterTabs';
import { AppTable } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { useAppStore } from '@/lib/state/app-store';
import type { PortModuleConfig } from '@/lib/modules/port-types';

export interface DedicatedModuleConfig extends PortModuleConfig {
  kpi?: (rows: Record<string, unknown>[]) => KpiCardItem[];
  statusTabs?: { id: string; label: string }[];
  columnRender?: Record<string, (row: Record<string, unknown>) => React.ReactNode>;
  computedFields?: Record<string, (form: Record<string, string>) => string>;
  rowActions?: (row: Record<string, unknown>, ctx: { appState: import('@/lib/state/types').AppState; save: () => void }) => React.ReactNode;
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

  const handleBack = () => {
    setView('main');
    resetForm();
  };

  const entityLabel = config.title.replace(/s$/, '');

  const tabs = config.statusTabs ?? [{ id: 'all', label: 'All' }, { id: 'active', label: 'Active' }, { id: 'pending', label: 'Pending' }];

  return (
    <>
    <div className={MODULE_LIST_SHELL}>
      <ListToolbar
        title={config.title}
        subtitle={config.subtitle}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={`Search ${config.title.toLowerCase()}...`}
        onAdd={() => { resetForm(); setView('form'); }}
        addLabel={config.addLabel ?? `Add ${entityLabel}`}
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
    <AppFormModal
      open={view === 'form'}
      onClose={handleBack}
      title={editingId ? `Edit ${entityLabel}` : `Create ${entityLabel}`}
      subtitle={config.subtitle}
      onSubmit={handleSubmit}
      size="md"
    >
      <AppFormFields
        fields={config.fields}
        values={form}
        onChange={setField}
        showAdvanced={showAdvanced}
        onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
      />
    </AppFormModal>
    </>
  );
}
