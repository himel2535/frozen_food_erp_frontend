'use client';

import { toast } from '@/lib/ui/feedback';

import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { AppFormFields, AppFormModal } from '@/components/shared/AppForm';
import { useAppStore } from '@/lib/state/app-store';
import type { PortField } from '@/lib/modules/port-types';
import { getCustomerList } from '@/lib/services/crm-service';
import {
  createCustomerDue,
  filterCustomerReceivables,
  getCustomerReceivableDetail,
  getCustomerReceivableMetrics,
  getTodayCollectionStats,
  listCustomerReceivables,
  receiveCustomerPayment,
  type CustomerReceivable,
} from '@/lib/services/customer-receivables-service';
import { CustomerDueMetrics } from './customer-due/CustomerDueMetrics';
import { CustomerDueCollectionBar } from './customer-due/CustomerDueCollectionBar';
import { CustomerDueFilterBar } from './customer-due/CustomerDueFilterBar';
import { CustomerDueTable } from './customer-due/CustomerDueTable';
import { CustomerDueDetailPanel } from './customer-due/CustomerDueDetailPanel';
import { RECEIVE_PAYMENT_FIELDS } from './customer-due/customer-due-options';
import type { CustomerDueDetailTab, CustomerDueViewMode } from './customer-due/customer-due-types';

const DEFAULT_PAGE_SIZE = 5;

const RECEIVE_FORM_FIELDS: PortField[] = RECEIVE_PAYMENT_FIELDS.map((f) => ({ ...f }));

function customerOptionLabel(name: string, company: string) {
  return `${name} — ${company}`;
}

