'use client';

import { toast } from '@/lib/ui/feedback';

import { useMemo, useState } from 'react';
import { MessageCircle, MoreVertical, Phone, Plus, Search, Upload } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { useAppStore } from '@/lib/state/app-store';
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
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { KpiCards } from '@/components/shared/KpiCards';
import { FilterTabs } from '@/components/shared/FilterTabs';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
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
  formatLeadCurrency,
  formatLeadDateTime,
  formatRelativeActivity,
  leadAvatarClass,
  leadInitials,
  leadStageLabel,
  NEXT_ACTION_ICONS,
  priorityLabel,
  priorityTagClass,
} from '@/components/modules/crm/leads/lead-display-utils';

const PAGE_SIZE_OPTIONS = [10, 15, 25];
const NEXT_ACTION_FILTERS = ['Call', 'WhatsApp', 'Email', 'Meeting', 'Follow-up'];

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

export function LeadsPage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [view, setView] = useState<'main' | 'form'>('main');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [nextActionFilter, setNextActionFilter] = useState('all');
  const [funnelStage, setFunnelStage] = useState<string | null>(null);
  const [listTab, setListTab] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailTab, setDetailTab] = useState<'activity' | 'details' | 'notes' | 'files'>('activity');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [formValues, setFormValues] = useState<LeadFormValues>(EMPTY_LEAD_FORM);

  const owners = useMemo(() => getOwnerOptions(appState), [appState]);
  const currentUser = useMemo(() => getUserContext(appState), [appState]);
  const allLeads = useMemo(() => getEnrichedLeadList(appState), [appState]);
  const metrics = useMemo(() => getLeadMetrics(appState), [appState]);
  const pipelineCounts = useMemo(() => getLeadPipelineCounts(appState), [appState]);

  const filtered = useMemo(() => {
    let data = allLeads;
    const q = search.toLowerCase().trim();

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
  }, [allLeads, search, stageFilter, ownerFilter, sourceFilter, nextActionFilter, funnelStage, listTab, currentUser.employeeId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
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
    const pageIds = paged.map((l) => String(l.id));
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
    setSearch('');
    setStageFilter('all');
    setOwnerFilter('all');
    setSourceFilter('all');
    setNextActionFilter('all');
    setFunnelStage(null);
    setListTab('all');
    setPage(1);
  };

  const resetForm = () => {
    setFormValues(buildEmptyLeadValues(owners[0]?.id ?? ''));
    setEditingId(null);
    setFormKey((k) => k + 1);
  };

  const openCreate = () => {
    resetForm();
    setView('form');
  };

  const openEdit = (lead: Record<string, unknown>) => {
    setEditingId(String(lead.id));
    setFormValues(leadRecordToFormValues(lead, owners[0]?.id ?? ''));
    setFormKey((k) => k + 1);
    setView('form');
  };

  const handleSave = (payload: LeadFormPayload) => {
    if (editingId) {
      updateLead(appState, editingId, payload);
    } else {
      createLead(appState, payload);
    }
    saveAppState();
    setView('main');
    resetForm();
  };

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i += 1) pages.push(i);
    return pages;
  }, [page, totalPages]);

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
      label: 'Lead',
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
      label: 'Contact',
      render: (row) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-800">{String(row.phone || '—')}</div>
          <div className="text-slate-500 text-[10px] truncate max-w-[140px]">{String(row.email || '—')}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Stage',
      render: (row) => <StatusBadge status={leadStageLabel(String(row.status))} />,
    },
    {
      key: 'rep',
      label: 'Assigned To',
      render: (row) => {
        const repName = String(row.assignedRepName || 'Unassigned');
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
      label: 'Last Activity',
      render: (row) => (
        <div className="text-xs min-w-[120px]">
          <div className="font-semibold text-slate-700">{formatRelativeActivity(row.lastActivityAt as string)}</div>
          <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{String(row.lastActivitySummary || '—')}</div>
        </div>
      ),
    },
    {
      key: 'nextAction',
      label: 'Next Action',
      render: (row) => {
        const actionType = String(row.nextActionType || 'Follow-up');
        const isToday = Boolean(row.isFollowUpToday);
        const isOverdue = Boolean(row.isOverdue);
        return (
          <div className={`text-xs min-w-[120px] ${isOverdue ? 'text-rose-600' : isToday ? 'text-blue-700' : 'text-slate-700'}`}>
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
      label: 'Value',
      render: (row) => (
        <span className="text-xs font-extrabold text-slate-900">{formatLeadCurrency(Number(row.expectedValue || 0))}</span>
      ),
    },
  ], [selectedIds]);

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
    <div className={MODULE_LIST_SHELL}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Leads</h1>
          <p className="text-xs text-slate-500 mt-0.5">Capture prospects, track follow-ups and convert leads to deals.</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button
            type="button"
            onClick={() => toast.info('Feature coming soon', { module: 'Leads', description: "Import leads" })}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 rounded-xl cursor-pointer"
          >
            <Upload className="w-4 h-4" /> Import Leads
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </div>

      <KpiCards
        gridClassName="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2"
        items={[
          { key: 'leads', label: 'New Leads', value: String(metrics.newThisWeek), sub: 'This week' },
          { key: 'pending', label: 'Follow-up Today', value: String(metrics.followUpToday), sub: 'Leads to contact' },
          { key: 'alert', label: 'Overdue Follow-ups', value: String(metrics.overdueFollowUps), alert: Number(metrics.overdueFollowUps) > 0, sub: Number(metrics.overdueFollowUps) > 0 ? 'Requires attention' : 'All caught up' },
          { key: 'open', label: 'Unassigned Leads', value: String(metrics.unassigned), sub: 'Not assigned yet' },
          { key: 'value', label: 'Active Pipeline Value', value: formatLeadCurrency(Number(metrics.pipelineValue)), sub: `Conversion Rate ${metrics.conversionRate}% this month` },
        ]}
      />

      <LeadPipelineFunnel
        counts={pipelineCounts}
        activeStage={funnelStage}
        onStageClick={(stage) => { setFunnelStage(stage); setPage(1); }}
      />

      <FilterTabs
        tabs={[
          { id: 'mine', label: 'My Leads' },
          { id: 'today', label: `Follow-up Today (${metrics.followUpToday})` },
          { id: 'overdue', label: `Overdue (${metrics.overdueFollowUps})` },
          { id: 'new', label: `New / Uncontacted (${metrics.newUncontacted})` },
          { id: 'all', label: `All Leads (${metrics.totalLeads})` },
        ]}
        active={listTab}
        onChange={(id) => { setListTab(id); setPage(1); }}
      />

      <div className="bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search leads..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-medium"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={stageFilter} onChange={(e) => { setStageFilter(e.target.value); setPage(1); }} className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-2 cursor-pointer">
              <option value="all">Stage</option>
              {Object.entries(LEAD_STAGE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select value={ownerFilter} onChange={(e) => { setOwnerFilter(e.target.value); setPage(1); }} className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-2 cursor-pointer">
              <option value="all">Sales Rep</option>
              {owners.map((o: { id: string; name: string }) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <select value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }} className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-2 cursor-pointer">
              <option value="all">Source</option>
              {sourceFilterOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={nextActionFilter} onChange={(e) => { setNextActionFilter(e.target.value); setPage(1); }} className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-2 cursor-pointer">
              <option value="all">Next Action</option>
              {NEXT_ACTION_FILTERS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <button type="button" onClick={resetFilters} className="text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer px-2 py-2">
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-3 items-stretch flex-1 min-h-0">
        <div className="flex flex-col gap-3 min-h-0">
          <div className="flex items-center gap-2 px-1">
            <input
              type="checkbox"
              checked={paged.length > 0 && paged.every((l) => selectedIds.has(String(l.id)))}
              onChange={toggleSelectAll}
              className="cursor-pointer"
            />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Select page</span>
          </div>
          <AppTable
            className="flex-1"
            columns={columns}
            rows={paged}
            emptyMessage="No leads found."
            rowClassName={(row) => (String(row.id) === selectedId ? 'bg-blue-50/80' : '')}
            onRowClick={(row) => setSelectedId(String(row.id))}
            renderActions={(row) => (
              <>
                <button type="button" title="WhatsApp" onClick={(e) => { e.stopPropagation(); toast.info('Feature coming soon', { module: 'Leads', description: "WhatsApp" }); }} className="app-table-icon-btn cursor-pointer">
                  <MessageCircle className="w-4 h-4" />
                </button>
                <button type="button" title="Call" onClick={(e) => { e.stopPropagation(); toast.info('Feature coming soon', { module: 'Leads', description: "Call ${String(row.phone)} — coming soon." }); }} className="app-table-icon-btn cursor-pointer">
                  <Phone className="w-4 h-4" />
                </button>
                <button type="button" title="More" onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="app-table-icon-btn cursor-pointer">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </>
            )}
          />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
            <span>
              Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} leads
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg cursor-pointer disabled:opacity-50">Previous</button>
              {pageNumbers.map((n) => (
                <button key={n} type="button" onClick={() => setPage(n)} className={`min-w-[32px] px-2 py-1.5 rounded-lg font-bold cursor-pointer ${n === page ? 'bg-blue-600 text-white' : 'border border-slate-200 hover:bg-slate-50'}`}>{n}</button>
              ))}
              <button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg cursor-pointer disabled:opacity-50">Next</button>
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 cursor-pointer">
                {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size} / page</option>)}
              </select>
            </div>
          </div>
        </div>

        <LeadDetailPanel
          lead={selectedLead}
          activities={selectedActivities as Array<Record<string, unknown>>}
          detailTab={detailTab}
          onDetailTabChange={setDetailTab}
          onEdit={() => selectedLead && openEdit(selectedLead)}
          onConvert={() => {
            if (!selectedLead) return;
            const r = convertLeadToCustomer(appState, String(selectedLead.id), {});
            if (r.ok) { saveAppState(); toast.success('Done', { module: 'Leads', description: "Converted to customer" }); }
          }}
          onMarkLost={() => {
            if (!selectedLead) return;
            updateLead(appState, String(selectedLead.id), { status: 'lost' });
            saveAppState();
          }}
        />
      </div>

      <Footer />
    </div>
  );
}
