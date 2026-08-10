'use client';

import { toast } from '@/lib/ui/feedback';
import { useMemo, useState } from 'react';
import { LayoutGrid, List, Plus, SlidersHorizontal } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { useChromeSuppressed, useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { AppFormFields, AppFormModal, FORM_GRID_CLS, FORM_LABEL_CLS, FORM_SELECT_CLS } from '@/components/shared/AppForm';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { ModuleFilterBar } from '@/components/shared/ModuleFilterBar';
import { ModuleKpiSection } from '@/components/shared/ModuleKpiSection';
import { ProfileDrawer } from '@/components/shared/ProfileDrawer';
import { DealFollowUpsPanel } from '@/components/modules/crm/deals/DealFollowUpsPanel';
import { DealKanbanBoard } from '@/components/modules/crm/deals/DealKanbanBoard';
import { DealPipelineDonut } from '@/components/modules/crm/deals/DealPipelineDonut';
import { DealTopPerformersPanel } from '@/components/modules/crm/deals/DealTopPerformersPanel';
import { DealsBySourceChart } from '@/components/modules/crm/deals/DealsBySourceChart';
import { formatDealDate, priorityBadgeClass } from '@/components/modules/crm/deals/deal-display-utils';
import { useAppStore } from '@/lib/state/app-store';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import type { PortField } from '@/lib/modules/port-types';
import {
  DEAL_STAGES,
  createDeal,
  getDealById,
  getDealTimeline,
  getOwnerOptions,
  markDealLost,
  markDealWon,
  updateDeal,
  updateDealStage,
} from '@/lib/services/crm-service';
import {
  DEAL_KANBAN_STAGES,
  getDealPipelineMetrics,
  getDealStageBreakdown,
  getDealsBySource,
  getEnrichedDealList,
  getTopDealPerformers,
  getUpcomingDealFollowUps,
  stageLabel,
  type DealRecord,
} from '@/lib/services/deals-pipeline-service';
import { MODULE_FILTER_INPUT } from '@/lib/ui/module-chrome-styles';

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
  const [stageFilter, setStageFilter] = useState('all');
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

  const allDeals = useMemo(() => getEnrichedDealList(appState), [appState]);
  const metrics = useMemo(() => getDealPipelineMetrics(appState, allDeals), [appState, allDeals]);
  const stageSlices = useMemo(() => getDealStageBreakdown(appState, allDeals), [appState, allDeals]);
  const sourceSlices = useMemo(() => getDealsBySource(appState, allDeals), [appState, allDeals]);
  const followUps = useMemo(() => getUpcomingDealFollowUps(appState), [appState]);
  const topPerformers = useMemo(() => getTopDealPerformers(appState, allDeals), [appState, allDeals]);

  const deals = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allDeals.filter((deal) => {
      if (stageFilter !== 'all' && deal.stage !== stageFilter) return false;
      if (!q) return true;
      const hay = `${deal.title} ${deal.company} ${deal.contactPerson ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [allDeals, search, stageFilter]);

  const dealListColumns = useMemo<AppTableColumn<DealRecord>[]>(() => [
    {
      key: 'title',
      label: t('crm.col_deal'),
      render: (row) => (
        <div className="min-w-0">
          <div className="font-bold truncate">{row.title}</div>
          <div className="text-slate-500 truncate">{row.company}</div>
        </div>
      ),
    },
    {
      key: 'stage',
      label: t('crm.col_stage'),
      render: (row) => stageLabel(String(row.stage)),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (row) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${priorityBadgeClass(String(row.priority ?? 'medium'))}`}>
          {String(row.priority ?? 'medium')}
        </span>
      ),
    },
    {
      key: 'value',
      label: t('crm.col_value'),
      render: (row) => <span className="font-bold tabular-nums">{formatMoney(Number(row.expectedValue || 0))}</span>,
    },
    {
      key: 'close',
      label: 'Close Date',
      render: (row) => formatDealDate(String(row.expectedCloseDate ?? '')),
    },
  ], [t, formatMoney]);

  const resetForm = (stage = 'new-opportunity') => {
    setForm({
      title: '',
      company: '',
      contactPerson: '',
      phone: '',
      stage,
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

  const openCreate = (stage = 'new-opportunity') => {
    resetForm(stage);
    setView('form');
  };

  const detailDeal = detailId ? getDealById(appState, detailId) : null;
  const timeline = useMemo(() => (detailId ? getDealTimeline(appState, detailId) : []), [appState, detailId]);

  const openEdit = (ref: string | DealRecord) => {
    const id = typeof ref === 'string' ? ref : ref.id;
    const deal = allDeals.find((d) => String(d.id) === id);
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
    toast.success(editingId ? 'Deal updated' : 'Deal created', { module: 'Deals' });
  };

  useChromeSuppressed(view === 'form');

  useRegisterModuleActions(
    <button type="button" onClick={() => openCreate()} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer">
      <Plus className="w-4 h-4" /> {t('crm.add_deal')}
    </button>,
    [t],
  );

  return (
    <>
      <ModuleKpiSection
        gridClassName="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2"
        items={[
          {
            key: 'total',
            label: 'Total Deals',
            value: formatCount(metrics.totalDeals),
            sub: `+${metrics.thisMonth} this month`,
            iconify: 'flat-color-icons:briefcase',
          },
          {
            key: 'open',
            label: 'Open Deals',
            value: formatCount(metrics.openDeals),
            sub: formatMoney(metrics.openValue),
            iconify: 'flat-color-icons:folder',
          },
          {
            key: 'won',
            label: 'Won Deals',
            value: formatCount(metrics.wonDeals),
            sub: formatMoney(metrics.wonValue),
            iconify: 'flat-color-icons:vip',
          },
          {
            key: 'lost',
            label: 'Lost Deals',
            value: formatCount(metrics.lostDeals),
            sub: formatMoney(metrics.lostValue),
            iconify: 'flat-color-icons:disapprove',
          },
          {
            key: 'conversion',
            label: 'Conversion Rate',
            value: `${metrics.conversionRate}%`,
            sub: `+${metrics.conversionDelta}% this month`,
            iconify: 'flat-color-icons:positive-dynamic',
          },
        ]}
      />

      <ModuleFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('crm.search_deals')}
        filters={
          <>
            <div className="inline-flex rounded-xl border border-blue-100/70 overflow-hidden shrink-0">
              <button
                type="button"
                onClick={() => setLayoutMode('kanban')}
                className={`px-3 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${layoutMode === 'kanban' ? 'bg-blue-600 text-white' : 'bg-white/45 text-slate-600 hover:bg-blue-50'}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> {t('crm.layout_kanban')}
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('table')}
                className={`px-3 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${layoutMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white/45 text-slate-600 hover:bg-blue-50'}`}
              >
                <List className="w-3.5 h-3.5" /> {t('crm.layout_table')}
              </button>
            </div>
            <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className={MODULE_FILTER_INPUT}>
              <option value="all">All Stages</option>
              {DEAL_KANBAN_STAGES.map((stage) => (
                <option key={stage} value={stage}>{stageLabel(stage)}</option>
              ))}
            </select>
            <button type="button" className={`${MODULE_FILTER_INPUT} inline-flex items-center gap-1.5`}>
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
            </button>
          </>
        }
      />

      {layoutMode === 'kanban' ? (
        <DealKanbanBoard
          stages={[...DEAL_KANBAN_STAGES]}
          deals={deals}
          formatMoney={formatMoney}
          onStageChange={handleStageChange}
          onCardClick={(deal) => setDetailId(String(deal.id))}
          onAddInStage={(stage) => openCreate(stage)}
        />
      ) : (
        <AppTable
          columns={dealListColumns}
          rows={deals}
          emptyMessage={t('crm.no_records_yet')}
          onRowClick={(row) => setDetailId(String(row.id))}
        />
      )}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <section className="premium-card premium-shadow p-4">
          <h3 className="text-sm font-extrabold text-slate-900 mb-3">Pipeline Value</h3>
          <DealPipelineDonut slices={stageSlices} totalValue={metrics.pipelineValue} formatMoney={formatMoney} />
        </section>
        <section className="premium-card premium-shadow p-4">
          <h3 className="text-sm font-extrabold text-slate-900 mb-3">Deals by Source</h3>
          <DealsBySourceChart slices={sourceSlices} />
        </section>
        <section className="premium-card premium-shadow p-4">
          <h3 className="text-sm font-extrabold text-slate-900 mb-3">Upcoming Follow-ups</h3>
          <DealFollowUpsPanel items={followUps} />
        </section>
        <section className="premium-card premium-shadow p-4">
          <h3 className="text-sm font-extrabold text-slate-900 mb-3">Top Performing Users</h3>
          <DealTopPerformersPanel items={topPerformers} formatMoney={formatMoney} />
        </section>
      </div>

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
              <div>Stage: <strong>{stageLabel(String(detailDeal.stage))}</strong></div>
              <div>Value: <strong>{formatMoney(Number(detailDeal.expectedValue || 0))}</strong></div>
            </div>
            <ul className="space-y-2">{(timeline as Array<Record<string, unknown>>).map((e, i) => (
              <li key={i} className="border-l-2 border-blue-200 pl-3">{String(e.summary ?? e.type ?? e.note)}</li>
            ))}</ul>
            <div className="flex gap-2 flex-wrap">
              <button type="button" className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer" onClick={() => { markDealWon(appState, String(detailDeal.id), {}); saveAppState(); setDetailId(null); toast.success('Deal marked won', { module: 'Deals' }); }}>{t('crm.mark_won')}</button>
              <button type="button" className="px-3 py-2 bg-rose-600 text-white font-bold rounded-xl cursor-pointer" onClick={() => { markDealLost(appState, String(detailDeal.id), {}); saveAppState(); setDetailId(null); toast.success('Deal marked lost', { module: 'Deals' }); }}>{t('crm.mark_lost_deal')}</button>
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
