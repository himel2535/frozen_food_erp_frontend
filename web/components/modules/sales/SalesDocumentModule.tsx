'use client';

import { confirmAction, toast } from '@/lib/ui/feedback';

import { useMemo, useState, useCallback } from 'react';
import { Button } from '@/components/shared/Button';
import { Footer } from '@/components/layout/Footer';
import { useChromeSuppressed, useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { AppFormPage, FORM_GRID_CLS, FORM_INPUT_CLS, FORM_LABEL_CLS, FORM_SELECT_CLS, FORM_TEXTAREA_CLS } from '@/components/shared/AppForm';
import { ListToolbar, ModuleToolbarActions } from '@/components/shared/ListToolbar';
import { ModuleKpiSection } from '@/components/shared/ModuleKpiSection';
import type { KpiCardItem } from '@/components/shared/KpiCards';
import { FilterTabs } from '@/components/shared/FilterTabs';
import { DetailViewShell } from '@/components/shared/DetailViewShell';
import { LineItemsEditor, type LineItem } from '@/components/shared/LineItemsEditor';
import { AdvancedDetailsToggle } from '@/components/shared/AdvancedDetailsToggle';
import { DateInput } from '@/components/shared/DateInput';
import { AppTable } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { useAppStore } from '@/lib/state/app-store';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { sortRowsNewestFirst } from '@/lib/services/domain-service';
import { translateStatus } from '@/lib/i18n/resolve-label';
import type { ApiModule } from '@/lib/config/data-source';
import { usePaginatedApiResource } from '@/hooks/use-paginated-api-resource';
import { ListPagination } from '@/components/shared/ListPagination';
import { mapApiSalesDocRow, mapSalesDocToApi, resolveApiRowId, convertQuotationToOrderViaApi } from '@/lib/services/entity-api-mappers';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { isModuleBootLoading, shouldShowModuleKpis } from '@/lib/ui/kpi-loading';

const PAGE_SIZE = 25;

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
  showLineItems?: boolean;
  customerField?: boolean;
  convertLabel?: string;
  apiModule: ApiModule;
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
  const t = useAppStore((s) => s.t);
  const { formatMoney } = useLocaleFormat();
  const apiStore = usePaginatedApiResource(config.apiModule, mapApiSalesDocRow, { pageSize: PAGE_SIZE });
  const bootLoading = isModuleBootLoading(true, apiStore.initialized);
  const [view, setView] = useState<'main' | 'form' | 'detail'>('main');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({ customer: '', status: config.statusOptions[0] ?? 'draft', notes: '', date: new Date().toISOString().slice(0, 10) });
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  const rows = useMemo(() => {
    let data = apiStore.rows;
    if (statusFilter !== 'all') {
      data = data.filter((row) => String(row.status ?? '').toLowerCase() === statusFilter);
    }
    return sortRowsNewestFirst(data);
  }, [apiStore.rows, statusFilter]);

  const kpis = useMemo(() => (config.kpi ? config.kpi(rows) : []), [config, rows]);
  const detailRow = useMemo(() => rows.find((r) => String(r.id) === detailId), [rows, detailId]);

  const total = lineItems.reduce((s, i) => s + i.qty * i.rate, 0);

  const resetForm = () => {
    setForm({ customer: '', status: config.statusOptions[0] ?? 'draft', notes: '', date: new Date().toISOString().slice(0, 10) });
    setLineItems([{ id: 'li-1', description: '', qty: 1, rate: 0 }]);
    setEditingId(null);
    setShowAdvanced(false);
  };

  useChromeSuppressed(view !== 'main');

  const handleAdd = useCallback(() => {
    resetForm();
    setView('form');
  }, []);

  useRegisterModuleActions(
    view === 'main' ? <ModuleToolbarActions onAdd={handleAdd} addLabel={config.addLabel} /> : null,
    [view, handleAdd, config.addLabel],
  );

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      customerName: form.customer,
      items: config.showLineItems ? lineItemsToPayload(lineItems) : undefined,
      total: config.showLineItems ? total : Number((form as Record<string, unknown>).total ?? 0),
      amount: config.showLineItems ? total : Number((form as Record<string, unknown>).amount ?? (form as Record<string, unknown>).total ?? 0),
    };

    const body = mapSalesDocToApi({ ...payload, id: editingId ?? undefined }, editingId ?? undefined);
    const editRow = editingId ? rows.find((r) => String(r.id) === editingId) : null;
    const mongoId = editRow ? resolveApiRowId(editRow) : '';
    const result = editingId && mongoId
      ? await apiStore.update(mongoId, body)
      : await apiStore.create(body);
    if (!result.ok) {
      toast.error('Operation failed', { module: 'Sales', description: 'error' in result ? String(result.error) : 'Save failed' });
      return;
    }
    setView('main');
    resetForm();
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmAction({
      title: t('sales.delete_record'),
      message: t('sales.delete_record_confirm'),
      confirmLabel: t('common.delete'),
      tone: 'danger',
      module: config.title,
    });
    if (!ok) return;
    const row = rows.find((r) => String(r.id) === id);
    if (!row) return;
    const result = await apiStore.remove(resolveApiRowId(row));
    if (!result.ok) {
      toast.error('Operation failed', { module: 'Sales', description: 'error' in result ? String(result.error) : 'Delete failed' });
    }
  };

  const handleConvertQuotation = async () => {
    if (!detailRow || config.apiModule !== 'quotations') return;
    const r = await convertQuotationToOrderViaApi(detailRow);
    if (r.ok) {
      await apiStore.reload();
      toast.success('Order created', { module: 'Sales', description: `Sales order ${r.id} created from quotation` });
      setView('main');
      setDetailId(null);
    } else {
      toast.error('Operation failed', { module: 'Sales', description: 'error' in r ? String(r.error) : 'Failed' });
    }
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
              {config.apiModule === 'quotations' && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => void handleConvertQuotation()}
                >
                  {config.convertLabel ?? t('common.convert')}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openEdit(detailRow)}
              >
                {t('common.edit')}
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div><span className="text-slate-500 font-semibold">{t('sales.col_status')}</span><div className="mt-1"><StatusBadge status={String(detailRow.status)} /></div></div>
            <div><span className="text-slate-500 font-semibold">{t('sales.col_customer')}</span><div className="mt-1 font-bold">{String(detailRow.customer ?? '—')}</div></div>
            <div><span className="text-slate-500 font-semibold">{t('sales.col_date')}</span><div className="mt-1 font-bold">{String(detailRow.date ?? '—')}</div></div>
            <div><span className="text-slate-500 font-semibold">{t('sales.col_total')}</span><div className="mt-1 font-extrabold">{formatMoney(docTotal)}</div></div>
          </div>
          {config.showLineItems && <LineItemsEditor items={items} onChange={() => {}} readOnly />}
          {detailRow.notes ? <p className="text-xs text-slate-600">{String(detailRow.notes)}</p> : null}
        </DetailViewShell>
        <Footer />
      </>
    );
  }

  if (view === 'form') {
    const formTitle = editingId ? t('crm.edit_entity', { entity: config.title }) : t('crm.create_entity', { entity: config.title });

    return (
      <AppFormPage
        title={formTitle}
        subtitle={config.subtitle}
        onBack={() => { setView('main'); resetForm(); }}
        onSubmit={handleSubmit}
        submitLabel={t('common.save')}
      >
        <div className={FORM_GRID_CLS}>
          {config.customerField !== false && (
            <div>
              <label className={FORM_LABEL_CLS}>{t('sales.col_customer')} <span className="text-rose-500">*</span></label>
              <input required value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} className={FORM_INPUT_CLS} />
            </div>
          )}
          <div>
            <label className={FORM_LABEL_CLS}>{t('sales.col_date')}</label>
            <DateInput value={form.date} onChange={(date) => setForm({ ...form, date })} className={`${FORM_INPUT_CLS} cursor-pointer`} />
          </div>
          <div>
            <label className={FORM_LABEL_CLS}>{t('sales.col_status')}</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={FORM_SELECT_CLS}>
              {config.statusOptions.map((s) => <option key={s} value={s}>{translateStatus(t, s)}</option>)}
            </select>
          </div>
        </div>
        {config.showLineItems && <LineItemsEditor items={lineItems} onChange={setLineItems} />}
        {config.showLineItems && (
          <div className="text-right text-sm font-extrabold text-slate-900">{t('sales.col_total')}: {formatMoney(total)}</div>
        )}
        <AdvancedDetailsToggle open={showAdvanced} onToggle={() => setShowAdvanced(!showAdvanced)} />
        {showAdvanced && (
          <div>
            <label className={FORM_LABEL_CLS}>{t('crm.form_notes')}</label>
            <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={FORM_TEXTAREA_CLS} />
          </div>
        )}
      </AppFormPage>
    );
  }

  const tabs = config.statusFilterTabs ?? [{ id: 'all', label: t('common.all') }, ...config.statusOptions.map((s) => ({ id: s, label: translateStatus(t, s) }))];

  return (
    <>
      <ApiModeBanner module={config.apiModule} error={apiStore.error} />
      {shouldShowModuleKpis(bootLoading, kpis.length) && (
        <ModuleKpiSection items={kpis} loading={bootLoading} />
      )}
      <ListToolbar
        search={apiStore.search}
        onSearchChange={apiStore.setSearchTerm}
        searchPlaceholder={t('crm.search_module', { title: config.title.toLowerCase() })}
        filters={<FilterTabs tabs={tabs} active={statusFilter} onChange={(v) => { setStatusFilter(v); apiStore.setPage(1); }} />}
      />
      <AppTable
        columns={config.columns.map((col) => ({
          key: col.key,
          label: col.label,
          render: (row) => (col.render ? col.render(row) : String(row[col.key] ?? '—')),
        }))}
        rows={rows}
        loading={bootLoading}
        emptyMessage={t('common.no_records_yet')}
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
            <TableIconAction variant="delete" onClick={() => handleDelete(String(row.id))} />
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
    </>
  );
}
