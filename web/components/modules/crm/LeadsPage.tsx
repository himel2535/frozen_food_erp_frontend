'use client';

import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { useAppStore } from '@/lib/state/app-store';
import { getLeadList, getOwnerOptions, createLead, updateLead, convertLeadToCustomer, getLeadActivities } from '@/lib/services/crm-service';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { KanbanBoard, type KanbanCard } from '@/components/shared/KanbanBoard';
import { ProfileDrawer } from '@/components/shared/ProfileDrawer';
import { KpiCards } from '@/components/shared/KpiCards';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import {
  LeadForm,
  EMPTY_LEAD_FORM,
  splitFollowUpAt,
  type LeadFormPayload,
  type LeadFormValues,
} from '@/components/modules/crm/LeadForm';
import { LEAD_SOURCE_OPTIONS } from '@/components/modules/crm/lead-form/lead-form-options';

function formatCurrency(value: number) {
  return `৳${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

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
    notes: String(lead.notes ?? ''),
  };
}

export function LeadsPage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [view, setView] = useState<'main' | 'form'>('main');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [layoutMode, setLayoutMode] = useState<'table' | 'kanban'>('table');
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [formValues, setFormValues] = useState<LeadFormValues>(EMPTY_LEAD_FORM);

  const owners = useMemo(() => getOwnerOptions(appState), [appState]);

  const leads = useMemo(() => {
    return (getLeadList(appState) as Array<Record<string, unknown>>).filter((lead) => {
      const hay = `${lead.name} ${lead.company} ${lead.source} ${lead.phone} ${lead.email}`.toLowerCase();
      if (search && !hay.includes(search.toLowerCase())) return false;
      if (statusFilter !== 'all' && String(lead.status) !== statusFilter) return false;
      if (sourceFilter !== 'all' && String(lead.source) !== sourceFilter) return false;
      if (ownerFilter !== 'all' && String(lead.assignedRepId) !== ownerFilter) return false;
      return true;
    });
  }, [appState, search, statusFilter, sourceFilter, ownerFilter]);

  const drawerLead = useMemo(() => leads.find((l) => String(l.id) === drawerId), [leads, drawerId]);
  const drawerActivities = useMemo(() => (drawerId ? getLeadActivities(appState, drawerId) : []), [appState, drawerId]);

  const kanbanColumns = useMemo(() => {
    const stages = ['new', 'contacted', 'qualified', 'lost'];
    return stages.map((stage) => ({
      id: stage,
      title: stage.charAt(0).toUpperCase() + stage.slice(1),
      cards: leads.filter((l) => String(l.status) === stage).map((l): KanbanCard => ({
        id: String(l.id),
        title: String(l.name),
        subtitle: String(l.company),
        meta: formatCurrency(Number(l.expectedValue || 0)),
        stage,
      })),
    }));
  }, [leads]);

  const openCount = leads.filter((l) => l.conversionStatus !== 'converted' && l.status !== 'lost').length;
  const totalValue = leads.reduce((s, l) => s + Number(l.expectedValue || 0), 0);

  const leadColumns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    {
      key: 'name',
      label: 'Lead name / company',
      render: (row) => (
        <>
          <div className="font-bold text-slate-900">{String(row.name)}</div>
          <div className="text-slate-500 text-[11px]">{String(row.company)}</div>
        </>
      ),
    },
    {
      key: 'contact',
      label: 'Contact detail',
      render: (row) => (
        <>
          <div>{String(row.phone)}</div>
          <div className="text-slate-500 text-[11px]">{String(row.email || '—')}</div>
        </>
      ),
    },
    { key: 'source', label: 'Source', render: (row) => String(row.source) },
    { key: 'rep', label: 'Assigned rep', render: (row) => String(row.assignedRepName || '—') },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={String(row.status)} />,
    },
    { key: 'value', label: 'Value', render: (row) => formatCurrency(Number(row.expectedValue || 0)) },
  ], []);

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
    setDrawerId(null);
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

  const sourceFilterOptions = useMemo(() => {
    const fromData = new Set(leads.map((l) => String(l.source)).filter(Boolean));
    LEAD_SOURCE_OPTIONS.forEach((source) => fromData.add(source));
    return Array.from(fromData).sort();
  }, [leads]);

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
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Leads</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Capture prospects, track follow-ups, and convert leads to deals.</p>
        </div>
        <button type="button" onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer">
          <Plus className="w-4 h-4" /> Add lead
        </button>
      </div>

      <KpiCards items={[
        { key: 'open', label: 'Total open leads', value: String(openCount) },
        { key: 'rate', label: 'Lead conversion rate', value: `${leads.length ? Math.round((leads.filter((l) => l.conversionStatus === 'converted').length / leads.length) * 100) : 0}%` },
        { key: 'value', label: 'Target value', value: formatCurrency(totalValue) },
      ]} />

      <div className="flex gap-2">
        <button type="button" onClick={() => setLayoutMode('table')} className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${layoutMode === 'table' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Table</button>
        <button type="button" onClick={() => setLayoutMode('kanban')} className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${layoutMode === 'kanban' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Kanban</button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, company, source..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-medium"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-2 focus:outline-none cursor-pointer">
              <option value="all">All statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="lost">Lost</option>
            </select>
            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-2 focus:outline-none cursor-pointer">
              <option value="all">All sources</option>
              {sourceFilterOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-2 focus:outline-none cursor-pointer">
              <option value="all">All reps</option>
              {owners.map((o: { id: string; name: string }) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {layoutMode === 'kanban' ? (
        <KanbanBoard
          columns={kanbanColumns}
          onStageChange={(cardId, stage) => { updateLead(appState, cardId, { status: stage }); saveAppState(); }}
          onCardClick={(card) => setDrawerId(card.id)}
        />
      ) : (
        <AppTable
          columns={leadColumns}
          rows={leads}
          emptyMessage="No leads found"
          onRowClick={(row) => setDrawerId(String(row.id))}
        />
      )}

      <ProfileDrawer
        open={!!drawerLead}
        title={String(drawerLead?.name ?? 'Lead')}
        subtitle={String(drawerLead?.company ?? '')}
        onClose={() => setDrawerId(null)}
        tabs={[{ id: 'notes', label: 'Notes' }, { id: 'activity', label: 'Activity' }]}
        activeTab="activity"
        onTabChange={() => {}}
      >
        {drawerLead && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">{String(drawerLead.notes || 'No notes yet.')}</p>
            <ul className="space-y-2">{(drawerActivities as Array<Record<string, unknown>>).map((a) => (
              <li key={String(a.id)}>{String(a.summary ?? a.type)}</li>
            ))}</ul>
            <div className="flex flex-wrap gap-2 pt-4">
              <button type="button" className="px-3 py-2 bg-blue-600 text-white font-bold rounded-xl cursor-pointer" onClick={() => openEdit(drawerLead)}>
                Edit Lead
              </button>
              <button type="button" className="px-3 py-2 bg-emerald-600 text-white font-bold rounded-xl cursor-pointer" onClick={() => {
                const r = convertLeadToCustomer(appState, String(drawerLead.id), {});
                if (r.ok) { saveAppState(); window.alert('Converted to customer'); setDrawerId(null); }
              }}>Convert to Customer</button>
              <button type="button" className="px-3 py-2 bg-rose-50 text-rose-700 font-bold rounded-xl cursor-pointer" onClick={() => {
                updateLead(appState, String(drawerLead.id), { status: 'lost' }); saveAppState(); setDrawerId(null);
              }}>Mark Lost</button>
            </div>
          </div>
        )}
      </ProfileDrawer>

      <Footer />
    </div>
  );
}
