'use client';

import { useMemo, useState } from 'react';
import { Plus, Search, ChevronDown } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { FormHeader } from '@/components/layout/FormHeader';
import { useAppStore } from '@/lib/state/app-store';
import { getLeadList, getOwnerOptions, createLead, updateLead, convertLeadToCustomer, getLeadActivities } from '@/lib/services/crm-service';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { KanbanBoard, type KanbanCard } from '@/components/shared/KanbanBoard';
import { ProfileDrawer } from '@/components/shared/ProfileDrawer';
import { KpiCards } from '@/components/shared/KpiCards';

function formatCurrency(value: number) {
  return `৳${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    source: 'Trade Show',
    status: 'new',
    assignedRepId: '',
    priority: 'warm',
    expectedValue: '',
    probability: '',
    nextFollowUpAt: '',
    notes: '',
  });

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
    setForm({
      name: '',
      company: '',
      email: '',
      phone: '',
      source: 'Trade Show',
      status: 'new',
      assignedRepId: owners[0]?.id ?? '',
      priority: 'warm',
      expectedValue: '',
      probability: '',
      nextFollowUpAt: '',
      notes: '',
    });
    setEditingId(null);
    setShowAdvanced(false);
  };

  const openCreate = () => {
    resetForm();
    setView('form');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const owner = owners.find((o: { id: string; name: string }) => o.id === form.assignedRepId);
    const payload = {
      ...form,
      assignedRepName: owner?.name ?? '',
      expectedValue: Number(form.expectedValue || 0),
      probability: Number(form.probability || 0),
    };

    if (editingId) {
      updateLead(appState, editingId, payload);
    } else {
      createLead(appState, payload);
    }
    saveAppState();
    setView('main');
    resetForm();
  };

  if (view === 'form') {
    return (
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50">
        <div className="max-w-4xl mx-auto w-full space-y-6">
          <FormHeader
            title={editingId ? 'Edit lead' : 'Create lead'}
            subtitle="Capture basic lead info and assigned rep."
            onBack={() => {
              setView('main');
              resetForm();
            }}
          />
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-2">Lead name <span className="text-rose-500">*</span></label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none" />
              </div>
              <div>
                <label className="block mb-2">Company <span className="text-rose-500">*</span></label>
                <input required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none" />
              </div>
              <div>
                <label className="block mb-2">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none" />
              </div>
              <div>
                <label className="block mb-2">Phone <span className="text-rose-500">*</span></label>
                <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none" />
              </div>
              <div>
                <label className="block mb-2">Source <span className="text-rose-500">*</span></label>
                <select required value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none cursor-pointer">
                  {['Trade Show', 'Website', 'Referral', 'Facebook', 'Walk-in'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none cursor-pointer">
                  {['new', 'contacted', 'qualified', 'lost'].map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2">Assigned rep</label>
                <select value={form.assignedRepId} onChange={(e) => setForm({ ...form, assignedRepId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none cursor-pointer">
                  {owners.map((o: { id: string; name: string }) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2">Priority</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none cursor-pointer">
                  <option value="hot">Hot</option>
                  <option value="warm">Warm</option>
                  <option value="cold">Cold</option>
                </select>
              </div>
            </div>
            <div>
              <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-xs font-bold transition-colors cursor-pointer">
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                Show Advanced Details
              </button>
            </div>
            {showAdvanced && (
              <div className="space-y-6 pt-4 border-t border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                  <div>
                    <label className="block mb-2">Expected value</label>
                    <input type="number" min={0} value={form.expectedValue} onChange={(e) => setForm({ ...form, expectedValue: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none" />
                  </div>
                  <div>
                    <label className="block mb-2">Probability (%)</label>
                    <input type="number" min={0} max={100} value={form.probability} onChange={(e) => setForm({ ...form, probability: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none" />
                  </div>
                  <div>
                    <label className="block mb-2">Next follow-up</label>
                    <input type="date" value={form.nextFollowUpAt} onChange={(e) => setForm({ ...form, nextFollowUpAt: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Notes</label>
                  <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none" />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => { setView('main'); resetForm(); }} className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer">Cancel</button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer">Save lead</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 flex flex-col">
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
              {['Trade Show', 'Website', 'Referral', 'Facebook', 'Walk-in'].map((s) => (
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
            <div className="flex gap-2 pt-4">
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
