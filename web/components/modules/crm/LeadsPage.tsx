'use client';

import { toast } from '@/lib/ui/feedback';

import { useMemo, useState, useCallback } from 'react';
import { MessageCircle, Phone, Plus, Upload } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/shared/Button';
import { useChromeSuppressed, useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { useAppStore } from '@/lib/state/app-store';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { translateStatus } from '@/lib/i18n/resolve-label';
import {
  convertLeadToCustomer,
  createLead,
  getEnrichedLeadList,
  getLeadActivities,
  getLeadMetrics,
  getLeadPipelineCounts,
  getOwnerOptions,
  getUserContext,
  LEAD_STAGE_LABELS,
  updateLead,
} from '@/lib/services/crm-service';
import { isModuleApiMode } from '@/lib/config/data-source';
import { createCustomerViaApi } from '@/lib/services/customers-api-service';
import type { CustomerFormPayload } from '@/components/modules/crm/CustomerForm';
import { usePaginatedApiResource } from '@/hooks/use-paginated-api-resource';
import { ListPagination } from '@/components/shared/ListPagination';
import { mapApiLeadRow, mapLeadToApi, resolveApiRowId } from '@/lib/services/entity-api-mappers';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { isModuleBootLoading, pickApiListRows } from '@/lib/ui/kpi-loading';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ModuleKpiSection } from '@/components/shared/ModuleKpiSection';
import { ModuleFilterBar } from '@/components/shared/ModuleFilterBar';
import { MODULE_FILTER_INPUT } from '@/lib/ui/module-chrome-styles';
import { FilterTabs } from '@/components/shared/FilterTabs';
import {
  LeadForm,
  EMPTY_LEAD_FORM,
  splitFollowUpAt,
  type LeadFormPayload,
  type LeadFormValues,
} from '@/components/modules/crm/LeadForm';
import { LEAD_SOURCE_OPTIONS } from '@/components/modules/crm/lead-form/lead-form-options';
import { LeadDetailPanel } from '@/components/modules/crm/leads/LeadDetailPanel';
import { LeadPipelineFunnel } from '@/components/modules/crm/leads/LeadPipelineFunnel';
import {
  formatLeadDateTime,
  formatRelativeActivity,
  leadAvatarClass,
  leadInitials,
  NEXT_ACTION_ICONS,
  priorityLabel,
  priorityTagClass,
} from '@/components/modules/crm/leads/lead-display-utils';

const PAGE_SIZE_OPTIONS = [10, 15, 25];
const NEXT_ACTION_FILTERS = ['Call', 'WhatsApp', 'Email', 'Meeting', 'Follow-up'];
const NEXT_ACTION_I18N: Record<string, string> = {
  Call: 'crm.action_call',
  WhatsApp: 'crm.action_whatsapp',
  Email: 'crm.action_email',
  Meeting: 'crm.action_meeting',
  'Follow-up': 'crm.action_follow_up',
};

function buildEmptyLeadValues(ownerId: string): LeadFormValues {
  return { ...EMPTY_LEAD_FORM, assignedRepId: ownerId };
}

function leadRecordToFormValues(lead: Record<string, unknown>, ownerIdFallback: string): LeadFormValues {
  const followUp = splitFollowUpAt(lead.nextFollowUpAt as string | null | undefined);
  return {
    name: String(lead.name ?? ''),
    phone: String(lead.phone ?? ''),
    alternativePhone: String(lead.alternativePhone ?? ''),
    company: String(lead.company ?? ''),
    email: String(lead.email ?? ''),
    interestedProduct: String(lead.interestedProduct ?? ''),
    customerRequirement: String(lead.customerRequirement ?? ''),
    source: String(lead.source ?? ''),
    campaign: String(lead.campaign ?? ''),
    adCreative: String(lead.adCreative ?? ''),
    assignedRepId: String(lead.assignedRepId ?? ownerIdFallback),
    status: String(lead.status ?? 'new'),
    priority: String(lead.priority ?? 'warm'),
    followUpDate: followUp.date,
    followUpTime: followUp.time,
    expectedValue: lead.expectedValue != null && lead.expectedValue !== '' ? String(lead.expectedValue) : '',
    location: String(lead.location ?? ''),
    notes: String(lead.notes ?? ''),
  };
}