export function CustomerDuePage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('my_tasks');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [viewMode, setViewMode] = useState<CustomerDueViewMode>('list');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<CustomerDueDetailTab>('overview');
  const [initialized, setInitialized] = useState(false);

  const [showAddDueModal, setShowAddDueModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receiveTarget, setReceiveTarget] = useState<CustomerReceivable | null>(null);
  const [showAdvancedAdd, setShowAdvancedAdd] = useState(false);
  const [showAdvancedReceive, setShowAdvancedReceive] = useState(false);

  const [addDueForm, setAddDueForm] = useState({
    customer: '', amount: '', dueDate: new Date().toISOString().slice(0, 10), notes: '',
  });
  const [receiveForm, setReceiveForm] = useState({
    amount: '', date: new Date().toISOString().slice(0, 10), method: 'Cash', reference: '',
  });

  const crmCustomers = useMemo(() => getCustomerList(appState), [appState]);
  const customerIdByLabel = useMemo(() => {
    const map: Record<string, string> = {};
    crmCustomers.forEach((customer) => {
      map[customerOptionLabel(String(customer.name), String(customer.company))] = customer.id;
    });
    return map;
  }, [crmCustomers]);

  const addDueFields = useMemo<PortField[]>(() => [
    {
      key: 'customer',
      label: 'Customer',
      type: 'select',
      required: true,
      placeholder: 'Select customer…',
      options: crmCustomers.map((customer) => customerOptionLabel(String(customer.name), String(customer.company))),
    },
    { key: 'amount', label: 'Amount Due', type: 'number', required: true },
    { key: 'dueDate', label: 'Due Date', type: 'date', required: true },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ], [crmCustomers]);

  const allCustomers = useMemo(() => listCustomerReceivables(appState), [appState]);
  const metrics = useMemo(() => getCustomerReceivableMetrics(appState), [appState]);
  const todayStats = useMemo(() => getTodayCollectionStats(appState), [appState]);

  const filteredRows = useMemo(
    () => filterCustomerReceivables(allCustomers, { search, status: statusFilter }),
    [allCustomers, search, statusFilter],
  );

  const selectedCustomer = useMemo(
    () => (selectedCustomerId ? getCustomerReceivableDetail(appState, selectedCustomerId) : null),
    [appState, selectedCustomerId],
  );

  useEffect(() => {
    if (initialized || allCustomers.length === 0) return;
    const firstWithDue = allCustomers.find((c) => c.totalDue > 0);
    if (firstWithDue) {
      setSelectedCustomerId(firstWithDue.customerId);
      setInitialized(true);
    }
  }, [allCustomers, initialized]);

  const openReceive = (customer: CustomerReceivable) => {
    setReceiveTarget(customer);
    setReceiveForm({
      amount: String(customer.totalDue),
      date: new Date().toISOString().slice(0, 10),
      method: 'Cash',
      reference: '',
    });
    setShowReceiveModal(true);
  };

  const handleAddDueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addDueForm.customer || !addDueForm.amount || !addDueForm.dueDate) return;
    const customerId = customerIdByLabel[addDueForm.customer] ?? addDueForm.customer;
    const result = createCustomerDue(appState, { ...addDueForm, customer: customerId });
    if (!result.ok) {
      toast.error('Operation failed', { module: 'Accounting', description: 'error' in result ? String(result.error) : 'Failed to save due' });
      return;
    }
    saveAppState();
    setShowAddDueModal(false);
    setAddDueForm({ customer: '', amount: '', dueDate: new Date().toISOString().slice(0, 10), notes: '' });
    if (result.id) setSelectedCustomerId(result.id);
  };

  const handleReceiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveTarget || !receiveForm.amount) return;
    const result = receiveCustomerPayment(
      appState,
      receiveTarget.customerId,
      Number(receiveForm.amount),
      receiveForm.date,
      receiveForm.method,
    );
    if (!result.ok) {
      toast.error('Operation failed', { module: 'Accounting', description: String(result.error ?? 'Failed to record payment') });
      return;
    }
    saveAppState();
    setShowReceiveModal(false);
    setReceiveTarget(null);
  };

  useRegisterModuleActions(
    <>
      <button
        type="button"
        onClick={() => setShowAddDueModal(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        Add Due
      </button>
      <button
        type="button"
        onClick={() => {
          const target = selectedCustomer ?? allCustomers.find((c) => c.totalDue > 0);
          if (target) openReceive(target);
          else toast.error('Action required', { module: 'Accounting', description: 'Select a customer with outstanding due first.' });
        }}
        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
      >
        Receive Payment
      </button>
    </>,
    [selectedCustomer, allCustomers, openReceive],
  );

  return (
    <>
        <CustomerDueMetrics metrics={metrics} />

        <CustomerDueCollectionBar
          stats={todayStats}
          onStartCollection={() => { setStatusFilter('my_tasks'); setPage(1); }}
        />

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-3 items-stretch">
          <div className="premium-card premium-shadow overflow-hidden min-w-0 min-h-[580px] flex flex-col">
            <CustomerDueFilterBar
              search={search}
              statusFilter={statusFilter}
              viewMode={viewMode}
              onSearchChange={(v) => { setSearch(v); setPage(1); }}
              onStatusChange={(v) => { setStatusFilter(v); setPage(1); }}
              onViewModeChange={setViewMode}
            />
            <div className="flex-1 flex flex-col min-h-0">
              <CustomerDueTable
                rows={filteredRows}
                page={page}
                pageSize={pageSize}
                selectedCustomerId={selectedCustomerId}
                onPageChange={setPage}
                onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                onRowClick={(customer) => { setSelectedCustomerId(customer.customerId); setDetailTab('overview'); }}
              />
            </div>
          </div>

          <CustomerDueDetailPanel
            customer={selectedCustomer}
            detailTab={detailTab}
            onDetailTabChange={setDetailTab}
            onReceive={openReceive}
            onClose={() => setSelectedCustomerId(null)}
          />
        </div>

      <AppFormModal
        open={showAddDueModal}
        onClose={() => setShowAddDueModal(false)}
        title="Add Due"
        subtitle="Record a new customer due balance."
        onSubmit={handleAddDueSubmit}
        submitLabel="Save Due"
        size="md"
      >
        <AppFormFields
          fields={addDueFields}
          values={addDueForm}
          onChange={(k, v) => setAddDueForm((f) => ({ ...f, [k]: v }))}
          showAdvanced={showAdvancedAdd}
          onToggleAdvanced={() => setShowAdvancedAdd((p) => !p)}
        />
      </AppFormModal>

      <AppFormModal
        open={showReceiveModal}
        onClose={() => { setShowReceiveModal(false); setReceiveTarget(null); }}
        title="Receive Payment"
        subtitle={receiveTarget ? `${receiveTarget.name} — ${receiveTarget.company}` : ''}
        onSubmit={handleReceiveSubmit}
        submitLabel="Save Payment"
        size="md"
      >
        <AppFormFields
          fields={RECEIVE_FORM_FIELDS}
          values={receiveForm}
          onChange={(k, v) => setReceiveForm((f) => ({ ...f, [k]: v }))}
          showAdvanced={showAdvancedReceive}
          onToggleAdvanced={() => setShowAdvancedReceive((p) => !p)}
        />
      </AppFormModal>
    </>
  );
}
