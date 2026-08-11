'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';
import { ChildPageShell } from '@/components/layout/ChildPageShell';
import { useChromeSuppressed } from '@/components/layout/ModuleActionsContext';
import {
  CustomerDetailHeader,
  CustomerDetailHeaderActions,
} from '@/components/modules/crm/customer-detail/CustomerDetailHeader';
import { CustomerDetailMetrics } from '@/components/modules/crm/customer-detail/CustomerDetailMetrics';
import { CustomerDetailTabs } from '@/components/modules/crm/customer-detail/CustomerDetailTabs';
import type { CustomerDetailTabId } from '@/components/modules/crm/customer-detail/customer-detail-utils';
import { OverviewTab } from '@/components/modules/crm/customer-detail/tabs/OverviewTab';
import { ActivityTab } from '@/components/modules/crm/customer-detail/tabs/ActivityTab';
import { NotesFilesTab } from '@/components/modules/crm/customer-detail/tabs/NotesFilesTab';
import {
  EntityListTab,
  getDeliveryColumns,
  getInvoiceColumns,
  getOrderColumns,
  getPaymentColumns,
  getQuoteColumns,
  getReturnColumns,
  TransactionsTab,
} from '@/components/modules/crm/customer-detail/tabs/EntityTabs';
import { useAppStore } from '@/lib/state/app-store';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import {
  getCustomerProfile,
  getCustomerDetailMetrics,
  getCustomerTransactions,
  getCustomerDeliveries,
  getCustomerReturns,
} from '@/lib/services/crm-service';
import { isCustomersApiMode } from '@/lib/config/data-source';
import { fetchCustomerFromApi, mapApiCustomerToListRow } from '@/lib/services/customers-api-service';
import { useApiAppState } from '@/hooks/use-api-app-state';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';

