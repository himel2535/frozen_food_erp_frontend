'use client';

import { toast } from '@/lib/ui/feedback';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { AppFormFields, AppFormModal } from '@/components/shared/AppForm';
import { useAppStore } from '@/lib/state/app-store';
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

  const allEntries = useMemo(() => listDueEntries(appState), [appState]);
  const metrics = useMemo(() => getDueMetrics(appState), [appState]);

  const filteredRows = useMemo(
    () => filterDueEntries(allEntries, { type: activeTab, search, status: statusFilter }),
    [allEntries, activeTab, search, statusFilter],
  );

  const handleTabChange = (tab: DueTab) => {
    setActiveTab(tab);
    setSelectedPartyId(null);
    setPage(1);
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

  const handleOpeningSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!openingForm.party || !openingForm.amount || !openingForm.dueDate) return;
    createOpeningDue(appState, openingForm);
    saveAppState();
    setShowOpeningModal(false);
    setOpeningForm({ party: '', type: activeTab, amount: '', dueDate: new Date().toISOString().slice(0, 10), location: '', notes: '' });
  };

  const handleReceiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveTarget || !receiveForm.amount) return;
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
        <DueMetrics metrics={metrics} />

        <div className={`grid gap-3 items-start ${selectedPartyId ? 'grid-cols-1 xl:grid-cols-[1fr_360px]' : 'grid-cols-1'}`}>
          <div className="premium-card premium-shadow overflow-hidden min-w-0">
            <DueTabs active={activeTab} onChange={handleTabChange} />
            <DueFilterBar
              search={search}
              statusFilter={statusFilter}
              onSearchChange={(v) => { setSearch(v); setPage(1); }}
              onStatusChange={(v) => { setStatusFilter(v); setPage(1); }}
            />
            <DueTable
              rows={filteredRows}
              page={page}
              pageSize={PAGE_SIZE}
              selectedPartyId={selectedPartyId}
              partyColumnLabel={activeTab === 'customer' ? 'Customer' : 'Supplier'}
              onPageChange={setPage}
              onRowClick={(entry) => { setSelectedPartyId(entry.partyId); setDetailTab('invoices'); }}
              onReceive={openReceive}
            />
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
