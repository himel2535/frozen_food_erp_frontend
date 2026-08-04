'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { AppFormFields, AppFormModal } from '@/components/shared/AppForm';
import { Footer } from '@/components/layout/Footer';
import { useChromeSuppressed, useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAppStore } from '@/lib/state/app-store';
import type { PortField } from '@/lib/modules/port-types';
import { createSupportTicket, ensureCrmState } from '@/lib/services/crm-service';
import { listFromState, updateInState, deleteFromState } from '@/lib/services/domain-service';
import { translateStatus } from '@/lib/i18n/resolve-label';

export function ComplaintsPage() {
  const t = useAppStore((s) => s.t);
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [folder, setFolder] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<'main' | 'form'>('main');
  const [form, setForm] = useState({ customer: '', subject: '', priority: 'normal', status: 'open', description: '' });

  const complaintFields = useMemo<PortField[]>(() => [
    { key: 'customer', label: t('sales.col_customer'), required: true },
    { key: 'subject', label: t('common.subject'), required: true },
    { key: 'priority', label: t('crm.col_priority'), type: 'select', options: ['normal', 'high'] },
    { key: 'description', label: t('crm.form_description'), type: 'textarea' },
  ], [t]);

  const folders = useMemo(() => [
    { id: 'all', label: t('crm.folder_all_tickets') },
    { id: 'open', label: t('crm.folder_open') },
    { id: 'in-progress', label: t('crm.folder_in_progress') },
    { id: 'resolved', label: t('crm.folder_resolved') },
    { id: 'high', label: t('crm.folder_high_priority') },
  ], [t]);

  const tickets = useMemo(() => {
    ensureCrmState(appState);
    const fromCrm = Object.values(appState.crmData?.supportTicketsById ?? {});
    const flat = listFromState(appState, 'crmComplaints');
    const merged = [...fromCrm, ...flat];
    const byId = new Map(merged.map((ticket) => [String((ticket as Record<string, unknown>).id), ticket as Record<string, unknown>]));
    let rows = [...byId.values()];
    if (folder === 'high') rows = rows.filter((ticket) => String(ticket.priority).toLowerCase() === 'high');
    else if (folder !== 'all') rows = rows.filter((ticket) => String(ticket.status).toLowerCase() === folder);
    return rows.sort((a, b) => String(b.openedAt ?? b.createdAt ?? '').localeCompare(String(a.openedAt ?? a.createdAt ?? '')));
  }, [appState, folder]);

  const selected = tickets.find((ticket) => String(ticket.id) === selectedId) ?? tickets[0] ?? null;

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
    const ticketMap = appState.crmData?.supportTicketsById as Record<string, Record<string, unknown>> | undefined;
    if (ticketMap?.[id]) {
      ticketMap[id] = { ...ticketMap[id], status };
    }
    saveAppState();
  };

  useChromeSuppressed(view === 'form');

  useRegisterModuleActions(
    view === 'main' ? (
      <button type="button" onClick={() => setView('form')} className="bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2">
        <Plus className="w-4 h-4" /> {t('crm.add_complaint')}
      </button>
    ) : null,
    [view, t],
  );

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-[480px]">
        <aside className="lg:w-48 shrink-0 bg-white rounded-xl border border-slate-200 p-3 space-y-1">
          {folders.map((f) => (
            <button key={f.id} type="button" onClick={() => setFolder(f.id)} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold cursor-pointer ${folder === f.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}>{f.label}</button>
          ))}
        </aside>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
          <div className="bg-white rounded-xl border border-slate-200 overflow-y-auto">
            {tickets.map((ticket) => (
              <button key={String(ticket.id)} type="button" onClick={() => setSelectedId(String(ticket.id))} className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${selectedId === String(ticket.id) ? 'bg-blue-50' : ''}`}>
                <div className="font-bold text-xs text-slate-900">{String(ticket.subject ?? ticket.id)}</div>
                <div className="text-[10px] text-slate-500">{String(ticket.customer ?? '')}</div>
                <StatusBadge status={String(ticket.status ?? 'open')} />
              </button>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 text-xs space-y-4">
            {selected ? (
              <>
                <h3 className="text-sm font-bold">{String(selected.subject)}</h3>
                <p className="text-slate-600">{String(selected.description ?? t('crm.no_description'))}</p>
                <div className="flex gap-2 flex-wrap">
                  <button type="button" className="px-3 py-1.5 bg-amber-50 text-amber-700 font-bold rounded-lg cursor-pointer" onClick={() => setStatus(String(selected.id), 'in-progress')}>{translateStatus(t, 'in-progress')}</button>
                  <button type="button" className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold rounded-lg cursor-pointer" onClick={() => setStatus(String(selected.id), 'resolved')}>{t('crm.resolve')}</button>
                  <button type="button" className="px-3 py-1.5 text-rose-600 font-bold cursor-pointer" onClick={() => { deleteFromState(appState, 'crmComplaints', String(selected.id)); saveAppState(); }}>{t('common.delete')}</button>
                </div>
              </>
            ) : (
              <p className="text-slate-400">{t('crm.select_complaint')}</p>
            )}
          </div>
        </div>
      </div>
      <Footer />
    <AppFormModal
      open={view === 'form'}
      onClose={() => setView('main')}
      title={t('crm.log_complaint')}
      subtitle={t('crm.complaints_subtitle')}
      onSubmit={handleSubmit}
      submitLabel={t('crm.save_complaint')}
      size="md"
    >
      <AppFormFields
        fields={complaintFields}
        values={form}
        onChange={(key, value) => setForm({ ...form, [key]: value })}
      />
    </AppFormModal>
    </>
  );
}
