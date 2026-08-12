'use client';

import { toast } from '@/lib/ui/feedback';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { AppFormFields, AppFormModal } from '@/components/shared/AppForm';
import { useAppStore } from '@/lib/state/app-store';
import { useApiResourceStore } from '@/hooks/use-api-resource-store';
import { usePaginatedApiResource } from '@/hooks/use-paginated-api-resource';
import { ListPagination } from '@/components/shared/ListPagination';
import { mapGenericApiRow, mapGenericPayloadToApi } from '@/lib/services/generic-api-mapper';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { isModuleApiMode } from '@/lib/config/data-source';
import type { PortField } from '@/lib/modules/port-types';
import {
  createOpeningDue,
  filterDueEntries,
  getDueMetrics,
  listDueEntries,
  receiveDuePayment,
  type DueEntry,
} from '@/lib/services/due-management-service';
import { DueMetrics } from './due-management/DueMetrics';
import { DueTabs } from './due-management/DueTabs';
import { DueFilterBar } from './due-management/DueFilterBar';
import { DueTable } from './due-management/DueTable';
import { DueDetailPanel } from './due-management/DueDetailPanel';
import { DueInfoBanner } from './due-management/DueInfoBanner';
import type { DueDetailTab, DueTab } from './due-management/due-types';

const PAGE_SIZE = 8;

