'use client';

import { toast } from '@/lib/ui/feedback';

import { useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';
import { ChildPageShell } from '@/components/layout/ChildPageShell';
import { useChromeSuppressed } from '@/components/layout/ModuleActionsContext';
import { AppFormFields, AppFormModal } from '@/components/shared/AppForm';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { useAppStore } from '@/lib/state/app-store';
import { isModuleApiMode } from '@/lib/config/data-source';
import { useApiResourceStore } from '@/hooks/use-api-resource-store';
import { mapGenericApiRow, mapGenericPayloadToApi } from '@/lib/services/generic-api-mapper';
import { mapApiInvoiceRow, mapInvoiceRecordToApi, mapPaymentRecordToApi, resolveApiRowId } from '@/lib/services/entity-api-mappers';
import {
  buildReceivableAppState,
  getCustomerReceivableDetail,
  getCustomerReceivablePayments,
  getFollowUpTimeline,
  receiveCustomerPayment,
  scheduleCustomerFollowUp,
  type CustomerReceivable,
} from '@/lib/services/customer-receivables-service';
import type { FollowUpPageTab, FollowUpPageView } from '../customer-due-types';
import { RECEIVE_PAYMENT_FIELDS } from '../customer-due-options';
import { FollowUpAddForm, type FollowUpFormValues } from './FollowUpAddForm';
import { FollowUpCustomerCard } from './FollowUpCustomerCard';
import { FollowUpFormSidebar } from './FollowUpFormSidebar';
import { FollowUpPageHeader } from './FollowUpPageHeader';
import { FollowUpSidebar } from './FollowUpSidebar';
import { FollowUpTabBar } from './FollowUpTabBar';
import { FollowUpTabContent } from './FollowUpTabContent';

function combineDateTime(date: string, time: string) {
  const [hh, mm] = time.split(':');
  const d = new Date(`${date}T00:00:00`);
  d.setHours(Number(hh), Number(mm), 0, 0);
  return d.toISOString();
}

export function CustomerDueFollowUpPage({ customerId }: { customerId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const apiMode = isModuleApiMode('invoices');
  const invoiceStore = useApiResourceStore('invoices', mapApiInvoiceRow, { pageOnly: true, lookupLimit: 200 });
  const paymentStore = useApiResourceStore('payments', mapGenericApiRow, { pageOnly: true, lookupLimit: 100 });
  const cashboxStore = useApiResourceStore('cashbox', mapGenericApiRow, { pageOnly: true, lookupLimit: 100 });
  const [, bump] = useState(0);
  const [saving, setSaving] = useState(false);

  useChromeSuppressed(true);

  const [activeTab, setActiveTab] = useState<FollowUpPageTab>('timeline');
  const [pageView, setPageView] = useState<FollowUpPageView>('timeline');
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receiveForm, setReceiveForm] = useState({
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    method: 'Cash',
    reference: '',
  });

  const receivableState = useMemo(
    () => buildReceivableAppState(appState, {
      apiMode,
      invoiceRows: invoiceStore.rows,
      paymentRows: paymentStore.rows,
      invoicesReady: apiMode ? invoiceStore.initialized : true,
      paymentsReady: apiMode ? paymentStore.initialized : true,
    }),
    [appState, apiMode, invoiceStore.rows, invoiceStore.initialized, paymentStore.rows, paymentStore.initialized],
  );

  const customer = useMemo(
    () => getCustomerReceivableDetail(receivableState, customerId),
    [receivableState, customerId, bump],
  );

  const timeline = useMemo(
    () => getFollowUpTimeline(receivableState, customerId),
    [receivableState, customerId, bump],
  );

  const payments = useMemo(
    () => getCustomerReceivablePayments(receivableState, customerId),
    [receivableState, customerId, bump],
  );

  const tabCounts = useMemo(() => ({
    invoices: customer?.invoices.length ?? 0,
    payments: payments.length,
    notes: customer?.tabCounts?.notes ?? 0,
    documents: customer?.tabCounts?.documents ?? 0,
  }), [customer, payments.length]);

  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setPageView('add-form');
    }
  }, [searchParams]);

  if (!customer) {
    return (
      <>
        <ChildPageShell
          title="Customer not found"
          subtitle={`The customer ID "${customerId}" does not exist or was removed.`}
          onBack={() => router.push('/accounting/receivables')}
          backLabel="Back to Customer Due"
        >
          <div className="premium-card premium-shadow p-8 text-center" />
        </ChildPageShell>
        <Footer />
      </>
    );
  }

  const handleSaveFollowUp = (values: FollowUpFormValues) => {
    const contactAt = combineDateTime(values.contactDate, values.contactTime);
    const nextScheduledAt = values.scheduleNext
      ? combineDateTime(values.nextDate, values.nextTime)
      : undefined;
    const promiseAmount = Number(values.promiseAmount) || 0;

    const result = scheduleCustomerFollowUp(receivableState, customerId, {
      contactMethod: values.contactMethod,
      contactPerson: values.contactPerson,
      contactAt,
      assignedStaffName: values.assignedTo,
      outcome: values.outcome,
      notes: values.notes,
      scheduleNext: values.scheduleNext,
      nextScheduledAt,
      nextAssignedTo: values.nextAssignedTo,
      reminder: values.reminder,
      nextNote: values.nextNote,
      promiseAmount: promiseAmount > 0 ? promiseAmount : undefined,
      expectedPaymentDate: values.expectedPaymentDate || undefined,
      attachmentName: values.attachmentName || undefined,
      attachmentUrl: values.attachmentUrl || undefined,
    });

    if (!result.ok) {
      toast.error('Could not save follow-up', { module: 'Customer Due', description: result.error ?? 'Unknown error' });
      return;
    }
    if (!apiMode) saveAppState();
    bump((n) => n + 1);
    toast.success('Follow-up saved', { module: 'Customer Due', description: 'Activity has been recorded and timeline updated.' });
    setPageView('timeline');
    setActiveTab('timeline');
  };

  const openReceive = (target: CustomerReceivable) => {
    setReceiveForm({
      amount: String(target.totalDue || ''),
      date: new Date().toISOString().slice(0, 10),
      method: 'Cash',
      reference: '',
    });
    setShowReceiveModal(true);
  };

  const handleReceive = async () => {
    const amount = Math.min(Number(receiveForm.amount), customer.totalDue);
    if (!amount || amount <= 0) {
      toast.error('Invalid amount', { module: 'Customer Due', description: 'Enter a valid payment amount.' });
      return;
    }

    setSaving(true);
    try {
      const baseInvoices = (apiMode ? invoiceStore.rows : appState.invoices ?? []).map((r) => ({ ...r }));
      const beforePayments = new Set(Object.keys(receivableState.crmData?.paymentsById ?? {}));
      const pseudo = buildReceivableAppState(
        { ...appState, invoices: baseInvoices },
        {
          apiMode,
          invoiceRows: baseInvoices,
          paymentRows: paymentStore.rows,
          invoicesReady: true,
          paymentsReady: paymentStore.initialized,
        },
      );

      const result = receiveCustomerPayment(
        pseudo,
        customerId,
        amount,
        receiveForm.date,
        receiveForm.method,
      );
      if (!result.ok) {
        toast.error('Payment failed', { module: 'Customer Due', description: result.error ?? 'Could not record payment.' });
        return;
      }

      if (apiMode) {
        for (const inv of pseudo.invoices ?? []) {
          const prev = baseInvoices.find((r) => String(r.id) === String(inv.id));
          const prevDue = Number(prev?.due ?? prev?.dueAmount ?? 0);
          const nextDue = Number(inv.due ?? inv.dueAmount ?? 0);
          if (prev && prevDue !== nextDue) {
            const sync = await invoiceStore.update(
              resolveApiRowId(inv as Record<string, unknown>),
              mapInvoiceRecordToApi(inv as Record<string, unknown>, String(inv.legacyId ?? inv.id)),
            );
            if (!sync.ok) {
              toast.error('Payment failed', { module: 'Customer Due', description: 'error' in sync ? String(sync.error) : 'Invoice update failed' });
              return;
            }
          }
        }

        const newPaymentEntries = Object.entries(pseudo.crmData?.paymentsById ?? {})
          .filter(([id]) => !beforePayments.has(id));
        for (const [, payment] of newPaymentEntries) {
          await paymentStore.create(mapPaymentRecordToApi(payment as Record<string, unknown>));
        }

        if (receiveForm.method === 'Cash' && isModuleApiMode('cashbox')) {
          await cashboxStore.create(mapGenericPayloadToApi({
            type: 'cash_in',
            cashIn: amount,
            cashOut: 0,
            amount,
            datetime: new Date(`${receiveForm.date}T12:00:00`).toISOString(),
            category: 'Customer Collection',
            party: customer.company || customer.name,
            paymentMethod: 'Cash',
            reference: receiveForm.reference,
            description: `Collection from ${customer.company || customer.name}`,
            note: receiveForm.reference,
          }));
        }
      } else {
        Object.assign(appState, {
          invoices: pseudo.invoices,
          crmData: pseudo.crmData,
          paymentAllocationsById: pseudo.paymentAllocationsById,
        });
        saveAppState();
      }

      bump((n) => n + 1);
      setShowReceiveModal(false);
      toast.success('Payment recorded', {
        module: 'Customer Due',
        description: `${amount.toLocaleString()} recorded${receiveForm.method === 'Cash' ? ' — cashbox updated.' : '.'}`,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={MODULE_LIST_SHELL}>
      <FollowUpPageHeader
        isAddForm={pageView === 'add-form'}
        onAddFollowUp={() => setPageView('add-form')}
        onBack={() => {
          if (pageView === 'add-form') {
            setPageView('timeline');
            return;
          }
          router.push('/accounting/receivables');
        }}
        backLabel={pageView === 'add-form' ? 'Back to Follow-up' : 'Back to Customer Due'}
      />

      {pageView === 'add-form' ? (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start pb-4">
          <FollowUpAddForm
            customer={customer}
            onBack={() => setPageView('timeline')}
            onSave={handleSaveFollowUp}
          />
          <FollowUpFormSidebar
            customer={customer}
            timeline={timeline.slice(0, 3)}
            onReceivePayment={() => openReceive(customer)}
            onMarkReceived={() => openReceive(customer)}
            onViewAllActivity={() => {
              setPageView('timeline');
              setActiveTab('timeline');
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start pb-4">
          <div className="space-y-4 min-w-0">
            <FollowUpCustomerCard customer={customer} />
            <FollowUpTabBar activeTab={activeTab} counts={tabCounts} onTabChange={setActiveTab} />
            <FollowUpTabContent
              activeTab={activeTab}
              customer={customer}
              timeline={timeline}
              payments={payments}
            />
          </div>
          <FollowUpSidebar
            customer={customer}
            onReceivePayment={() => openReceive(customer)}
            onMarkReceived={() => openReceive(customer)}
          />
        </div>
      )}

      <AppFormModal
        open={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        title="Receive Payment"
        subtitle={`${customer.name} — ${customer.company}`}
        onSubmit={(e) => { e.preventDefault(); void handleReceive(); }}
        submitLabel={saving ? 'Saving…' : 'Save Payment'}
        size="md"
      >
        <AppFormFields
          fields={RECEIVE_PAYMENT_FIELDS}
          values={receiveForm}
          onChange={(k, v) => setReceiveForm((f) => ({ ...f, [k]: v }))}
        />
      </AppFormModal>

      <Footer />
    </div>
  );
}