function buildCustomerPayloadFromLead(lead: Record<string, unknown>): CustomerFormPayload {
  return {
    company: String(lead.company ?? lead.name ?? ''),
    name: String(lead.name ?? ''),
    contactName: String(lead.name ?? ''),
    companyType: 'Prospect Converted',
    phone: String(lead.phone ?? ''),
    alternativePhone: String(lead.alternativePhone ?? ''),
    email: String(lead.email ?? ''),
    status: 'active',
    imageUrl: '',
    imagePublicId: '',
    taxVatNumber: '',
    tinNumber: '',
    tradeLicenseNumber: '',
    businessRegistrationNo: '',
    openingBalance: 0,
    creditLimit: '10000',
    paymentTerms: 'Net 30',
    pricingTier: 'Standard',
    ownerId: String(lead.assignedRepId ?? ''),
    ownerName: String(lead.assignedRepName ?? ''),
    billingAddress: String(lead.location ?? ''),
    billingArea: '',
    billingCity: '',
    billingRegion: '',
    shippingAddress: String(lead.location ?? ''),
    shippingArea: '',
    shippingCity: '',
    shippingRegion: '',
    notes: String(lead.notes ?? ''),
  };
}

export function LeadsPage({ initialLeads }: { initialLeads?: Record<string, unknown>[] }) {
  const t = useAppStore((s) => s.t);
  const { formatMoney, formatCount } = useLocaleFormat();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const apiMode = isModuleApiMode('leads');
  const hasServerLeads = Boolean(initialLeads?.length);
  const apiStore = usePaginatedApiResource('leads', mapApiLeadRow, {
    pageSize: 10,
    initialRows: initialLeads,
  });
  const bootLoading = hasServerLeads ? false : isModuleBootLoading(apiMode, apiStore.initialized);
  const [view, setView] = useState<'main' | 'form'>('main');
  const [localSearch, setLocalSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [nextActionFilter, setNextActionFilter] = useState('all');
  const [funnelStage, setFunnelStage] = useState<string | null>(null);
  const [listTab, setListTab] = useState('all');
  const [localPage, setLocalPage] = useState(1);
  const [localPageSize, setLocalPageSize] = useState(10);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailTab, setDetailTab] = useState<'activity' | 'details' | 'notes' | 'files'>('activity');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [formValues, setFormValues] = useState<LeadFormValues>(EMPTY_LEAD_FORM);

  const owners = useMemo(() => getOwnerOptions(appState), [appState]);
  const currentUser = useMemo(() => getUserContext(appState), [appState]);
  const allLeads = useMemo(() => {
    const local = getEnrichedLeadList(appState);
    return pickApiListRows(apiMode, apiStore.initialized, apiStore.rows, local);
  }, [apiMode, apiStore.initialized, apiStore.rows, appState]);
  const metrics = useMemo(() => {
    if (apiMode) {
      const open = allLeads.filter((l) => !['won', 'lost'].includes(String(l.status)));
      return {
        newThisWeek: allLeads.length,
        followUpToday: 0,
        overdueFollowUps: 0,
        unassigned: open.filter((l) => !l.assignedRepId).length,
        pipelineValue: open.reduce((s, l) => s + Number(l.expectedValue ?? 0), 0),
        conversionRate: 0,
        totalLeads: apiStore.meta.total,
        newUncontacted: allLeads.filter((l) => l.status === 'new').length,
      };
    }
    return getLeadMetrics(appState);
  }, [apiMode, allLeads, appState, apiStore.meta.total]);
  const pipelineCounts = useMemo(() => {
    if (apiMode) {
      const counts: Record<string, number> = {};
      allLeads.forEach((l) => {
        const st = String(l.status ?? 'new');
        counts[st] = (counts[st] ?? 0) + 1;
      });
      return counts;
    }
    return getLeadPipelineCounts(appState);
  }, [apiMode, allLeads, appState]);

  const filtered = useMemo(() => {
    let data = allLeads;
    const q = apiMode ? '' : localSearch.toLowerCase().trim();

    if (listTab === 'mine') {
      data = data.filter((lead) => String(lead.assignedRepId) === currentUser.employeeId);
    } else if (listTab === 'today') {
      data = data.filter((lead) => lead.isFollowUpToday);
    } else if (listTab === 'overdue') {
      data = data.filter((lead) => lead.isOverdue);
    } else if (listTab === 'new') {
      data = data.filter((lead) => String(lead.status) === 'new');
    }

    if (funnelStage) {
      data = data.filter((lead) => String(lead.status) === funnelStage);
    }
    if (stageFilter !== 'all') {
      data = data.filter((lead) => String(lead.status) === stageFilter);
    }
    if (ownerFilter !== 'all') {
      data = data.filter((lead) => String(lead.assignedRepId) === ownerFilter);
    }
    if (sourceFilter !== 'all') {
      data = data.filter((lead) => String(lead.source) === sourceFilter);
    }
    if (nextActionFilter !== 'all') {
      data = data.filter((lead) => String(lead.nextActionType) === nextActionFilter);
    }
    if (q) {
      data = data.filter((lead) =>
        `${lead.name} ${lead.company} ${lead.source} ${lead.phone} ${lead.email}`.toLowerCase().includes(q),
      );
    }

    return data;
  }, [allLeads, apiMode, apiStore.search, localSearch, stageFilter, ownerFilter, sourceFilter, nextActionFilter, funnelStage, listTab, currentUser.employeeId]);

  const pageSize = apiMode ? apiStore.pageSize : localPageSize;
  const displayRows = apiMode ? filtered : filtered.slice((localPage - 1) * pageSize, localPage * pageSize);
  const listTotal = apiMode ? apiStore.meta.total : filtered.length;
  const listPage = apiMode ? apiStore.page : localPage;

  const onPageChange = (p: number) => {
    if (apiMode) apiStore.setPage(p);
    else setLocalPage(p);
  };

  const selectedLead = useMemo(
    () => filtered.find((l) => String(l.id) === selectedId) ?? allLeads.find((l) => String(l.id) === selectedId) ?? null,
    [filtered, allLeads, selectedId],
  );
  const selectedActivities = useMemo(
    () => (selectedId ? getLeadActivities(appState, selectedId) : []),
    [appState, selectedId],
  );

  const sourceFilterOptions = useMemo(() => {
    const fromData = new Set(allLeads.map((l) => String(l.source)).filter(Boolean));
    LEAD_SOURCE_OPTIONS.forEach((source) => fromData.add(source));
    return Array.from(fromData).sort();
  }, [allLeads]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pageIds = displayRows.map((l) => String(l.id));
    const allSelected = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      pageIds.forEach((id) => {
        if (allSelected) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  };

  const resetFilters = () => {
    if (apiMode) apiStore.setSearchTerm('');
    else setLocalSearch('');
    setStageFilter('all');
    setOwnerFilter('all');
    setSourceFilter('all');
    setNextActionFilter('all');
    setFunnelStage(null);
    setListTab('all');
    onPageChange(1);
  };

  const resetForm = () => {
    setFormValues(buildEmptyLeadValues(owners[0]?.id ?? ''));
    setEditingId(null);
    setFormKey((k) => k + 1);
  };

  const openCreate = useCallback(() => {
    resetForm();
    setView('form');
  }, []);

  useChromeSuppressed(view !== 'main');

  useRegisterModuleActions(
    view === 'main' ? (
      <div className="flex items-center gap-2 self-start">
        <Button
          type="button"
          onClick={() => toast.info('Feature coming soon', { module: 'Leads', description: "Import leads" })}
          variant="outline"
          leftIcon={<Upload className="w-4 h-4" />}
        >
          {t('crm.import_leads')}
        </Button>
        <Button
          type="button"
          onClick={openCreate}
          variant="primary"
          className="rounded-full px-6 py-2.5"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          {t('crm.add_lead')}
        </Button>
      </div>
    ) : null,
    [view, openCreate, t],
  );

  const openEdit = (lead: Record<string, unknown>) => {
    setEditingId(String(lead.id));
    setFormValues(leadRecordToFormValues(lead, owners[0]?.id ?? ''));
    setFormKey((k) => k + 1);
    setView('form');
  };

  const handleSave = async (payload: LeadFormPayload): Promise<boolean> => {
    if (apiMode) {
      const body = mapLeadToApi(payload as unknown as Record<string, unknown>, editingId ?? undefined);
      const editRow = editingId ? allLeads.find((l) => String(l.id) === editingId) : null;
      const result = editingId && editRow
        ? await apiStore.update(resolveApiRowId(editRow), body)
        : await apiStore.create(body);
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Leads', description: 'error' in result ? String(result.error) : 'Save failed' });
        return false;
      }
      setView('main');
      resetForm();
      return true;
    }
    if (editingId) {
      updateLead(appState, editingId, payload);
    } else {
      createLead(appState, payload);
    }
    saveAppState();
    setView('main');
    resetForm();
    return true;
  };

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    {
      key: '_select',
      label: '',
      headerClassName: 'w-10',
      className: 'w-10',
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.has(String(row.id))}
          onChange={() => toggleSelect(String(row.id))}
          onClick={(e) => e.stopPropagation()}
          className="cursor-pointer"
        />
      ),
    },
    {
      key: 'name',
      label: t('crm.col_lead'),
      render: (row) => {
        const name = String(row.name ?? '');
        const priority = String(row.priority ?? 'warm');
        return (
          <div className="flex items-center gap-2.5 min-w-0 max-w-[220px]">
            <span className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 ${leadAvatarClass(name)}`}>
              {leadInitials(name)}
            </span>
            <div className="min-w-0">
              <div className="font-bold text-slate-900 truncate">{name}</div>
              <div className="text-[10px] text-slate-500 truncate">{String(row.company || '—')}</div>
              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{String(row.source || '—')}</span>
                {priority === 'hot' ? (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${priorityTagClass(priority)}`}>
                    {priorityLabel(priority)}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'contact',
      label: t('crm.col_contact'),
      render: (row) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-800">{String(row.phone || '—')}</div>
          <div className="text-slate-500 text-[10px] truncate max-w-[140px]">{String(row.email || '—')}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: t('crm.col_stage'),
      render: (row) => <StatusBadge status={String(row.status)} />,
    },
    {
      key: 'rep',
      label: t('crm.col_assigned_to'),
      render: (row) => {
        const repName = String(row.assignedRepName || t('crm.unassigned'));
        return (
          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${leadAvatarClass(repName)}`}>
              {leadInitials(repName)}
            </span>
            <span className="text-xs font-semibold text-slate-700 truncate max-w-[100px]">{repName}</span>
          </div>
        );
      },
    },
    {
      key: 'lastActivity',
      label: t('crm.col_last_activity'),
      render: (row) => (
        <div className="text-xs min-w-[120px]">
          <div className="font-semibold text-slate-700">{formatRelativeActivity(row.lastActivityAt as string)}</div>
          <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{String(row.lastActivitySummary || '—')}</div>
        </div>
      ),
    },
    {
      key: 'nextAction',
      label: t('crm.col_next_action'),
      render: (row) => {
        const actionType = String(row.nextActionType || t('crm.action_follow_up'));
        const isToday = Boolean(row.isFollowUpToday);
        const isOverdue = Boolean(row.isOverdue);
        return (
          <div className={`text-xs min-w-[120px] ${isOverdue ? 'text-rose-600' : isToday ? 'text-emerald-700' : 'text-slate-700'}`}>
            <div className="font-bold flex items-center gap-1">
              <span>{NEXT_ACTION_ICONS[actionType] || '🔔'}</span>
              {actionType}
            </div>
            <div className="text-[10px] font-semibold mt-0.5">{formatLeadDateTime(row.nextActionAt as string)}</div>
          </div>
        );
      },
    },
    {
      key: 'value',
      label: t('crm.col_value'),
      render: (row) => (
        <span className="text-xs font-extrabold text-slate-900">{formatMoney(Number(row.expectedValue || 0))}</span>
      ),
    },
  ], [selectedIds, t, formatMoney]);

  if (view === 'form') {
    return (
      <LeadForm
        key={formKey}
        mode={editingId ? 'edit' : 'create'}
        initialValues={formValues}
        owners={owners}
        onCancel={() => {
          setView('main');
          resetForm();
        }}
        onSave={handleSave}
      />
    );
  }

  return (
    <>
      {apiMode && <ApiModeBanner module="leads" />}
      <ModuleKpiSection
        gridClassName="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2"
        kpiCount={5}
        loading={bootLoading}
        items={[
          { key: 'leads', label: t('crm.kpi_new_leads'), value: formatCount(Number(metrics.newThisWeek)), sub: t('crm.kpi_this_week') },
          { key: 'pending', label: t('crm.kpi_follow_up_today'), value: formatCount(Number(metrics.followUpToday)), sub: t('crm.kpi_leads_to_contact') },
          { key: 'alert', label: t('crm.kpi_overdue_followups'), value: formatCount(Number(metrics.overdueFollowUps)), alert: Number(metrics.overdueFollowUps) > 0, sub: Number(metrics.overdueFollowUps) > 0 ? t('crm.kpi_requires_attention') : t('crm.kpi_all_caught_up') },
          { key: 'open', label: t('crm.kpi_unassigned_leads'), value: formatCount(Number(metrics.unassigned)), sub: t('crm.kpi_not_assigned') },
          { key: 'value', label: t('crm.kpi_pipeline_value'), value: formatMoney(Number(metrics.pipelineValue)), sub: t('crm.kpi_conversion_rate', { n: metrics.conversionRate }) },
        ]}
      />

      <LeadPipelineFunnel
        counts={pipelineCounts}
        activeStage={funnelStage}
        onStageClick={(stage) => { setFunnelStage(stage); onPageChange(1); }}
      />

      <ModuleFilterBar
        search={apiMode ? apiStore.search : localSearch}
        onSearchChange={(v) => {
          if (apiMode) apiStore.setSearchTerm(v);
          else setLocalSearch(v);
          onPageChange(1);
        }}
        searchPlaceholder={t('crm.search_leads')}
        filters={
          <>
            <FilterTabs
              tabs={[
                { id: 'mine', label: t('crm.filter_my_leads') },
                { id: 'today', label: t('crm.filter_follow_up_today', { n: metrics.followUpToday }) },
                { id: 'overdue', label: t('crm.filter_overdue', { n: metrics.overdueFollowUps }) },
                { id: 'new', label: t('crm.filter_new_uncontacted', { n: metrics.newUncontacted }) },
                { id: 'all', label: t('crm.filter_all_leads', { n: metrics.totalLeads }) },
              ]}
              active={listTab}
              onChange={(id) => { setListTab(id); onPageChange(1); }}
            />
            <select value={stageFilter} onChange={(e) => { setStageFilter(e.target.value); onPageChange(1); }} className={MODULE_FILTER_INPUT}>
              <option value="all">{t('crm.filter_stage')}</option>
              {Object.entries(LEAD_STAGE_LABELS).map(([value]) => (
                <option key={value} value={value}>{translateStatus(t, value)}</option>
              ))}
            </select>
            <select value={ownerFilter} onChange={(e) => { setOwnerFilter(e.target.value); onPageChange(1); }} className={MODULE_FILTER_INPUT}>
              <option value="all">{t('crm.filter_sales_rep')}</option>
              {owners.map((o: { id: string; name: string }) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <select value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); onPageChange(1); }} className={MODULE_FILTER_INPUT}>
              <option value="all">{t('crm.filter_source')}</option>
              {sourceFilterOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={nextActionFilter} onChange={(e) => { setNextActionFilter(e.target.value); onPageChange(1); }} className={MODULE_FILTER_INPUT}>
              <option value="all">{t('crm.filter_next_action')}</option>
              {NEXT_ACTION_FILTERS.map((a) => <option key={a} value={a}>{t(NEXT_ACTION_I18N[a] ?? a)}</option>)}
            </select>
            <button type="button" onClick={resetFilters} className="text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer px-2 py-2 shrink-0">
              {t('crm.reset')}
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-3 items-stretch flex-1 min-h-0 min-w-0 overflow-hidden">
        <div className="flex flex-col gap-3 min-h-0 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 px-1">
            <input
              type="checkbox"
              checked={displayRows.length > 0 && displayRows.every((l) => selectedIds.has(String(l.id)))}
              onChange={toggleSelectAll}
              className="cursor-pointer"
            />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t('crm.select_page')}</span>
          </div>
          <AppTable
            className="flex-1"
            columns={columns}
            rows={displayRows}
            loading={bootLoading}
            emptyMessage={t('crm.no_leads')}
            rowClassName={(row) => (String(row.id) === selectedId ? 'bg-emerald-50/60 border-l-2 border-emerald-500' : '')}
            onRowClick={(row) => setSelectedId(String(row.id))}
            renderActions={(row) => (
              <>
                <button type="button" title="WhatsApp" onClick={(e) => { e.stopPropagation(); toast.info('Feature coming soon', { module: 'Leads', description: "WhatsApp" }); }} className="app-table-icon-btn cursor-pointer">
                  <MessageCircle className="w-4 h-4" />
                </button>
                <button type="button" title="Call" onClick={(e) => { e.stopPropagation(); toast.info('Feature coming soon', { module: 'Leads', description: "Call ${String(row.phone)} — coming soon." }); }} className="app-table-icon-btn cursor-pointer">
                  <Phone className="w-4 h-4" />
                </button>
                <TableIconAction
                  variant="edit"
                  onClick={(e) => { e.stopPropagation(); openEdit(row); }}
                />
              </>
            )}
          />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
            <span>
              {t('crm.showing_leads', {
                from: listTotal === 0 ? 0 : (listPage - 1) * pageSize + 1,
                to: Math.min(listPage * pageSize, listTotal),
                total: listTotal,
              })}
            </span>
            {!apiMode ? (
              <select
                value={localPageSize}
                onChange={(e) => { setLocalPageSize(Number(e.target.value)); setLocalPage(1); }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 cursor-pointer"
              >
                {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{t('crm.per_page', { n: size })}</option>)}
              </select>
            ) : null}
          </div>
          <ListPagination page={listPage} pageSize={pageSize} total={listTotal} onPageChange={onPageChange} />
        </div>

        <div className="min-w-0 max-w-full overflow-hidden">
        <LeadDetailPanel
          lead={selectedLead}
          activities={selectedActivities as Array<Record<string, unknown>>}
          detailTab={detailTab}
          onDetailTabChange={setDetailTab}
          onEdit={() => selectedLead && openEdit(selectedLead)}
          onConvert={async () => {
            if (!selectedLead) return;
            if (apiMode) {
              const customersApi = isModuleApiMode('customers');
              let customerId = '';
              if (customersApi) {
                const created = await createCustomerViaApi(buildCustomerPayloadFromLead(selectedLead));
                if (!created.ok) {
                  toast.error('Operation failed', { module: 'Leads', description: 'error' in created ? String(created.error) : 'Could not create customer' });
                  return;
                }
                customerId = created.id;
              } else {
                const r = convertLeadToCustomer(appState, String(selectedLead.id), {});
                if (!r.ok) {
                  toast.error('Operation failed', { module: 'Leads', description: 'error' in r ? String(r.error) : 'Conversion failed' });
                  return;
                }
                customerId = String(r.customerId ?? '');
                saveAppState();
              }
              const body = {
                ...mapLeadToApi({
                  ...selectedLead,
                  status: 'won',
                  conversionStatus: 'converted',
                }, String(selectedLead.id)),
                meta: { convertedCustomerId: customerId },
              };
              const updated = await apiStore.update(resolveApiRowId(selectedLead), body);
              if (!updated.ok) {
                toast.error('Operation failed', { module: 'Leads', description: 'error' in updated ? String(updated.error) : 'Could not update lead' });
                return;
              }
              toast.success('Done', { module: t('crm.leads_title'), description: t('crm.converted_success') });
              return;
            }
            const r = convertLeadToCustomer(appState, String(selectedLead.id), {});
            if (!r.ok) {
              toast.error('Operation failed', { module: 'Leads', description: 'error' in r ? String(r.error) : 'Conversion failed' });
              return;
            }
            saveAppState();
            toast.success('Done', { module: t('crm.leads_title'), description: t('crm.converted_success') });
          }}
          onMarkLost={async () => {
            if (!selectedLead) return;
            if (apiMode) {
              const body = mapLeadToApi({ ...selectedLead, status: 'lost' }, String(selectedLead.id));
              const result = await apiStore.update(resolveApiRowId(selectedLead), body);
              if (!result.ok) {
                toast.error('Operation failed', { module: 'Leads', description: 'error' in result ? String(result.error) : 'Update failed' });
                return;
              }
              return;
            }
            updateLead(appState, String(selectedLead.id), { status: 'lost' });
            saveAppState();
          }}
        />
        </div>
      </div>

      <Footer />
    </>
  );
}
