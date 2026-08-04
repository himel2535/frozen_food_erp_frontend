'use client';

import { toast } from '@/lib/ui/feedback';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { AppFormFields, AppFormModal } from '@/components/shared/AppForm';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { useAppStore } from '@/lib/state/app-store';
import {
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
  const searchParams = useSearchParams();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [, bump] = useState(0);

  const [activeTab, setActiveTab] = useState<FollowUpPageTab>('timeline');
  const [pageView, setPageView] = useState<FollowUpPageView>('timeline');
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receiveForm, setReceiveForm] = useState({
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    method: 'Cash',
    reference: '',
  });

  const customer = useMemo(
    () => getCustomerReceivableDetail(appState, customerId),
    [appState, customerId, bump],
  );

  const timeline = useMemo(
    () => getFollowUpTimeline(appState, customerId),
    [appState, customerId, bump],
  );

  const payments = useMemo(
    () => getCustomerReceivablePayments(appState, customerId),
    [appState, customerId, bump],
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
      <div className={MODULE_LIST_SHELL}>
        <div className="premium-card premium-shadow p-8 text-center space-y-4 max-w-lg mx-auto mt-4">
          <h2 className="text-lg font-extrabold text-slate-900">Customer not found</h2>
          <p className="text-xs text-slate-500">The customer ID &quot;{customerId}&quot; does not exist or was removed.</p>
          <div className="flex flex-col items-center gap-2">
            <Link
              href="/accounting/receivables"
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Customer Due
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleSaveFollowUp = (values: FollowUpFormValues) => {
    const contactAt = combineDateTime(values.contactDate, values.contactTime);
    const nextScheduledAt = values.scheduleNext
      ? combineDateTime(values.nextDate, values.nextTime)
      : undefined;
    const promiseAmount = Number(values.promiseAmount) || 0;

    const result = scheduleCustomerFollowUp(appState, customerId, {
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
    });

    if (!result.ok) {
      toast.error('Could not save follow-up', { module: 'Customer Due', description: result.error ?? 'Unknown error' });
      return;
    }
    saveAppState();
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

  const handleReceive = () => {
    const amount = Number(receiveForm.amount);
    if (!amount || amount <= 0) {
      toast.error('Invalid amount', { module: 'Customer Due', description: 'Enter a valid payment amount.' });
      return;
    }
    const result = receiveCustomerPayment(appState, customerId, amount, receiveForm.date, receiveForm.method);
    if (!result.ok) {
      toast.error('Payment failed', { module: 'Customer Due', description: result.error ?? 'Could not record payment.' });
      return;
    }
    saveAppState();
    bump((n) => n + 1);
    setShowReceiveModal(false);
    toast.success('Payment recorded', { module: 'Customer Due', description: 'Payment has been applied to open invoices.' });
  };

  return (
    <div className={`${MODULE_LIST_SHELL} space-y-4`}>
      <FollowUpPageHeader
        isAddForm={pageView === 'add-form'}
        onAddFollowUp={() => setPageView('add-form')}
      />

      {pageView === 'add-form' ? (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start">
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
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start">
          <div className="space-y-4 min-w-0">
            <FollowUpCustomerCard customer={customer} />
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
              <FollowUpTabBar activeTab={activeTab} onTabChange={setActiveTab} counts={tabCounts} />
              <FollowUpTabContent
                activeTab={activeTab}
                customer={customer}
                timeline={timeline}
                payments={payments}
              />
            </div>
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
        title="Receive Payment"
        subtitle="Apply payment to open invoices."
        onClose={() => setShowReceiveModal(false)}
        onSubmit={handleReceive}
        submitLabel="Record Payment"
      >
        <AppFormFields
          fields={RECEIVE_PAYMENT_FIELDS}
          values={receiveForm}
          onChange={(key, value) => setReceiveForm((prev) => ({ ...prev, [key]: value }))}
        />
      </AppFormModal>

      <Footer />
    </div>
  );
}
