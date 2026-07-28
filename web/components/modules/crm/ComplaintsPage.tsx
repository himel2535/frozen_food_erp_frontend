'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { FormHeader } from '@/components/layout/FormHeader';
import { FilterTabs } from '@/components/shared/FilterTabs';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAppStore } from '@/lib/state/app-store';
import { createSupportTicket, ensureCrmState } from '@/lib/services/crm-service';
import { listFromState, updateInState, deleteFromState } from '@/lib/services/domain-service';

const FOLDERS = [
  { id: 'all', label: 'All Tickets' },
  { id: 'open', label: 'Open' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'high', label: 'High Priority' },
];

export function ComplaintsPage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [folder, setFolder] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<'main' | 'form'>('main');
  const [form, setForm] = useState({ customer: '', subject: '', priority: 'normal', status: 'open', description: '' });

  const tickets = useMemo(() => {
    ensureCrmState(appState);
    const fromCrm = Object.values(appState.crmData?.supportTicketsById ?? {});
    const flat = listFromState(appState, 'crmComplaints');
    const merged = [...fromCrm, ...flat];
    const byId = new Map(merged.map((t) => [String((t as Record<string, unknown>).id), t as Record<string, unknown>]));
    let rows = [...byId.values()];
    if (folder === 'high') rows = rows.filter((t) => String(t.priority).toLowerCase() === 'high');
    else if (folder !== 'all') rows = rows.filter((t) => String(t.status).toLowerCase() === folder);
    return rows.sort((a, b) => String(b.openedAt ?? b.createdAt ?? '').localeCompare(String(a.openedAt ?? a.createdAt ?? '')));
  }, [appState, folder]);

  const selected = tickets.find((t) => String(t.id) === selectedId) ?? tickets[0] ?? null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSupportTicket(appState, form);
    saveAppState();
    setView('main');
    setForm({ customer: '', subject: '', priority: 'normal', status: 'open', description: '' });
  };

  const setStatus = (id: string, status: string) => {
    updateInState(appState, 'crmComplaints', id, { status });
    ensureCrmState(appState);
    const tickets = appState.crmData?.supportTicketsById as Record<string, Record<string, unknown>> | undefined;
    if (tickets?.[id]) {
      tickets[id] = { ...tickets[id], status };
    }
    saveAppState();
  };

  if (view === 'form') {
    return (
      <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">
        <div className="max-w-3xl mx-auto space-y-6">
          <FormHeader title="Log Complaint" subtitle="Track customer complaints and resolutions." onBack={() => setView('main')} />
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 text-xs">
            <input required placeholder="Customer" value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" />
            <input required placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" />
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
            <textarea rows={4} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" />
            <button type="submit" className="bg-blue-600 text-white font-bold px-4 py-2.5 rounded-xl cursor-pointer">Save</button>
          </form>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 flex flex-col">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Complaints</h2>
          <p className="text-xs text-slate-500 mt-1">Track customer complaints and resolutions.</p>
        </div>
        <button type="button" onClick={() => setView('form')} className="bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2"><Plus className="w-4 h-4" /> New Complaint</button>
      </div>
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-[480px]">
        <aside className="lg:w-48 shrink-0 bg-white rounded-xl border border-slate-200 p-3 space-y-1">
          {FOLDERS.map((f) => (
            <button key={f.id} type="button" onClick={() => setFolder(f.id)} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold cursor-pointer ${folder === f.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}>{f.label}</button>
          ))}
        </aside>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
          <div className="bg-white rounded-xl border border-slate-200 overflow-y-auto">
            {tickets.map((t) => (
              <button key={String(t.id)} type="button" onClick={() => setSelectedId(String(t.id))} className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${selectedId === String(t.id) ? 'bg-blue-50' : ''}`}>
                <div className="font-bold text-xs text-slate-900">{String(t.subject ?? t.id)}</div>
                <div className="text-[10px] text-slate-500">{String(t.customer ?? '')}</div>
                <StatusBadge status={String(t.status ?? 'open')} />
              </button>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 text-xs space-y-4">
            {selected ? (
              <>
                <h3 className="text-sm font-bold">{String(selected.subject)}</h3>
                <p className="text-slate-600">{String(selected.description ?? 'No description.')}</p>
                <div className="flex gap-2 flex-wrap">
                  <button type="button" className="px-3 py-1.5 bg-amber-50 text-amber-700 font-bold rounded-lg cursor-pointer" onClick={() => setStatus(String(selected.id), 'in-progress')}>In Progress</button>
                  <button type="button" className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold rounded-lg cursor-pointer" onClick={() => setStatus(String(selected.id), 'resolved')}>Resolve</button>
                  <button type="button" className="px-3 py-1.5 text-rose-600 font-bold cursor-pointer" onClick={() => { deleteFromState(appState, 'crmComplaints', String(selected.id)); saveAppState(); }}>Delete</button>
                </div>
              </>
            ) : (
              <p className="text-slate-400">Select a complaint</p>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
