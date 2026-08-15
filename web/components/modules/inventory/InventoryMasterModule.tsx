'use client';

import { toast, confirmAction } from '@/lib/ui/feedback';

import { useMemo, useState, useCallback } from 'react';
import { Footer } from '@/components/layout/Footer';
import { AppFormFields, AppFormModal } from '@/components/shared/AppForm';
import { ListToolbar, ModuleToolbarActions } from '@/components/shared/ListToolbar';
import { useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { useInventoryEditAccess } from '@/hooks/use-inventory-edit-access';
import { InventoryEditActions } from '@/components/modules/inventory/shared/inventory-ui';
import { ModuleKpiSection } from '@/components/shared/ModuleKpiSection';
import type { KpiCardItem } from '@/components/shared/KpiCards';
import { FilterTabs } from '@/components/shared/FilterTabs';
import { AppTable } from '@/components/shared/AppTable';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { useAppStore } from '@/lib/state/app-store';
import { sortInventoryRowsNewestFirst } from '@/lib/services/inventory-service';
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

export function InventoryMasterModule({ config }: { config: InventoryMasterConfig }) {
  const { canEdit, guardEdit } = useInventoryEditAccess();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [view, setView] = useState<'main' | 'form'>('main');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const rows = useMemo(() => {
    let data = config.list(appState);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((row) => config.searchKeys.some((k) => String(row[k] ?? '').toLowerCase().includes(q)));
    }
    if (statusFilter !== 'all') {
      data = data.filter((row) => String(row.status ?? '').toLowerCase() === statusFilter.toLowerCase());
    }
    return sortInventoryRowsNewestFirst(data);
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

  const setField = (key: string, value: string) => {
    setForm({ ...form, [key]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && !guardEdit()) return;
    const payload: Record<string, unknown> = { ...form };
    config.fields.forEach((f) => { if (f.type === 'number') payload[f.key] = Number(form[f.key] || 0); });
    const result = editingId ? config.update(appState, editingId, payload) : config.create(appState, payload);
    if (!result.ok) { toast.error('Operation failed', { module: 'Inventory', description: 'error' in result ? String(result.error) : 'Save failed' }); return; }
    saveAppState();
    setView('main');
    resetForm();
  };

  const handleBack = () => {
    setView('main');
    resetForm();
  };

  const tabs = config.statusTabs ?? [{ id: 'all', label: 'All' }, { id: 'active', label: 'Active' }, { id: 'inactive', label: 'Inactive' }];

  const handleAdd = useCallback(() => {
    resetForm();
    setView('form');
  }, [resetForm]);

  useRegisterModuleActions(
    <ModuleToolbarActions onAdd={handleAdd} addLabel={config.addLabel} />,
    [handleAdd, config.addLabel],
  );

  return (
    <>
      {kpis.length > 0 && <ModuleKpiSection items={kpis} />}
      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={`Search ${config.title.toLowerCase()}...`}
        filters={<FilterTabs tabs={tabs} active={statusFilter} onChange={setStatusFilter} />}
      />
      <AppTable
        columns={config.columns.map((col) => ({
          key: col.key,
          label: col.label,
          render: (row) => (col.render ? col.render(row) : String(row[col.key] ?? '—')),
        }))}
        rows={rows}
        emptyMessage="No records"
        renderActions={(row) => (
          <InventoryEditActions canEdit={canEdit}>
            <TableIconAction variant="edit" onClick={() => { if (!guardEdit()) return; openEdit(row); }} />
            {config.delete && (
              <TableIconAction
                variant="delete"
                onClick={() => {
                  if (!guardEdit()) return;
                  confirmAction({ title: 'Delete', message: 'Delete?', confirmLabel: 'Delete', tone: 'danger', module: 'Inventory' }).then((__ok) => {
                    if (!__ok) return;
                    config.delete!(appState, String(row.id));
                    saveAppState();
                  });
                }}
              />
            )}
          </InventoryEditActions>
        )}
      />
      <Footer />
    <AppFormModal
      open={view === 'form'}
      onClose={handleBack}
      title={editingId ? `Edit ${config.title}` : `Create ${config.title}`}
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
