'use client';

import { toast, confirmAction } from '@/lib/ui/feedback';

import { useMemo, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useCreateFirstImage } from '@/hooks/use-create-first-image';
import { patchResourceImageUrl } from '@/lib/services/resource-image-patch';
import { Footer } from '@/components/layout/Footer';
import { AppFormFields, AppFormModal } from '@/components/shared/AppForm';
import { ListToolbar, ModuleToolbarActions } from '@/components/shared/ListToolbar';
import { useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { ModuleKpiSection } from '@/components/shared/ModuleKpiSection';
import type { KpiCardItem } from '@/components/shared/KpiCards';
import { getKpiGridClassName } from '@/lib/ui/kpi-grid';
import { MODULE_FILTER_INPUT } from '@/lib/ui/module-chrome-styles';
import { FilterTabs } from '@/components/shared/FilterTabs';
import { AppTable } from '@/components/shared/AppTable';
import { DateDisplay } from '@/components/shared/DateDisplay';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { useLegacyParityConfig } from '@/hooks/use-legacy-parity-config';
import { usePaginatedApiResource } from '@/hooks/use-paginated-api-resource';
import { ListPagination } from '@/components/shared/ListPagination';
import { useAppStore } from '@/lib/state/app-store';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { sortRowsNewestFirst } from '@/lib/services/domain-service';
import { DEDICATED_MODULE_I18N, resolveLabel, type TranslateFn } from '@/lib/i18n/resolve-label';
import type { PortModuleConfig } from '@/lib/modules/port-types';
import type { AppState } from '@/lib/state/types';
import { getLegacyApiModule } from '@/lib/config/extended-api-modules';
import { API_RESOURCE_PATHS, isModuleApiMode, type ApiModule } from '@/lib/config/data-source';
import { isKpiBootLoading, pickApiListRows, shouldShowModuleKpis } from '@/lib/ui/kpi-loading';
import { mapGenericApiRow, mapGenericPayloadToApi } from '@/lib/services/generic-api-mapper';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { apiListEmptyMessage } from '@/lib/services/api-list-ui';

function displayRowField(row: Record<string, unknown>, key: string): string {
  const direct = row[key];
  if (direct != null && String(direct).trim()) return String(direct);
  if (key === 'asset' || key === 'title' || key === 'name') {
    const fallback = [row.asset, row.title, row.name].find((value) => value != null && String(value).trim());
    if (fallback != null) return String(fallback);
  }
  return '—';
}

export interface DedicatedModuleConfig extends PortModuleConfig {
  kpi?: (rows: Record<string, unknown>[]) => KpiCardItem[];
  statusTabs?: { id: string; label: string }[];
  columnRender?: Record<string, (row: Record<string, unknown>) => React.ReactNode>;
  computedFields?: Record<string, (form: Record<string, string>) => string>;
  rowActions?: (row: Record<string, unknown>, ctx: { appState: AppState; save: () => void }) => React.ReactNode;
  hideDefaultRowActions?: (row: Record<string, unknown>) => boolean;
  onRowClick?: (row: Record<string, unknown>) => void;
  rowClassName?: string | ((row: Record<string, unknown>, index: number) => string);
  rowSort?: (a: Record<string, unknown>, b: Record<string, unknown>) => number;
  kpiGridClassName?: string;
  hideAdd?: boolean;
  onAdd?: () => void;
  onEditRow?: (row: Record<string, unknown>) => void;
  hideInlineForm?: boolean;
  transformRows?: (rows: Record<string, unknown>[]) => Record<string, unknown>[];
  customFormBody?: (ctx: {
    form: Record<string, string>;
    setField: (key: string, value: string) => void;
    editingId: string | null;
    appState: AppState;
  }) => ReactNode;
  formModalSize?: 'sm' | 'md' | 'lg';
  formModalTitle?: (editingId: string | null) => string;
  formModalSubtitle?: (editingId: string | null) => string;
  formSubmitLabel?: (editingId: string | null) => string;
  /** Client-side list pagination (local-state modules). */
  listPageSize?: number;
}

export function DedicatedModule({
  config,
  configId,
}: {
  config?: DedicatedModuleConfig;
  configId?: string;
}) {
  const loadedConfig = useLegacyParityConfig(config ? null : configId);
  const activeConfig = config ?? loadedConfig;

  if (!activeConfig) {
    return <AppTable columns={[{ key: 'a', label: 'Loading' }]} rows={[]} loading />;
  }

  const legacyApiModule = getLegacyApiModule(configId);
  if (legacyApiModule && isModuleApiMode(legacyApiModule)) {
    return <DedicatedModuleApiView config={activeConfig} configId={configId} apiModule={legacyApiModule} />;
  }

  return <DedicatedModuleView config={activeConfig} configId={configId} />;
}

function resolveModuleText(
  t: TranslateFn,
  configId: string | undefined,
  config: DedicatedModuleConfig,
  field: 'title' | 'subtitle' | 'addLabel' | 'searchPlaceholder',
): string {
  const keys = configId ? DEDICATED_MODULE_I18N[configId] : undefined;
  if (keys?.[field]) return t(keys[field]!);
  const raw = field === 'title' ? config.title
    : field === 'subtitle' ? config.subtitle
    : field === 'addLabel' ? (config.addLabel ?? '')
    : '';
  if (field === 'searchPlaceholder') {
    return t('crm.search_module', { title: resolveLabel(t, config.title).toLowerCase() });
  }
  return resolveLabel(t, raw);
}

function filterModuleRows(
  source: Record<string, unknown>[],
  config: DedicatedModuleConfig,
  search: string,
  filterValues: Record<string, string>,
  statusFilter: string,
) {
  let data = source;
  if (search) {
    const q = search.toLowerCase();
    const keys = config.searchKeys ?? config.columns.map((c) => c.key);
    data = data.filter((row) =>
      keys.some((k) => `${row.legacyId ?? ''} ${row[k] ?? ''}`.toLowerCase().includes(q)),
    );
  }
  config.filters?.forEach((f) => {
    const val = filterValues[f.key];
    if (val && val !== 'all') data = data.filter((row) => String(row[f.key] ?? '') === val);
  });
  if (statusFilter !== 'all') {
    data = data.filter((row) => String(row.status ?? '').toLowerCase() === statusFilter.toLowerCase());
  }
  if (config.rowSort) {
    data = [...data].sort(config.rowSort);
  } else {
    data = sortRowsNewestFirst(data);
  }
  return data;
}

function DedicatedModuleApiView({
  config,
  configId,
  apiModule,
}: {
  config: DedicatedModuleConfig;
  configId?: string;
  apiModule: ApiModule;
}) {
  const t = useAppStore((s) => s.t);
  const { formatCount, formatMoney } = useLocaleFormat();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const apiStore = usePaginatedApiResource(apiModule, mapGenericApiRow);
  const dateFieldKeys = useMemo(
    () => new Set(config.fields.filter((f) => f.type === 'date').map((f) => f.key)),
    [config.fields],
  );
  const [view, setView] = useState<'main' | 'form'>('main');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const tabStatusIds = useMemo(
    () => new Set((config.statusTabs ?? []).map((tab) => tab.id)),
    [config.statusTabs],
  );

  const allRows = useMemo(() => {
    const apiRows = config.transformRows ? config.transformRows(apiStore.rows) : apiStore.rows;
    return pickApiListRows(true, apiStore.initialized, apiRows, []);
  }, [apiStore.rows, apiStore.initialized, config]);

  const rows = useMemo(() => {
    let data = allRows;
    config.filters?.forEach((f) => {
      const val = filterValues[f.key];
      if (val && val !== 'all') data = data.filter((row) => String(row[f.key] ?? '') === val);
    });
    if (statusFilter !== 'all' && !tabStatusIds.has(statusFilter)) {
      data = data.filter((row) => String(row.status ?? '').toLowerCase() === statusFilter.toLowerCase());
    }
    if (config.rowSort) {
      data = [...data].sort(config.rowSort);
    } else {
      data = sortRowsNewestFirst(data);
    }
    return data;
  }, [allRows, config, filterValues, statusFilter, tabStatusIds]);

  const moduleTitle = resolveModuleText(t, configId, config, 'title');
  const moduleSubtitle = resolveModuleText(t, configId, config, 'subtitle');
  const { onPendingUpload, attachAfterSave } = useCreateFirstImage(
    moduleTitle,
    (id, url, pid) => patchResourceImageUrl(API_RESOURCE_PATHS[apiModule], id, url, pid),
  );

  const localizeKpiValue = (value: string): string => {
    const raw = String(value ?? '').trim();
    if (/^\d+$/.test(raw)) return formatCount(Number(raw));
    const moneyMatch = raw.match(/^৳\s*([\d,]+(?:\.\d+)?)$/);
    if (moneyMatch) {
      const n = Number(moneyMatch[1].replace(/,/g, ''));
      if (!Number.isNaN(n)) return formatMoney(n, { decimals: 2 });
    }
    return raw;
  };

  const kpis = useMemo(() => {
    if (config.kpi) {
      return config.kpi(allRows).map((item) => ({
        ...item,
        label: resolveLabel(t, item.label),
        value: localizeKpiValue(String(item.value ?? '')),
      }));
    }
    return [
      { key: 'total', label: t('common.total_entity', { title: moduleTitle }), value: formatCount(apiStore.meta.total) },
      {
        key: 'page',
        label: t('crm.kpi_active_records'),
        value: formatCount(allRows.filter((r) => ['active', 'approved', 'paid', 'completed', 'received', 'present'].includes(String(r.status ?? '').toLowerCase())).length),
      },
    ];
  }, [config, allRows, apiStore.meta.total, t, moduleTitle, formatCount, formatMoney]);

  const buildFormState = (initial: Record<string, unknown>) => {
    const next: Record<string, string> = {};
    config.fields.forEach((f) => { next[f.key] = String(initial[f.key] ?? ''); });
    Object.entries(initial).forEach(([k, v]) => { next[k] = String(v ?? ''); });
    return next;
  };

  const resetFilters = () => {
    apiStore.setSearchTerm('');
    setStatusFilter('all');
    apiStore.setStatusFilter('all');
    const cleared: Record<string, string> = {};
    config.filters?.forEach((f) => { cleared[f.key] = 'all'; });
    setFilterValues(cleared);
  };

  const handleStatusTabChange = (tabId: string) => {
    setStatusFilter(tabId);
    if (tabId === 'all' || tabStatusIds.has(tabId)) {
      apiStore.setStatusFilter(tabId);
    } else {
      apiStore.setStatusFilter('all');
    }
  };

  const resetForm = () => {
    const initial = config.adapter.getInitialForm?.(appState) ?? {};
    setForm(buildFormState(initial));
    setEditingId(null);
    setShowAdvanced(false);
  };

  const openEdit = (row: Record<string, unknown>) => {
    const mapped = config.adapter.mapRowToForm?.(row) ?? row;
    setForm(buildFormState(mapped as Record<string, unknown>));
    setEditingId(String(row._mongoId ?? row.id ?? ''));
    setView('form');
  };

  const setField = (key: string, value: string) => {
    const next = { ...form, [key]: value };
    if (config.computedFields) {
      Object.entries(config.computedFields).forEach(([k, fn]) => { next[k] = fn(next); });
    }
    setForm(next);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();
    const payload: Record<string, unknown> = { ...form };
    config.fields.forEach((f) => { if (f.type === 'number') payload[f.key] = Number(form[f.key] || 0); });
    const body = mapGenericPayloadToApi(payload);
    const result = editingId
      ? await apiStore.update(editingId, body)
      : await apiStore.create(body);
    if (!result.ok) {
      toast.error('Operation failed', { module: moduleTitle, description: 'error' in result ? String(result.error) : 'Save failed' });
      return false;
    }
    const imageField = config.fields.find((f) => f.type === 'image');
    const savedUrl = String(form[imageField?.key ?? 'imageUrl'] ?? '');
    const recordId = editingId || ('id' in result ? String(result.id) : '');
    attachAfterSave(recordId, savedUrl);
    toast.success('Saved', { module: moduleTitle, description: editingId ? 'Record updated.' : 'Record added.' });
    if (!editingId) resetFilters();
    setView('main');
    resetForm();
    return true;
  };

  const handleBack = () => {
    setView('main');
    resetForm();
  };

  const entityLabel = moduleTitle.replace(/s$/, '');
  const tabs = (config.statusTabs ?? [
    { id: 'all', label: 'common.all' },
    { id: 'active', label: 'common.active' },
    { id: 'pending', label: 'common.pending' },
  ]).map((tab) => ({ ...tab, label: resolveLabel(t, tab.label) }));

  const handleAdd = useCallback(() => {
    if (config.onAdd) {
      config.onAdd();
      return;
    }
    resetForm();
    setView('form');
  }, [config, resetForm]);

  const resolvedAddLabel = config.addLabel
    ? resolveLabel(t, config.addLabel)
    : resolveModuleText(t, configId, config, 'addLabel') || t('crm.add_entity', { entity: entityLabel });

  useRegisterModuleActions(
    config.hideAdd ? null : (
      <ModuleToolbarActions onAdd={handleAdd} addLabel={resolvedAddLabel} />
    ),
    [handleAdd, resolvedAddLabel, config.hideAdd],
  );

  const emptyLabel = moduleTitle.toLowerCase();
  const emptyMessage = apiListEmptyMessage(apiStore.loading, apiStore.initialized, emptyLabel, {
    totalCount: apiStore.meta.total,
    filteredCount: rows.length,
  });

  const bootLoading = isKpiBootLoading(true, apiStore.initialized);

  return (
    <>
      <ApiModeBanner module={apiModule} error={apiStore.error} />
      {shouldShowModuleKpis(bootLoading, kpis.length) && (
        <ModuleKpiSection
          items={kpis}
          loading={bootLoading}
          kpiCount={kpis.length || 4}
          gridClassName={config.kpiGridClassName ?? getKpiGridClassName(kpis.length || 4)}
        />
      )}
      <ListToolbar
        search={apiStore.search}
        onSearchChange={apiStore.setSearchTerm}
        searchPlaceholder={resolveModuleText(t, configId, config, 'searchPlaceholder')}
        filters={
          <>
            <FilterTabs tabs={tabs} active={statusFilter} onChange={handleStatusTabChange} />
            {config.filters?.map((f) => (
              <select key={f.key} value={filterValues[f.key] ?? 'all'} onChange={(e) => setFilterValues({ ...filterValues, [f.key]: e.target.value })} className={MODULE_FILTER_INPUT}>
                <option value="all">{t('common.all_filter', { label: resolveLabel(t, f.label) })}</option>
                {f.options.map((o) => <option key={o.value} value={o.value}>{resolveLabel(t, o.label)}</option>)}
              </select>
            ))}
          </>
        }
      />
      <AppTable
        columns={config.columns.map((col) => ({
          key: col.key,
          label: resolveLabel(t, col.label),
          render: (row) => {
            if (col.render) return col.render(row);
            if (config.columnRender?.[col.key]) return config.columnRender[col.key]!(row);
            if (col.key === 'status') return <StatusBadge status={String(row.status ?? '—')} />;
            if (col.key === 'id') return String(row.legacyId ?? row.id ?? '—');
            if (dateFieldKeys.has(col.key)) {
              return <DateDisplay value={row[col.key] as string} variant="slash" />;
            }
            return displayRowField(row, col.key);
          },
        }))}
        rows={rows}
        loading={bootLoading}
        emptyMessage={emptyMessage}
        onRowClick={config.onRowClick}
        rowClassName={config.rowClassName}
        renderActions={(row) => (
          <>
            {config.rowActions?.(row, {
              appState,
              save: () => {
                saveAppState({ immediate: true });
                void apiStore.reload();
              },
            })}
            {!config.hideDefaultRowActions?.(row) && (
              <>
                <TableIconAction
                  variant="edit"
                  onClick={() => {
                    if (config.onEditRow) {
                      config.onEditRow(row);
                      return;
                    }
                    openEdit(row);
                  }}
                />
                <TableIconAction
                  variant="delete"
                  onClick={() => {
                    confirmAction({
                      title: t('common.delete'),
                      message: t('common.delete_confirm'),
                      confirmLabel: t('common.delete'),
                      tone: 'danger',
                      module: moduleTitle,
                    }).then(async (__ok) => {
                      if (!__ok) return;
                      const result = await apiStore.remove(String(row._mongoId ?? row.id ?? ''));
                      if (!result.ok) toast.error('Delete failed', { module: moduleTitle, description: result.error });
                    });
                  }}
                />
              </>
            )}
          </>
        )}
      />
      <ListPagination
        page={apiStore.page}
        pageSize={apiStore.pageSize}
        total={apiStore.meta.total}
        onPageChange={apiStore.setPage}
      />
      <Footer />
      {!config.hideInlineForm && (
        <AppFormModal
          open={view === 'form'}
          onClose={handleBack}
          title={config.formModalTitle?.(editingId) ?? (editingId ? t('crm.edit_entity', { entity: entityLabel }) : t('crm.create_entity', { entity: entityLabel }))}
          subtitle={config.formModalSubtitle?.(editingId) ?? moduleSubtitle}
          onSubmit={handleSubmit}
          submitLabel={config.formSubmitLabel?.(editingId) ?? (editingId ? t('common.save') : t('common.create'))}
          size={config.formModalSize ?? 'md'}
          onPendingUpload={onPendingUpload}
        >
          {config.customFormBody ? (
            config.customFormBody({ form, setField, editingId, appState })
          ) : (
            <AppFormFields
              fields={config.fields.map((f) => ({ ...f, label: resolveLabel(t, f.label) }))}
              values={form}
              onChange={setField}
              showAdvanced={showAdvanced}
              onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
            />
          )}
        </AppFormModal>
      )}
    </>
  );
}

function DedicatedModuleView({ config, configId }: { config: DedicatedModuleConfig; configId?: string }) {
  const t = useAppStore((s) => s.t);
  const { formatCount, formatMoney } = useLocaleFormat();
  const dateFieldKeys = useMemo(
    () => new Set(config.fields.filter((f) => f.type === 'date').map((f) => f.key)),
    [config.fields],
  );
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [view, setView] = useState<'main' | 'form'>('main');
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const listPageSize = config.listPageSize ?? 0;

  const rows = useMemo(
    () => filterModuleRows(config.adapter.list(appState), config, search, filterValues, statusFilter),
    [appState, config, search, filterValues, statusFilter],
  );

  useEffect(() => {
    setPage(1);
  }, [search, filterValues, statusFilter]);

  const displayRows = useMemo(() => {
    if (!listPageSize || listPageSize <= 0) return rows;
    const start = (page - 1) * listPageSize;
    return rows.slice(start, start + listPageSize);
  }, [rows, page, listPageSize]);

  const moduleTitle = resolveModuleText(t, configId, config, 'title');
  const moduleSubtitle = resolveModuleText(t, configId, config, 'subtitle');

  const localizeKpiValue = (value: string): string => {
    const raw = String(value ?? '').trim();
    if (/^\d+$/.test(raw)) return formatCount(Number(raw));
    // Money from legacy helpers: "৳1,234.56" or "৳1234"
    const moneyMatch = raw.match(/^৳\s*([\d,]+(?:\.\d+)?)$/);
    if (moneyMatch) {
      const n = Number(moneyMatch[1].replace(/,/g, ''));
      if (!Number.isNaN(n)) return formatMoney(n, { decimals: 2 });
    }
    return raw;
  };

  const kpis = useMemo(() => {
    if (config.kpi) {
      return config.kpi(rows).map((item) => ({
        ...item,
        label: resolveLabel(t, item.label),
        value: localizeKpiValue(String(item.value ?? '')),
      }));
    }
    return [
      { key: 'total', label: t('common.total_entity', { title: moduleTitle }), value: formatCount(rows.length) },
      {
        key: 'active',
        label: t('crm.kpi_active_records'),
        value: formatCount(rows.filter((r) => ['active', 'approved', 'paid', 'completed', 'received', 'present'].includes(String(r.status ?? '').toLowerCase())).length),
      },
    ];
  }, [config, rows, t, moduleTitle, formatCount, formatMoney]);

  const buildFormState = (initial: Record<string, unknown>) => {
    const next: Record<string, string> = {};
    config.fields.forEach((f) => { next[f.key] = String(initial[f.key] ?? ''); });
    Object.entries(initial).forEach(([k, v]) => {
      next[k] = String(v ?? '');
    });
    return next;
  };

  const resetForm = () => {
    const initial = config.adapter.getInitialForm?.(appState) ?? {};
    setForm(buildFormState(initial));
    setEditingId(null);
    setShowAdvanced(false);
  };

  const openEdit = (row: Record<string, unknown>) => {
    const mapped = config.adapter.mapRowToForm?.(row) ?? row;
    setForm(buildFormState(mapped as Record<string, unknown>));
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

  const handleSubmit = (e: React.FormEvent): boolean => {
    e.preventDefault();
    const payload: Record<string, unknown> = { ...form };
    config.fields.forEach((f) => { if (f.type === 'number') payload[f.key] = Number(form[f.key] || 0); });
    const result = editingId && config.adapter.update
      ? config.adapter.update(appState, editingId, payload)
      : config.adapter.create?.(appState, payload) ?? { ok: false, error: 'Create not supported' };
    if (!result.ok) {
      toast.error('Operation failed', { module: 'Module', description: String(result.error ?? 'Save failed') });
      return false;
    }
    if (!editingId) {
      setSearch('');
      setStatusFilter('all');
      const cleared: Record<string, string> = {};
      config.filters?.forEach((f) => { cleared[f.key] = 'all'; });
      setFilterValues(cleared);
    }
    saveAppState();
    setView('main');
    resetForm();
    return true;
  };

  const handleBack = () => {
    setView('main');
    resetForm();
  };

  const entityLabel = moduleTitle.replace(/s$/, '');

  const tabs = (config.statusTabs ?? [
    { id: 'all', label: 'common.all' },
    { id: 'active', label: 'common.active' },
    { id: 'pending', label: 'common.pending' },
  ]).map((tab) => ({ ...tab, label: resolveLabel(t, tab.label) }));

  const handleAdd = useCallback(() => {
    if (config.onAdd) {
      config.onAdd();
      return;
    }
    resetForm();
    setView('form');
  }, [config, resetForm]);

  const resolvedAddLabel = config.addLabel
    ? resolveLabel(t, config.addLabel)
    : resolveModuleText(t, configId, config, 'addLabel') || t('crm.add_entity', { entity: entityLabel });

  useRegisterModuleActions(
    config.hideAdd ? null : (
      <ModuleToolbarActions onAdd={handleAdd} addLabel={resolvedAddLabel} />
    ),
    [handleAdd, resolvedAddLabel, config.hideAdd],
  );

  return (
    <>
      {kpis.length > 0 && (
        <ModuleKpiSection
          items={kpis}
          gridClassName={config.kpiGridClassName ?? getKpiGridClassName(kpis.length)}
        />
      )}
      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={resolveModuleText(t, configId, config, 'searchPlaceholder')}
        filters={
          <>
            <FilterTabs tabs={tabs} active={statusFilter} onChange={setStatusFilter} />
            {config.filters?.map((f) => (
              <select key={f.key} value={filterValues[f.key] ?? 'all'} onChange={(e) => setFilterValues({ ...filterValues, [f.key]: e.target.value })} className={MODULE_FILTER_INPUT}>
                <option value="all">{t('common.all_filter', { label: resolveLabel(t, f.label) })}</option>
                {f.options.map((o) => <option key={o.value} value={o.value}>{resolveLabel(t, o.label)}</option>)}
              </select>
            ))}
          </>
        }
      />
      <AppTable
        columns={config.columns.map((col) => ({
          key: col.key,
          label: resolveLabel(t, col.label),
          render: (row) => {
            if (col.render) return col.render(row);
            if (config.columnRender?.[col.key]) return config.columnRender[col.key]!(row);
            if (col.key === 'status') return <StatusBadge status={String(row.status ?? '—')} />;
            if (dateFieldKeys.has(col.key)) {
              return <DateDisplay value={row[col.key] as string} variant="slash" />;
            }
            return displayRowField(row, col.key);
          },
        }))}
        rows={displayRows}
        emptyMessage={t('common.no_records_yet')}
        onRowClick={config.onRowClick}
        rowClassName={config.rowClassName}
        renderActions={(row) => (
          <>
            {config.rowActions?.(row, { appState, save: saveAppState })}
            {!config.hideDefaultRowActions?.(row) && (
              <>
                <TableIconAction
                  variant="edit"
                  onClick={() => {
                    if (config.onEditRow) {
                      config.onEditRow(row);
                      return;
                    }
                    openEdit(row);
                  }}
                />
                {config.adapter.delete && (
                  <TableIconAction
                    variant="delete"
                    onClick={() => {
                      confirmAction({
                        title: t('common.delete'),
                        message: t('common.delete_confirm'),
                        confirmLabel: t('common.delete'),
                        tone: 'danger',
                        module: moduleTitle,
                      }).then((__ok) => {
                        if (!__ok) return;
                        config.adapter.delete!(appState, String(row.id));
                        saveAppState();
                      });
                    }}
                  />
                )}
              </>
            )}
          </>
        )}
      />
      {listPageSize > 0 && (
        <ListPagination
          page={page}
          pageSize={listPageSize}
          total={rows.length}
          onPageChange={setPage}
        />
      )}
      <Footer />
    {!config.hideInlineForm && (
    <AppFormModal
      open={view === 'form'}
      onClose={handleBack}
      title={config.formModalTitle?.(editingId) ?? (editingId ? t('crm.edit_entity', { entity: entityLabel }) : t('crm.create_entity', { entity: entityLabel }))}
      subtitle={config.formModalSubtitle?.(editingId) ?? moduleSubtitle}
      onSubmit={handleSubmit}
      submitLabel={config.formSubmitLabel?.(editingId) ?? (editingId ? t('common.save') : t('common.create'))}
      size={config.formModalSize ?? 'md'}
    >
      {config.customFormBody ? (
        config.customFormBody({ form, setField, editingId, appState })
      ) : (
        <AppFormFields
          fields={config.fields.map((f) => ({ ...f, label: resolveLabel(t, f.label) }))}
          values={form}
          onChange={setField}
          showAdvanced={showAdvanced}
          onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
        />
      )}
    </AppFormModal>
    )}
    </>
  );
}