const OPENING_FIELDS: PortField[] = [
  { key: 'party', label: 'Party Name', required: true },
  { key: 'type', label: 'Type', type: 'select', options: ['customer', 'supplier'] },
  { key: 'amount', label: 'Amount Due', type: 'number', required: true },
  { key: 'dueDate', label: 'Due Date', type: 'date', required: true },
  { key: 'location', label: 'Location', advanced: true },
  { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
];

const RECEIVE_FIELDS: PortField[] = [
  { key: 'amount', label: 'Receive Amount', type: 'number', required: true },
  { key: 'date', label: 'Payment Date', type: 'date', required: true },
  { key: 'method', label: 'Payment Method', type: 'select', options: ['Cash', 'Bank', 'Mobile Banking', 'Cheque'] },
  { key: 'reference', label: 'Reference', advanced: true },
];

export function DueManagementPage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const apiMode = isModuleApiMode('dues');
  const apiStore = usePaginatedApiResource('dues', mapGenericApiRow, { pageSize: PAGE_SIZE });
  const cashboxStore = useApiResourceStore('cashbox', mapGenericApiRow, { pageOnly: true, lookupLimit: 100 });

  const [activeTab, setActiveTab] = useState<DueTab>('customer');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DueDetailTab>('invoices');

  const [showOpeningModal, setShowOpeningModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receiveTarget, setReceiveTarget] = useState<DueEntry | null>(null);
  const [showAdvancedOpening, setShowAdvancedOpening] = useState(false);
  const [showAdvancedReceive, setShowAdvancedReceive] = useState(false);

  const [openingForm, setOpeningForm] = useState({
    party: '', type: 'customer', amount: '', dueDate: new Date().toISOString().slice(0, 10), location: '', notes: '',
  });
  const [receiveForm, setReceiveForm] = useState({
    amount: '', date: new Date().toISOString().slice(0, 10), method: 'Cash', reference: '',
  });

  const allEntries = useMemo(() => {
    if (apiMode && apiStore.initialized) {
      return listDueEntries({ dueEntries: apiStore.rows } as import('@/lib/state/types').AppState);
    }
    return listDueEntries(appState);
  }, [apiMode, apiStore.initialized, apiStore.rows, appState]);
  const metrics = useMemo(() => getDueMetrics(
    apiMode && apiStore.initialized
      ? { dueEntries: apiStore.rows } as import('@/lib/state/types').AppState
      : appState,
  ), [apiMode, apiStore.initialized, apiStore.rows, appState]);

  const effectiveSearch = apiMode ? apiStore.search : search;

  const filteredRows = useMemo(
    () => filterDueEntries(allEntries, { type: activeTab, search: effectiveSearch, status: statusFilter }),
    [allEntries, activeTab, effectiveSearch, statusFilter],
  );

  const onPageChange = (p: number) => {
    if (apiMode) apiStore.setPage(p);
    else setPage(p);
  };

  const tablePage = apiMode ? 1 : page;
  const tablePageSize = apiMode ? Math.max(filteredRows.length, 1) : PAGE_SIZE;

  const handleTabChange = (tab: DueTab) => {
    setActiveTab(tab);
    setSelectedPartyId(null);
    onPageChange(1);
  };

  const openReceive = (entry: DueEntry) => {
    setReceiveTarget(entry);
    setReceiveForm({
      amount: String(entry.due),
      date: new Date().toISOString().slice(0, 10),
      method: 'Cash',
      reference: '',
    });
    setShowReceiveModal(true);
  };

  const handleOpeningSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openingForm.party || !openingForm.amount || !openingForm.dueDate) return;
    if (apiMode) {
      const total = Number(openingForm.amount);
      const result = await apiStore.create(mapGenericPayloadToApi({
        type: openingForm.type,
        partyName: openingForm.party,
        partyLocation: openingForm.location || '—',
        total,
        paid: 0,
        due: total,
        dueDate: openingForm.dueDate,
        notes: openingForm.notes,
        status: 'upcoming',
      }));
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Due Management', description: 'error' in result ? String(result.error) : 'Failed to create opening due' });
        return;
      }
      toast.success('Saved', { module: 'Due Management', description: 'Opening due created.' });
      setActiveTab(openingForm.type as DueTab);
      setShowOpeningModal(false);
      setOpeningForm({ party: '', type: activeTab, amount: '', dueDate: new Date().toISOString().slice(0, 10), location: '', notes: '' });
      if (apiMode) apiStore.setSearchTerm('');
      else setSearch('');
      setStatusFilter('all');
      onPageChange(1);
      return;
    }
    createOpeningDue(appState, openingForm);
    saveAppState();
    setShowOpeningModal(false);
    setOpeningForm({ party: '', type: activeTab, amount: '', dueDate: new Date().toISOString().slice(0, 10), location: '', notes: '' });
  };

  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveTarget || !receiveForm.amount) return;
    if (apiMode) {
      const payAmount = Math.min(Number(receiveForm.amount), receiveTarget.due);
      const paid = receiveTarget.paid + payAmount;
      const due = Math.max(0, receiveTarget.total - paid);
      const result = await apiStore.update(receiveTarget.id, mapGenericPayloadToApi({
        paid,
        due,
        status: due <= 0 ? 'upcoming' : 'partial',
      }));
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Due Management', description: 'error' in result ? String(result.error) : 'Failed to record payment' });
        return;
      }
      if (receiveForm.method === 'Cash' && isModuleApiMode('cashbox')) {
        const cashSync = await cashboxStore.create(mapGenericPayloadToApi({
          type: 'cash_in',
          cashIn: payAmount,
          cashOut: 0,
          amount: payAmount,
          datetime: new Date(`${receiveForm.date}T12:00:00`).toISOString(),
          category: 'Due Collection',
          party: receiveTarget.partyName,
          paymentMethod: 'Cash',
          reference: receiveForm.reference,
          description: `Due collection from ${receiveTarget.partyName}`,
          note: receiveForm.reference,
        }));
        if (!cashSync.ok) {
          toast.error('Operation failed', { module: 'Due Management', description: 'error' in cashSync ? String(cashSync.error) : 'Cashbox sync failed' });
          return;
        }
      }
      toast.success('Saved', { module: 'Due Management', description: 'Payment recorded.' });
      setShowReceiveModal(false);
      setReceiveTarget(null);
      if (apiMode) apiStore.setSearchTerm('');
      else setSearch('');
      setStatusFilter('all');
      onPageChange(1);
      return;
    }
    receiveDuePayment(appState, receiveTarget.id, Number(receiveForm.amount));
    saveAppState();
    setShowReceiveModal(false);
    setReceiveTarget(null);
  };

  useRegisterModuleActions(
    <button
      type="button"
      onClick={() => {
        setOpeningForm((f) => ({ ...f, type: activeTab }));
        setShowOpeningModal(true);
      }}
      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer self-start xl:self-auto"
    >
      <Plus className="w-4 h-4" />
      Opening Due
    </button>,
    [activeTab],
  );

  return (
    <>
        {apiStore.error ? <ApiModeBanner module="dues" error={apiStore.error} /> : null}
        <DueMetrics metrics={metrics} />

        <div className={`grid gap-3 items-start ${selectedPartyId ? 'grid-cols-1 xl:grid-cols-[1fr_360px]' : 'grid-cols-1'}`}>
          <div className="premium-card premium-shadow overflow-hidden min-w-0">
            <DueTabs active={activeTab} onChange={handleTabChange} />
            <DueFilterBar
              search={effectiveSearch}
              statusFilter={statusFilter}
              onSearchChange={(v) => {
                if (apiMode) apiStore.setSearchTerm(v);
                else setSearch(v);
                onPageChange(1);
              }}
              onStatusChange={(v) => { setStatusFilter(v); onPageChange(1); }}
            />
            <DueTable
              rows={filteredRows}
              page={tablePage}
              pageSize={tablePageSize}
              selectedPartyId={selectedPartyId}
              partyColumnLabel={activeTab === 'customer' ? 'Customer' : 'Supplier'}
              onPageChange={onPageChange}
              onRowClick={(entry) => { setSelectedPartyId(entry.partyId); setDetailTab('invoices'); }}
              onReceive={openReceive}
            />
            {apiMode ? (
              <ListPagination
                page={apiStore.page}
                pageSize={apiStore.pageSize}
                total={apiStore.meta.total}
                onPageChange={apiStore.setPage}
              />
            ) : null}
          </div>

          {selectedPartyId && (
            <DueDetailPanel
              entries={allEntries}
              partyId={selectedPartyId}
              detailTab={detailTab}
              onDetailTabChange={setDetailTab}
              onClose={() => setSelectedPartyId(null)}
              onReceive={openReceive}
              onSendReminder={() => toast.info('Feature coming soon', { module: 'Accounting', description: "WhatsApp reminder coming soon." })}
            />
          )}
        </div>

        <DueInfoBanner />
        <Footer />

      <AppFormModal
        open={showOpeningModal}
        onClose={() => setShowOpeningModal(false)}
        title="Opening Due"
        subtitle="Add a manual opening balance due record."
        onSubmit={handleOpeningSubmit}
        submitLabel="Save Due"
        size="md"
      >
        <AppFormFields
          fields={OPENING_FIELDS}
          values={openingForm}
          onChange={(k, v) => setOpeningForm((f) => ({ ...f, [k]: v }))}
          showAdvanced={showAdvancedOpening}
          onToggleAdvanced={() => setShowAdvancedOpening((p) => !p)}
        />
      </AppFormModal>

      <AppFormModal
        open={showReceiveModal}
        onClose={() => { setShowReceiveModal(false); setReceiveTarget(null); }}
        title="Receive Payment"
        subtitle={receiveTarget ? `${receiveTarget.partyName} — ${receiveTarget.invoiceId}` : ''}
        onSubmit={handleReceiveSubmit}
        submitLabel="Save Payment"
        size="md"
      >
        <AppFormFields
          fields={RECEIVE_FIELDS}
          values={receiveForm}
          onChange={(k, v) => setReceiveForm((f) => ({ ...f, [k]: v }))}
          showAdvanced={showAdvancedReceive}
          onToggleAdvanced={() => setShowAdvancedReceive((p) => !p)}
        />
      </AppFormModal>
    </>
  );
}
