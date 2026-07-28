'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { FormHeader } from '@/components/layout/FormHeader';
import { AdvancedDetailsToggle } from '@/components/shared/AdvancedDetailsToggle';
import { KanbanBoard, type KanbanCard } from '@/components/shared/KanbanBoard';
import { useAppStore } from '@/lib/state/app-store';
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
import { ProfileDrawer } from '@/components/shared/ProfileDrawer';

function formatCurrency(value: number) {
  return `৳${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function DealsPage() {
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
      title: DEAL_STAGE_LABELS[stage as keyof typeof DEAL_STAGE_LABELS] || stage,
      cards: deals
        .filter((d) => d.stage === stage)
        .map(
          (d): KanbanCard => ({
            id: String(d.id),
            title: String(d.title),
            subtitle: String(d.company),
            meta: formatCurrency(Number(d.expectedValue || 0)),
            stage,
          })
        ),
    }));
  }, [deals]);

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
      window.alert(result.error ?? 'Stage update failed');
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
      window.alert('error' in result ? result.error : 'Save failed');
      return;
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
            title={editingId ? 'Edit Deal' : 'Create Deal'}
            subtitle="Track deal stages, values, and follow-ups."
            onBack={() => { setView('main'); resetForm(); }}
          />
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-2">Deal Title <span className="text-rose-500">*</span></label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
              <div>
                <label className="block mb-2">Company <span className="text-rose-500">*</span></label>
                <input required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
              <div>
                <label className="block mb-2">Contact Person</label>
                <input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
              <div>
                <label className="block mb-2">Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
              <div>
                <label className="block mb-2">Stage</label>
                <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  {DEAL_STAGES.map((s) => (
                    <option key={s} value={s}>{DEAL_STAGE_LABELS[s as keyof typeof DEAL_STAGE_LABELS]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2">Expected Value</label>
                <input type="number" value={form.expectedValue} onChange={(e) => setForm({ ...form, expectedValue: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
              <div>
                <label className="block mb-2">Probability %</label>
                <input type="number" value={form.probability} onChange={(e) => setForm({ ...form, probability: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
              <div>
                <label className="block mb-2">Expected Close Date</label>
                <input type="date" value={form.expectedCloseDate} onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
              <div>
                <label className="block mb-2">Assigned Rep</label>
                <select value={form.assignedRepId} onChange={(e) => setForm({ ...form, assignedRepId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  {owners.map((o: { id: string; name: string }) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block mb-2">Products Summary</label>
                <input value={form.productsSummary} onChange={(e) => setForm({ ...form, productsSummary: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
            </div>
            <AdvancedDetailsToggle open={showAdvanced} onToggle={() => setShowAdvanced(!showAdvanced)} />
            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-700">
                <div>
                  <label className="block mb-2">Competitor</label>
                  <input value={form.competitor} onChange={(e) => setForm({ ...form, competitor: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" />
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-2">Notes</label>
                  <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => { setView('main'); resetForm(); }} className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer">Cancel</button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer">Save Deal</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Deals & Pipeline</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track deal stages, values, and follow-ups · {deals.length} deals · {formatCurrency(pipelineValue)} pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setLayoutMode('kanban')} className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${layoutMode === 'kanban' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>Kanban</button>
          <button type="button" onClick={() => setLayoutMode('table')} className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${layoutMode === 'table' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>Table</button>
          <input
            type="search"
            placeholder="Search deals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 w-48"
          />
          <button type="button" onClick={openCreate} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer">
            <Plus className="w-4 h-4" /> Add Deal
          </button>
        </div>
      </div>

      <KpiCards items={[
        { key: 'open', label: 'Open Deals', value: String(metrics.totalDeals ?? 0), sub: formatCurrency(Number(metrics.pipelineValue ?? 0)) },
        { key: 'won', label: 'Won Deals', value: String(metrics.wonDeals ?? 0) },
        { key: 'forecast', label: 'Weighted Forecast', value: formatCurrency(Number(metrics.forecastValue ?? 0)) },
        { key: 'avg', label: 'Avg Deal Size', value: formatCurrency(Number(metrics.averageDealSize ?? 0)) },
      ]} />

      {layoutMode === 'kanban' ? (
        <KanbanBoard columns={columns} onStageChange={handleStageChange} onCardClick={(card) => setDetailId(card.id)} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
              <tr><th className="p-4 text-left">Deal</th><th className="p-4">Stage</th><th className="p-4 text-right">Value</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deals.map((d) => (
                <tr key={String(d.id)} className="hover:bg-slate-50 cursor-pointer" onClick={() => setDetailId(String(d.id))}>
                  <td className="p-4"><div className="font-bold">{String(d.title)}</div><div className="text-slate-500">{String(d.company)}</div></td>
                  <td className="p-4">{DEAL_STAGE_LABELS[d.stage as keyof typeof DEAL_STAGE_LABELS] || String(d.stage)}</td>
                  <td className="p-4 text-right font-bold">{formatCurrency(Number(d.expectedValue || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
              <div>Value: <strong>{formatCurrency(Number(detailDeal.expectedValue || 0))}</strong></div>
            </div>
            <ul className="space-y-2">{(timeline as Array<Record<string, unknown>>).map((e, i) => (
              <li key={i} className="border-l-2 border-blue-200 pl-3">{String(e.summary ?? e.type ?? e.note)}</li>
            ))}</ul>
            <div className="flex gap-2">
              <button type="button" className="px-3 py-2 bg-emerald-600 text-white font-bold rounded-xl cursor-pointer" onClick={() => { markDealWon(appState, String(detailDeal.id), {}); saveAppState(); setDetailId(null); }}>Mark Won</button>
              <button type="button" className="px-3 py-2 bg-rose-600 text-white font-bold rounded-xl cursor-pointer" onClick={() => { markDealLost(appState, String(detailDeal.id), {}); saveAppState(); setDetailId(null); }}>Mark Lost</button>
              <button type="button" className="px-3 py-2 border border-slate-200 font-bold rounded-xl cursor-pointer" onClick={() => openEdit(String(detailDeal.id))}>Edit</button>
            </div>
          </div>
        )}
      </ProfileDrawer>

      <Footer />
    </div>
  );
}
