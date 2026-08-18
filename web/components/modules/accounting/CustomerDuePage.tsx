'use client';



import { toast } from '@/lib/ui/feedback';



import { useCallback, useEffect, useMemo, useState } from 'react';

import { Plus } from 'lucide-react';

import { useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';

import { AppFormFields, AppFormModal } from '@/components/shared/AppForm';

import { PageSkeleton } from '@/components/shared/PageSkeleton';

import { useAppStore } from '@/lib/state/app-store';

import { isModuleApiMode, API_RESOURCE_PATHS } from '@/lib/config/data-source';
import { createResource, updateResource } from '@/lib/services/api-resource-service';

import { useApiResourceStore } from '@/hooks/use-api-resource-store';

import { mapGenericApiRow, mapGenericPayloadToApi } from '@/lib/services/generic-api-mapper';

import { mapApiInvoiceRow, mapInvoiceRecordToApi, mapPaymentRecordToApi, resolveApiRowId } from '@/lib/services/entity-api-mappers';

import { mapApiCustomerToListRow, type ApiCustomerDoc } from '@/lib/services/customers-api-service';

import { ApiModeBanner } from '@/components/shared/ApiModeBanner';

import type { PortField } from '@/lib/modules/port-types';

import { getCustomerList } from '@/lib/services/crm-service';

import {
  buildReceivableAppState,
  createCustomerDue,
  filterCustomerReceivables,
  getCustomerReceivableDetail,
  getCustomerReceivableMetrics,
  getCustomerReceivablePayments,
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



const DEFAULT_PAGE_SIZE = 8;

const RECEIVE_FORM_FIELDS: PortField[] = RECEIVE_PAYMENT_FIELDS.map((f) => ({ ...f }));

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return false;
  const parsed = new Date(`${value.trim()}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
}

function customerOptionLabel(name: string, company: string) {
  return `${name} — ${company}`;
}

function mapCustomerRow(doc: Record<string, unknown>) {
  return mapApiCustomerToListRow(doc as ApiCustomerDoc);
}

export function CustomerDuePage() {

  const appState = useAppStore((s) => s.appState);

  const apiDataReady = useAppStore((s) => s.apiDataReady);

  const saveAppState = useAppStore((s) => s.saveAppState);

  const apiMode = isModuleApiMode('invoices');

  const customerStore = useApiResourceStore('customers', mapCustomerRow, { cacheOnly: true });
  const invoiceLookupStore = useApiResourceStore('invoices', mapApiInvoiceRow, { cacheOnly: true });
  const paymentStore = useApiResourceStore('payments', mapGenericApiRow, { cacheOnly: true, skipInitialFetch: true });
  const cashboxStore = useApiResourceStore('cashbox', mapGenericApiRow, { cacheOnly: true, skipInitialFetch: true });
  const invoicePath = API_RESOURCE_PATHS.invoices;



  const [search, setSearch] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');

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

  const [saving, setSaving] = useState(false);



  const [addDueForm, setAddDueForm] = useState({

    customer: '', amount: '', dueDate: new Date().toISOString().slice(0, 10), notes: '',

  });

  const [receiveForm, setReceiveForm] = useState({

    amount: '', date: new Date().toISOString().slice(0, 10), method: 'Cash', reference: '',

  });



  const receivableState = useMemo(
    () => buildReceivableAppState(appState, {
      apiMode,
      invoiceRows: apiMode ? invoiceLookupStore.rows : appState.invoices ?? [],
      paymentRows: paymentStore.rows,
      customerRows: customerStore.rows,
      invoicesReady: apiMode ? invoiceLookupStore.initialized : true,
      paymentsReady: paymentStore.initialized,
      customersReady: apiMode ? customerStore.initialized : true,
    }),
    [
      appState,
      apiMode,
      invoiceLookupStore.rows,
      invoiceLookupStore.initialized,
      paymentStore.rows,
      paymentStore.initialized,
      customerStore.rows,
      customerStore.initialized,
    ],
  );



  const crmCustomers = useMemo(() => getCustomerList(receivableState), [receivableState]);

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



  const allCustomers = useMemo(() => listCustomerReceivables(receivableState), [receivableState]);

  const metrics = useMemo(() => getCustomerReceivableMetrics(receivableState), [receivableState]);

  const todayStats = useMemo(() => getTodayCollectionStats(receivableState), [receivableState]);

  const effectiveSearch = search;

  const filteredRows = useMemo(
    () => filterCustomerReceivables(allCustomers, { search: effectiveSearch, status: statusFilter }),
    [allCustomers, effectiveSearch, statusFilter],
  );

  const listPage = page;
  const listPageSize = pageSize;
  const listTotal = filteredRows.length;

  const onPageChange = (p: number) => {
    setPage(p);
  };

  const tablePage = listPage;
  const tablePageSize = listPageSize;



  const selectedCustomer = useMemo(

    () => (selectedCustomerId ? getCustomerReceivableDetail(receivableState, selectedCustomerId) : null),

    [receivableState, selectedCustomerId],

  );



  const selectedPayments = useMemo(

    () => (selectedCustomerId ? getCustomerReceivablePayments(receivableState, selectedCustomerId) : []),

    [receivableState, selectedCustomerId],

  );



  useEffect(() => {

    if (initialized || allCustomers.length === 0) return;

    const firstWithDue = allCustomers.find((c) => c.totalDue > 0);

    if (firstWithDue) {

      setSelectedCustomerId(firstWithDue.customerId);

      setInitialized(true);

    }

  }, [allCustomers, initialized]);



  const resetListFilters = useCallback(() => {
    setSearch('');
    setStatusFilter('all');
    setPage(1);
  }, []);



  const openReceive = useCallback((customer: CustomerReceivable) => {
    if (apiMode) {
      if (!paymentStore.initialized) void paymentStore.reload({ silent: true });
      if (isModuleApiMode('cashbox') && !cashboxStore.initialized) {
        void cashboxStore.reload({ silent: true });
      }
    }

    setReceiveTarget(customer);

    setReceiveForm({

      amount: String(customer.totalDue),

      date: new Date().toISOString().slice(0, 10),

      method: 'Cash',

      reference: '',

    });

    setShowReceiveModal(true);
  }, [apiMode, paymentStore, cashboxStore]);



  const handleAddDueSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!addDueForm.customer || !addDueForm.amount || !addDueForm.dueDate) return;

    if (!isValidIsoDate(addDueForm.dueDate)) {
      toast.error('Invalid date', { module: 'Customer Due', description: 'Choose a valid due date.' });
      return;
    }

    const customerId = customerIdByLabel[addDueForm.customer] ?? addDueForm.customer;

    setSaving(true);

    try {

      const pseudo = buildReceivableAppState(appState, {
        apiMode,
        invoiceRows: (apiMode ? invoiceLookupStore.rows : appState.invoices ?? []).map((r) => ({ ...r })),
        paymentRows: paymentStore.rows,
        customerRows: customerStore.rows,
        invoicesReady: true,
        paymentsReady: paymentStore.initialized,
        customersReady: true,
      });

      const beforeIds = new Set((pseudo.invoices ?? []).map((inv) => String(inv.id)));

      const result = createCustomerDue(pseudo, { ...addDueForm, customer: customerId });

      if (!result.ok) {

        toast.error('Operation failed', { module: 'Customer Due', description: 'error' in result ? String(result.error) : 'Failed to save due' });

        return;

      }



      if (apiMode) {

        const created = (pseudo.invoices ?? []).filter((inv) => !beforeIds.has(String(inv.id)));

        for (const inv of created) {

          const customer = crmCustomers.find((c) => c.id === customerId);

          const body = mapInvoiceRecordToApi({
            ...inv,
            customerName: customer?.company ?? customer?.name,
          } as Record<string, unknown>);

          const sync = await createResource(invoicePath, body);

          if (!sync.ok) {

            toast.error('Operation failed', { module: 'Customer Due', description: 'error' in sync ? String(sync.error) : 'Invoice sync failed' });

            return;

          }
        }
        void invoiceLookupStore.reload({ silent: true });

      } else {

        Object.assign(appState, { invoices: pseudo.invoices });

        saveAppState();

      }



      toast.success('Saved', { module: 'Customer Due', description: 'Customer due recorded.' });

      setShowAddDueModal(false);

      setAddDueForm({ customer: '', amount: '', dueDate: new Date().toISOString().slice(0, 10), notes: '' });

      resetListFilters();

      if (result.id) setSelectedCustomerId(result.id);

    } finally {

      setSaving(false);

    }

  };



  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveTarget || !receiveForm.amount) return;
    if (!isValidIsoDate(receiveForm.date)) {
      toast.error('Invalid date', { module: 'Customer Due', description: 'Choose a valid payment date.' });
      return;
    }
    const payAmount = Math.min(Number(receiveForm.amount), receiveTarget.totalDue);
    if (payAmount <= 0) {
      toast.error('Invalid amount', { module: 'Customer Due', description: 'Enter a valid payment amount.' });
      return;
    }

    setSaving(true);
    try {
      const baseInvoices = (apiMode ? invoiceLookupStore.rows : appState.invoices ?? []).map((r) => ({ ...r }));

      const beforePayments = new Set(Object.keys(receivableState.crmData?.paymentsById ?? {}));

      const pseudo = buildReceivableAppState(
        { ...appState, invoices: baseInvoices },
        {
          apiMode,
          invoiceRows: baseInvoices,
          paymentRows: paymentStore.rows,
          customerRows: customerStore.rows,
          invoicesReady: true,
          paymentsReady: paymentStore.initialized,
          customersReady: true,
        },
      );



      const result = receiveCustomerPayment(

        pseudo,

        receiveTarget.customerId,

        payAmount,

        receiveForm.date,

        receiveForm.method,

      );

      if (!result.ok) {

        toast.error('Operation failed', { module: 'Customer Due', description: String(result.error ?? 'Failed to record payment') });

        return;

      }



      if (apiMode) {
        for (const inv of pseudo.invoices ?? []) {
          const prev = baseInvoices.find((r) => String(r.id) === String(inv.id));
          const prevDue = Number(prev?.due ?? prev?.dueAmount ?? 0);
          const nextDue = Number(inv.due ?? inv.dueAmount ?? 0);
          if (prev && prevDue !== nextDue) {
            const sync = await updateResource(
              invoicePath,
              resolveApiRowId(inv as Record<string, unknown>),
              mapInvoiceRecordToApi(inv as Record<string, unknown>, String(inv.legacyId ?? inv.id)),
            );
            if (!sync.ok) {
              toast.error('Operation failed', { module: 'Customer Due', description: 'error' in sync ? String(sync.error) : 'Invoice update failed' });
              return;
            }
          }
        }

        const newPaymentEntries = Object.entries(pseudo.crmData?.paymentsById ?? {})
          .filter(([id]) => !beforePayments.has(id));
        for (const [, payment] of newPaymentEntries) {
          const sync = await paymentStore.create(mapPaymentRecordToApi(payment as Record<string, unknown>));
          if (!sync.ok) {
            toast.error('Operation failed', { module: 'Customer Due', description: 'error' in sync ? String(sync.error) : 'Payment sync failed' });
            return;
          }
        }

        if (receiveForm.method === 'Cash' && isModuleApiMode('cashbox')) {
          const cashSync = await cashboxStore.create(mapGenericPayloadToApi({
            type: 'cash_in',
            cashIn: payAmount,
            cashOut: 0,
            amount: payAmount,
            datetime: new Date(`${receiveForm.date}T12:00:00`).toISOString(),
            category: 'Customer Collection',
            party: receiveTarget.company || receiveTarget.name,
            paymentMethod: 'Cash',
            reference: receiveForm.reference,
            description: `Collection from ${receiveTarget.company || receiveTarget.name}`,
            note: receiveForm.reference,
          }));
          if (!cashSync.ok) {
            toast.error('Operation failed', { module: 'Customer Due', description: 'error' in cashSync ? String(cashSync.error) : 'Cashbox sync failed' });
            return;
          }
        }
        void invoiceLookupStore.reload({ silent: true });
      } else {

        Object.assign(appState, {

          invoices: pseudo.invoices,

          crmData: pseudo.crmData,

          paymentAllocationsById: pseudo.paymentAllocationsById,

        });

        saveAppState();

      }



      toast.success('Payment received', {

        module: 'Customer Due',

        description: `${payAmount.toLocaleString()} recorded${receiveForm.method === 'Cash' ? ' — cashbox updated.' : '.'}`,

      });

      setShowReceiveModal(false);

      setReceiveTarget(null);

      resetListFilters();

    } finally {

      setSaving(false);

    }

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

          else toast.error('Action required', { module: 'Customer Due', description: 'Select a customer with outstanding due first.' });

        }}

        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"

      >

        Receive Payment

      </button>

    </>,

    [selectedCustomer, allCustomers, openReceive],

  );



  const coreDataReady = !apiMode || (customerStore.initialized && invoiceLookupStore.initialized);

  if (apiMode && !coreDataReady && !apiDataReady) {

    return <PageSkeleton variant="module-list" label="Loading receivables" />;

  }



  return (

    <>

      {(invoiceLookupStore.error || customerStore.error || paymentStore.error) ? (

        <ApiModeBanner module="invoices" error={invoiceLookupStore.error ?? customerStore.error ?? paymentStore.error ?? ''} />

      ) : null}

      <CustomerDueMetrics metrics={metrics} />



      <CustomerDueCollectionBar

        stats={todayStats}

        onStartCollection={() => { setStatusFilter('overdue'); onPageChange(1); }}

      />



      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-3 items-stretch">

        <div className="premium-card premium-shadow overflow-hidden min-w-0 min-h-[580px] flex flex-col">

          <CustomerDueFilterBar

            search={effectiveSearch}

            statusFilter={statusFilter}

            viewMode={viewMode}

            onSearchChange={(v) => {
              setSearch(v);
              onPageChange(1);
            }}
            onStatusChange={(v) => { setStatusFilter(v); onPageChange(1); }}

            onViewModeChange={setViewMode}

          />

          <div className="flex-1 flex flex-col min-h-0">

            <CustomerDueTable

              rows={filteredRows}

              page={tablePage}

              pageSize={tablePageSize}

              selectedCustomerId={selectedCustomerId}

              onPageChange={onPageChange}

              onPageSizeChange={(size) => { setPageSize(size); onPageChange(1); }}

              onRowClick={(customer) => { setSelectedCustomerId(customer.customerId); setDetailTab('overview'); }}

            />

          </div>

        </div>



        <CustomerDueDetailPanel

          customer={selectedCustomer}

          payments={selectedPayments}

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

        submitLabel={saving ? 'Saving…' : 'Save Due'}

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

        submitLabel={saving ? 'Saving…' : 'Save Payment'}

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