export function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = String(params?.id ?? '');
  const appState = useAppStore((s) => s.appState);
  const { formatMoney } = useLocaleFormat();
  const [activeTab, setActiveTab] = useState<CustomerDetailTabId>('overview');
  const apiMode = isCustomersApiMode();
  const apiRelated = useApiAppState(
    apiMode ? ['invoices', 'salesOrders', 'payments', 'quotations', 'deliveries', 'returns'] : undefined,
  );
  const dataState = apiMode && apiRelated.state ? apiRelated.state : appState;
  const [apiDoc, setApiDoc] = useState<Awaited<ReturnType<typeof fetchCustomerFromApi>>>(null);
  const [apiLoading, setApiLoading] = useState(apiMode);

  useEffect(() => {
    if (!apiMode || !customerId) return;
    setApiLoading(true);
    void fetchCustomerFromApi(customerId).then((doc) => {
      setApiDoc(doc);
      setApiLoading(false);
    });
  }, [apiMode, customerId]);

  useChromeSuppressed(true);

  const invoiceColumns = useMemo(() => getInvoiceColumns(formatMoney), [formatMoney]);
  const orderColumns = useMemo(() => getOrderColumns(formatMoney), [formatMoney]);
  const paymentColumns = useMemo(() => getPaymentColumns(formatMoney), [formatMoney]);
  const quoteColumns = useMemo(() => getQuoteColumns(formatMoney), [formatMoney]);
  const deliveryColumns = useMemo(() => getDeliveryColumns(), []);
  const returnColumns = useMemo(() => getReturnColumns(formatMoney), [formatMoney]);

  const profile = useMemo(() => {
    if (apiMode) {
      if (!apiDoc) return null;
      const customer = mapApiCustomerToListRow(apiDoc);
      return {
        customer,
        contacts: [{ id: 'primary', name: customer.name, phone: customer.phone, email: customer.email, primary: true }],
        addresses: [
          { id: 'billing', type: 'billing', line1: apiDoc.billingAddress, city: apiDoc.billingCity, primary: true },
          { id: 'shipping', type: 'shipping', line1: apiDoc.shippingAddress, city: apiDoc.shippingCity, primary: true },
        ],
        tags: [],
        attachments: [],
        communications: [],
        activities: [],
        auditLogs: [],
        invoices: [],
        salesOrders: [],
        payments: [],
        quotations: [],
      };
    }
    return customerId ? getCustomerProfile(dataState, customerId) : null;
  }, [apiMode, apiDoc, dataState, customerId]);

  const metrics = useMemo(() => {
    if (apiMode) {
      if (!apiDoc) return null;
      const totalSales = Number(apiDoc.totalSales ?? 0);
      const totalDue = Number(apiDoc.totalDue ?? 0);
      const creditLimit = Number(apiDoc.creditLimit ?? 0);
      return {
        totalSales,
        totalPaid: Math.max(totalSales - totalDue, 0),
        totalDue,
        totalOrders: 0,
        avgOrderValue: 0,
        creditLimit,
        creditRemaining: Math.max(creditLimit - totalDue, 0),
        creditUsedPercent: creditLimit > 0 ? Math.min((totalDue / creditLimit) * 100, 100) : 0,
        overdueAmount: 0,
        lastPaymentDate: null,
        lastPurchaseDate: null,
        customerSince: apiDoc.createdAt ?? null,
        lastActivityDate: apiDoc.updatedAt ?? apiDoc.createdAt ?? null,
        invoiceCount: 0,
        paymentCount: 0,
      };
    }
    return customerId ? getCustomerDetailMetrics(dataState, customerId) : null;
  }, [apiMode, apiDoc, dataState, customerId]);

  const transactions = useMemo(
    () => (customerId ? getCustomerTransactions(dataState, customerId) : []),
    [dataState, customerId],
  );

  const deliveries = useMemo(
    () => (customerId ? getCustomerDeliveries(dataState, customerId) : []),
    [dataState, customerId],
  );

  const returns = useMemo(
    () => (customerId ? getCustomerReturns(dataState, customerId) : []),
    [dataState, customerId],
  );

  if (apiLoading) {
    return (
      <>
        {apiRelated.error ? <ApiModeBanner module="customers" error={apiRelated.error} /> : null}
        <ChildPageShell title="Loading customer…" subtitle="" onBack={() => router.push('/crm/customers')} backLabel="Back to Customers">
          <div className="premium-card premium-shadow p-8 text-center text-sm text-slate-500">Loading customer…</div>
        </ChildPageShell>
        <Footer />
      </>
    );
  }

  if (!profile || !metrics) {
    return (
      <>
        <ChildPageShell
          title="Customer not found"
          subtitle={`The customer ID "${customerId}" does not exist or was removed.`}
          onBack={() => router.push('/crm/customers')}
          backLabel="Back to Customers"
        >
          <div className="premium-card premium-shadow p-8 text-center" />
        </ChildPageShell>
        <Footer />
      </>
    );
  }

  const customer = profile.customer as Record<string, unknown>;
  const contacts = (profile.contacts ?? []) as Array<Record<string, unknown>>;
  const addresses = (profile.addresses ?? []) as Array<Record<string, unknown>>;
  const tags = (profile.tags ?? []) as Array<Record<string, unknown>>;
  const attachments = (profile.attachments ?? []) as Array<Record<string, unknown>>;
  const communications = (profile.communications ?? []) as Array<Record<string, unknown>>;
  const activities = (profile.activities ?? []) as Array<Record<string, unknown>>;
  const auditLogs = (profile.auditLogs ?? []) as unknown as Array<Record<string, unknown>>;
  const invoices = (profile.invoices ?? []) as Array<Record<string, unknown>>;
  const salesOrders = (profile.salesOrders ?? []) as Array<Record<string, unknown>>;
  const payments = (profile.payments ?? []) as Array<Record<string, unknown>>;
  const quotations = (profile.quotations ?? []) as Array<Record<string, unknown>>;

  const name = String(customer.name ?? 'Customer');
  const company = String(customer.company ?? '');

  return (
    <>
      <ChildPageShell
        title={name}
        subtitle={company || String(customer.companyType ?? 'Customer profile')}
        onBack={() => router.push('/crm/customers')}
        backLabel="Back to Customers"
        actions={<CustomerDetailHeaderActions customerId={customerId} />}
      >
        <CustomerDetailHeader
          customer={customer}
          contacts={contacts}
          addresses={addresses}
          metrics={{
            customerSince: metrics.customerSince,
            lastActivityDate: metrics.lastActivityDate,
          }}
        />

        <CustomerDetailMetrics metrics={metrics} />

        <CustomerDetailTabs active={activeTab} onChange={setActiveTab} />

        {activeTab === 'overview' && (
          <OverviewTab
            customerId={customerId}
            customer={customer}
            contacts={contacts}
            addresses={addresses}
            tags={tags}
            attachments={attachments}
            communications={communications}
            metrics={metrics}
            transactions={transactions}
            onViewAllNotes={() => setActiveTab('notes')}
          />
        )}

        {activeTab === 'transactions' && <TransactionsTab transactions={transactions} />}

        {activeTab === 'invoices' && (
          <EntityListTab rows={invoices} columns={invoiceColumns} emptyMessage="No invoices for this customer." />
        )}

        {activeTab === 'orders' && (
          <EntityListTab rows={salesOrders} columns={orderColumns} emptyMessage="No orders for this customer." />
        )}

        {activeTab === 'payments' && (
          <EntityListTab rows={payments} columns={paymentColumns} emptyMessage="No payments recorded." />
        )}

        {activeTab === 'quotes' && (
          <EntityListTab rows={quotations} columns={quoteColumns} emptyMessage="No quotations for this customer." />
        )}

        {activeTab === 'deliveries' && (
          <EntityListTab rows={deliveries} columns={deliveryColumns} emptyMessage="No delivery challans found." />
        )}

        {activeTab === 'returns' && (
          <EntityListTab rows={returns} columns={returnColumns} emptyMessage="No returns for this customer." />
        )}

        {activeTab === 'activity' && <ActivityTab activities={activities} auditLogs={auditLogs} />}

        {activeTab === 'notes' && (
          <NotesFilesTab
            customerId={customerId}
            customer={customer}
            communications={communications}
            attachments={attachments}
          />
        )}
      </ChildPageShell>
      <Footer />
    </>
  );
}
