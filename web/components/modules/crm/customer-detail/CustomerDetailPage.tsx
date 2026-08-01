'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';
import { CustomerDetailHeader } from '@/components/modules/crm/customer-detail/CustomerDetailHeader';
import { CustomerDetailMetrics } from '@/components/modules/crm/customer-detail/CustomerDetailMetrics';
import { CustomerDetailTabs } from '@/components/modules/crm/customer-detail/CustomerDetailTabs';
import type { CustomerDetailTabId } from '@/components/modules/crm/customer-detail/customer-detail-utils';
import { OverviewTab } from '@/components/modules/crm/customer-detail/tabs/OverviewTab';
import { ActivityTab } from '@/components/modules/crm/customer-detail/tabs/ActivityTab';
import { NotesFilesTab } from '@/components/modules/crm/customer-detail/tabs/NotesFilesTab';
import {
  DELIVERY_COLUMNS,
  EntityListTab,
  INVOICE_COLUMNS,
  ORDER_COLUMNS,
  PAYMENT_COLUMNS,
  QUOTE_COLUMNS,
  RETURN_COLUMNS,
  TransactionsTab,
} from '@/components/modules/crm/customer-detail/tabs/EntityTabs';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { useAppStore } from '@/lib/state/app-store';
import {
  getCustomerProfile,
  getCustomerDetailMetrics,
  getCustomerTransactions,
  getCustomerDeliveries,
  getCustomerReturns,
} from '@/lib/services/crm-service';

export function CustomerDetailPage() {
  const params = useParams();
  const customerId = String(params?.id ?? '');
  const appState = useAppStore((s) => s.appState);
  const [activeTab, setActiveTab] = useState<CustomerDetailTabId>('overview');

  const profile = useMemo(
    () => (customerId ? getCustomerProfile(appState, customerId) : null),
    [appState, customerId],
  );

  const metrics = useMemo(
    () => (customerId ? getCustomerDetailMetrics(appState, customerId) : null),
    [appState, customerId],
  );

  const transactions = useMemo(
    () => (customerId ? getCustomerTransactions(appState, customerId) : []),
    [appState, customerId],
  );

  const deliveries = useMemo(
    () => (customerId ? getCustomerDeliveries(appState, customerId) : []),
    [appState, customerId],
  );

  const returns = useMemo(
    () => (customerId ? getCustomerReturns(appState, customerId) : []),
    [appState, customerId],
  );

  if (!profile || !metrics) {
    return (
      <div className={MODULE_LIST_SHELL}>
        <div className="premium-card premium-shadow p-8 text-center space-y-4 max-w-lg mx-auto mt-12">
          <h2 className="text-lg font-extrabold text-slate-900">Customer not found</h2>
          <p className="text-xs text-slate-500">The customer ID &quot;{customerId}&quot; does not exist or was removed.</p>
          <Link
            href="/crm/customers"
            className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Customers
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const customer = profile.customer as Record<string, unknown>;
  const contacts = (profile.contacts ?? []) as Array<Record<string, unknown>>;
  const addresses = (profile.addresses ?? []) as Array<Record<string, unknown>>;
  const tags = (profile.tags ?? []) as Array<Record<string, unknown>>;
  const attachments = (profile.attachments ?? []) as Array<Record<string, unknown>>;
  const communications = (profile.communications ?? []) as Array<Record<string, unknown>>;
  const activities = (profile.activities ?? []) as Array<Record<string, unknown>>;
  const auditLogs = (profile.auditLogs ?? []) as Array<Record<string, unknown>>;
  const invoices = (profile.invoices ?? []) as Array<Record<string, unknown>>;
  const salesOrders = (profile.salesOrders ?? []) as Array<Record<string, unknown>>;
  const payments = (profile.payments ?? []) as Array<Record<string, unknown>>;
  const quotations = (profile.quotations ?? []) as Array<Record<string, unknown>>;

  return (
    <div className={MODULE_LIST_SHELL}>
      <div className="space-y-4 flex flex-col">
      <CustomerDetailHeader
        customerId={customerId}
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
        <EntityListTab rows={invoices} columns={INVOICE_COLUMNS} emptyMessage="No invoices for this customer." />
      )}

      {activeTab === 'orders' && (
        <EntityListTab rows={salesOrders} columns={ORDER_COLUMNS} emptyMessage="No orders for this customer." />
      )}

      {activeTab === 'payments' && (
        <EntityListTab rows={payments} columns={PAYMENT_COLUMNS} emptyMessage="No payments recorded." />
      )}

      {activeTab === 'quotes' && (
        <EntityListTab rows={quotations} columns={QUOTE_COLUMNS} emptyMessage="No quotations for this customer." />
      )}

      {activeTab === 'deliveries' && (
        <EntityListTab rows={deliveries} columns={DELIVERY_COLUMNS} emptyMessage="No delivery challans found." />
      )}

      {activeTab === 'returns' && (
        <EntityListTab rows={returns} columns={RETURN_COLUMNS} emptyMessage="No returns for this customer." />
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

      </div>
      <Footer />
    </div>
  );
}
