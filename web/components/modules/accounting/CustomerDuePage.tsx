'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { AppFormFields, AppFormModal } from '@/components/shared/AppForm';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { useAppStore } from '@/lib/state/app-store';
import type { PortField } from '@/lib/modules/port-types';
import { getCustomerList } from '@/lib/services/crm-service';
import {
  createCustomerDue,
  filterCustomerReceivables,
  getCustomerReceivableDetail,
  getCustomerReceivableMetrics,
  listCustomerReceivables,
  receiveCustomerPayment,
  type CustomerReceivable,
} from '@/lib/services/customer-receivables-service';
import { CustomerDueMetrics } from './customer-due/CustomerDueMetrics';
import { CustomerDueFilterBar } from './customer-due/CustomerDueFilterBar';
import { CustomerDueTable } from './customer-due/CustomerDueTable';
import { CustomerDueDetailPanel } from './customer-due/CustomerDueDetailPanel';
import { RECEIVE_PAYMENT_FIELDS } from './customer-due/customer-due-options';
import type { CustomerDueDetailTab } from './customer-due/customer-due-types';

const PAGE_SIZE = 8;

const RECEIVE_FORM_FIELDS: PortField[] = RECEIVE_PAYMENT_FIELDS.map((f) => ({ ...f }));

function customerOptionLabel(name: string, company: string) {
  return `${name} — ${company}`;
}

export function CustomerDuePage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all_due');
  const [page, setPage] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<CustomerDueDetailTab>('overview');

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

  const filteredRows = useMemo(
    () => filterCustomerReceivables(allCustomers, { search, status: statusFilter }),
    [allCustomers, search, statusFilter],
  );

  const selectedCustomer = useMemo(
    () => (selectedCustomerId ? getCustomerReceivableDetail(appState, selectedCustomerId) : null),
    [appState, selectedCustomerId],
  );

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
      window.alert('error' in result ? result.error : 'Failed to save due');
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
      window.alert(result.error ?? 'Failed to record payment');
      return;
    }
    saveAppState();
    setShowReceiveModal(false);
    setReceiveTarget(null);
  };

  return (
    <>
      <div className={MODULE_LIST_SHELL}>
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Customer Due (Cash)</h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">Track and collect outstanding payments from your customers.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start xl:self-auto">
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
                else window.alert('Select a customer with outstanding due first.');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
            >
              Receive Payment
            </button>
          </div>
        </div>

        <CustomerDueMetrics metrics={metrics} />

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-3 items-stretch">
          <div className="premium-card premium-shadow overflow-hidden min-w-0 min-h-[580px] flex flex-col">
            <CustomerDueFilterBar
              search={search}
              statusFilter={statusFilter}
              onSearchChange={(v) => { setSearch(v); setPage(1); }}
              onStatusChange={(v) => { setStatusFilter(v); setPage(1); }}
            />
            <div className="flex-1 flex flex-col min-h-0">
              <CustomerDueTable
                rows={filteredRows}
                page={page}
                pageSize={PAGE_SIZE}
                selectedCustomerId={selectedCustomerId}
                onPageChange={setPage}
                onRowClick={(customer) => { setSelectedCustomerId(customer.customerId); setDetailTab('overview'); }}
                onReceive={openReceive}
              />
            </div>
          </div>

          <CustomerDueDetailPanel
            customer={selectedCustomer}
            detailTab={detailTab}
            onDetailTabChange={setDetailTab}
            onReceive={openReceive}
          />
        </div>

        <Footer />
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
