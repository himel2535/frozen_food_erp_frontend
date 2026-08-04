'use client';

import { toast } from '@/lib/ui/feedback';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { useChromeSuppressed, useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { AppFormFields, AppFormModal, FORM_GRID_CLS, FORM_LABEL_CLS, FORM_SELECT_CLS } from '@/components/shared/AppForm';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { KanbanBoard, type KanbanCard } from '@/components/shared/KanbanBoard';
import { useAppStore } from '@/lib/state/app-store';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { translateStatus } from '@/lib/i18n/resolve-label';
import {
  DEAL_STAGES,
  DEAL_STAGE_LABELS,
  getDealList,
  getOwnerOptions,
  createDeal,
  updateDeal,
  updateDealStage,
  getDealMetrics,
  getDealTimeline,
  getDealById,
  markDealWon,
  markDealLost,
} from '@/lib/services/crm-service';
import { KpiCards } from '@/components/shared/KpiCards';
import type { PortField } from '@/lib/modules/port-types';
import { ProfileDrawer } from '@/components/shared/ProfileDrawer';

const DEAL_FORM_FIELDS: PortField[] = [
  { key: 'title', label: 'Deal Title', required: true },
  { key: 'company', label: 'Company', required: true },
  { key: 'contactPerson', label: 'Contact Person' },
  { key: 'phone', label: 'Phone', type: 'phone' },
  { key: 'stage', label: 'Stage', type: 'select', options: [...DEAL_STAGES] },
  { key: 'expectedValue', label: 'Expected Value', type: 'number' },
  { key: 'probability', label: 'Probability %', type: 'number' },
  { key: 'expectedCloseDate', label: 'Expected Close Date', type: 'date' },
  { key: 'productsSummary', label: 'Products Summary' },
  { key: 'competitor', label: 'Competitor', advanced: true },
  { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
];

export function DealsPage() {
  const t = useAppStore((s) => s.t);
  const { formatMoney, formatCount } = useLocaleFormat();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [view, setView] = useState<'main' | 'form'>('main');
  const [search, setSearch] = useState('');
  const [layoutMode, setLayoutMode] = useState<'kanban' | 'table'>('kanban');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({
    title: '',
    company: '',
    contactPerson: '',
    phone: '',
    stage: 'new-opportunity',
    expectedValue: '',
    probability: '50',
    expectedCloseDate: '',
    assignedRepId: '',
    productsSummary: '',
    notes: '',
    competitor: '',
  });

  const owners = useMemo(() => getOwnerOptions(appState), [appState]);

  const deals = useMemo(() => {
    return (getDealList(appState) as Array<Record<string, unknown>>).filter((deal) => {
      const hay = `${deal.title} ${deal.company} ${deal.contactPerson}`.toLowerCase();
      return !search || hay.includes(search.toLowerCase());
    });
  }, [appState, search]);

  const columns = useMemo(() => {
    return DEAL_STAGES.map((stage) => ({
      id: stage,
      title: translateStatus(t, stage),
      cards: deals
        .filter((d) => d.stage === stage)
        .map(
          (d): KanbanCard => ({
            id: String(d.id),
            title: String(d.title),
            subtitle: String(d.company),
            meta: formatMoney(Number(d.expectedValue || 0)),
            stage,
          })
        ),
    }));
  }, [deals, t, formatMoney]);

  const dealListColumns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    {
      key: 'title',
      label: t('crm.col_deal'),
      render: (row) => (
        <>
          <div className="font-bold">{String(row.title)}</div>
          <div className="text-slate-500">{String(row.company)}</div>
        </>
      ),
    },
    {
      key: 'stage',
      label: t('crm.col_stage'),
      render: (row) => translateStatus(t, String(row.stage)),
    },
    {
      key: 'value',
      label: t('crm.col_value'),
      render: (row) => <span className="font-bold">{formatMoney(Number(row.expectedValue || 0))}</span>,
    },
  ], [t, formatMoney]);

  const resetForm = () => {
    setForm({
      title: '',
      company: '',
      contactPerson: '',
      phone: '',
      stage: 'new-opportunity',
      expectedValue: '',
      probability: '50',
      expectedCloseDate: new Date().toISOString().slice(0, 10),
      assignedRepId: owners[0]?.id ?? '',
      productsSummary: '',
      notes: '',
      competitor: '',
    });
    setEditingId(null);
    setShowAdvanced(false);
  };

  const openCreate = () => {
    resetForm();
    setView('form');
  };

  const pipelineValue = deals.reduce((s, d) => s + Number(d.expectedValue || 0), 0);
  const metrics = useMemo(() => getDealMetrics(appState), [appState]);
  const detailDeal = detailId ? getDealById(appState, detailId) : null;
  const timeline = useMemo(() => (detailId ? getDealTimeline(appState, detailId) : []), [appState, detailId]);

  const openEdit = (ref: string | KanbanCard) => {
    const id = typeof ref === 'string' ? ref : ref.id;
    const deal = deals.find((d) => String(d.id) === id);
    if (!deal) return;
    setForm({
      title: String(deal.title ?? ''),
      company: String(deal.company ?? ''),
      contactPerson: String(deal.contactPerson ?? ''),
      phone: String(deal.phone ?? ''),
      stage: String(deal.stage ?? 'new-opportunity'),
      expectedValue: String(deal.expectedValue ?? ''),
      probability: String(deal.probability ?? '50'),
      expectedCloseDate: String(deal.expectedCloseDate ?? '').slice(0, 10),
      assignedRepId: String(deal.assignedRepId ?? owners[0]?.id ?? ''),
      productsSummary: String(deal.productsSummary ?? ''),
      notes: String(deal.notes ?? ''),
      competitor: String(deal.competitor ?? ''),
    });
    setEditingId(String(deal.id));
    setView('form');
  };

  const handleStageChange = (cardId: string, _fromStage: string, toStage: string) => {
    const result = updateDealStage(appState, cardId, toStage);
    if (!result.ok) {
      toast.error('Operation failed', { module: 'Deals', description: String(result.error ?? 'Stage update failed') });
      return;
    }
    saveAppState();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const owner = owners.find((o: { id: string; name: string }) => o.id === form.assignedRepId) || owners[0];
    const payload = {
      title: form.title,
      company: form.company,
      contactPerson: form.contactPerson,
      phone: form.phone,
      stage: form.stage,
      expectedValue: Number(form.expectedValue || 0),
      probability: Number(form.probability || 50),
      expectedCloseDate: form.expectedCloseDate,
      assignedRepId: owner?.id,
      assignedRepName: owner?.name,
      productsSummary: form.productsSummary,
      notes: form.notes,
      competitor: form.competitor,
    };

    const result = editingId
      ? updateDeal(appState, editingId, payload)
      : createDeal(appState, payload);

    if (!result.ok) {
      toast.error('Operation failed', { module: 'Deals', description: 'error' in result ? String(result.error) : 'Save failed' });
      return;
    }
    saveAppState();
    setView('main');
    resetForm();
  };

  useChromeSuppressed(view === 'form');

  useRegisterModuleActions(
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => setLayoutMode('kanban')} className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${layoutMode === 'kanban' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>{t('crm.layout_kanban')}</button>
      <button type="button" onClick={() => setLayoutMode('table')} className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${layoutMode === 'table' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>{t('crm.layout_table')}</button>
      <input
        type="search"
        placeholder={t('crm.search_deals')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 w-48"
      />
      <button type="button" onClick={openCreate} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer">
        <Plus className="w-4 h-4" /> {t('crm.add_deal')}
      </button>
    </div>,
    [layoutMode, search, t, openCreate],
  );

  return (
    <>
      <KpiCards items={[
        { key: 'open', label: t('sales.kpi_open'), value: formatCount(Number(metrics.totalDeals ?? 0)), sub: formatMoney(Number(metrics.pipelineValue ?? 0)) },
        { key: 'won', label: translateStatus(t, 'won'), value: formatCount(Number(metrics.wonDeals ?? 0)) },
        { key: 'forecast', label: t('sales.kpi_total_value'), value: formatMoney(Number(metrics.forecastValue ?? 0)) },
        { key: 'avg', label: t('crm.col_value'), value: formatMoney(Number(metrics.averageDealSize ?? 0)) },
      ]} />

      {layoutMode === 'kanban' ? (
        <KanbanBoard columns={columns} onStageChange={handleStageChange} onCardClick={(card) => setDetailId(card.id)} />
      ) : (
        <AppTable
          columns={dealListColumns}
          rows={deals}
          emptyMessage={t('crm.no_records_yet')}
          onRowClick={(row) => setDetailId(String(row.id))}
        />
      )}

      <ProfileDrawer
        open={!!detailDeal}
        title={String(detailDeal?.title ?? 'Deal')}
        subtitle={String(detailDeal?.company ?? '')}
        onClose={() => setDetailId(null)}
        tabs={[{ id: 'timeline', label: 'Timeline' }]}
        activeTab="timeline"
        onTabChange={() => {}}
      >
        {detailDeal && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>Stage: <strong>{DEAL_STAGE_LABELS[detailDeal.stage as keyof typeof DEAL_STAGE_LABELS]}</strong></div>
              <div>Value: <strong>{formatMoney(Number(detailDeal.expectedValue || 0))}</strong></div>
            </div>
            <ul className="space-y-2">{(timeline as Array<Record<string, unknown>>).map((e, i) => (
              <li key={i} className="border-l-2 border-blue-200 pl-3">{String(e.summary ?? e.type ?? e.note)}</li>
            ))}</ul>
            <div className="flex gap-2">
              <button type="button" className="px-3 py-2 bg-emerald-600 text-white font-bold rounded-xl cursor-pointer" onClick={() => { markDealWon(appState, String(detailDeal.id), {}); saveAppState(); setDetailId(null); }}>{t('crm.mark_won')}</button>
              <button type="button" className="px-3 py-2 bg-rose-600 text-white font-bold rounded-xl cursor-pointer" onClick={() => { markDealLost(appState, String(detailDeal.id), {}); saveAppState(); setDetailId(null); }}>{t('crm.mark_lost_deal')}</button>
              <button type="button" className="px-3 py-2 border border-slate-200 font-bold rounded-xl cursor-pointer" onClick={() => openEdit(String(detailDeal.id))}>{t('common.edit')}</button>
            </div>
          </div>
        )}
      </ProfileDrawer>

      <Footer />
    <AppFormModal
      open={view === 'form'}
      onClose={() => { setView('main'); resetForm(); }}
      title={editingId ? 'Edit Deal' : 'Create Deal'}
      subtitle="Track deal stages, values, and follow-ups."
      onSubmit={handleSubmit}
      submitLabel="Save Deal"
      size="md"
    >
      <AppFormFields
        fields={DEAL_FORM_FIELDS}
        values={form}
        onChange={(key, value) => setForm({ ...form, [key]: value })}
        showAdvanced={showAdvanced}
        onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
      />
      <div className={FORM_GRID_CLS}>
        <div>
          <label className={FORM_LABEL_CLS}>Assigned Rep</label>
          <select
            value={form.assignedRepId}
            onChange={(e) => setForm({ ...form, assignedRepId: e.target.value })}
            className={FORM_SELECT_CLS}
          >
            {owners.map((o: { id: string; name: string }) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
      </div>
    </AppFormModal>
    </>
  );
}
