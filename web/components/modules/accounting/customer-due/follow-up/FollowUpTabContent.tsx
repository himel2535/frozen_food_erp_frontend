'use client';

import type { CustomerReceivable } from '@/lib/services/customer-receivables-service';
import { formatDueDate, formatDueMoney } from '@/lib/services/customer-receivables-service';
import { formatActionSchedule } from '@/lib/utils/communication-utils';
import type { FollowUpPageTab } from '../customer-due-types';
import { FollowUpTimeline } from './FollowUpTimeline';
import type { CollectionActivity } from '@/lib/state/customer-collection-seed';

function EmptyTab({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <p className="text-xs text-slate-500">{message}</p>
    </div>
  );
}

export function FollowUpTabContent({
  activeTab,
  customer,
  timeline,
  payments,
}: {
  activeTab: FollowUpPageTab;
  customer: CustomerReceivable;
  timeline: CollectionActivity[];
  payments: Array<Record<string, unknown>>;
}) {
  if (activeTab === 'timeline') {
    return <FollowUpTimeline activities={timeline} />;
  }

  if (activeTab === 'followups') {
    return customer.nextAction ? (
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
        <p className="text-sm font-extrabold text-slate-900">{customer.nextAction.label}</p>
        <p className="text-xs text-slate-500">{formatActionSchedule(customer.nextAction.scheduledAt)}</p>
        {customer.nextAction.reason && <p className="text-xs text-slate-600">{customer.nextAction.reason}</p>}
        {customer.assignedTo && (
          <p className="text-[10px] text-slate-400">Assigned to {customer.assignedTo.name}</p>
        )}
      </div>
    ) : (
      <EmptyTab message="No follow-ups scheduled." />
    );
  }

  if (activeTab === 'invoices') {
    return customer.invoices.length === 0 ? (
      <EmptyTab message="No invoices on record." />
    ) : (
      <div className="space-y-2">
        {customer.invoices.map((inv) => (
          <div key={inv.invoiceId} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-slate-900 text-sm">{inv.invoiceId}</p>
                <p className="text-[11px] text-slate-500">{formatDueDate(inv.dueDate)}</p>
              </div>
              <span className="text-xs font-bold text-rose-600">{formatDueMoney(inv.due)} due</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activeTab === 'payments') {
    return payments.length === 0 ? (
      <EmptyTab message="No payments recorded." />
    ) : (
      <div className="space-y-2">
        {payments.map((payment) => (
          <div key={String(payment.id)} className="rounded-xl border border-slate-200 bg-white p-4 flex justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-slate-900">{formatDueDate(String(payment.date ?? ''))}</p>
              <p className="text-[11px] text-slate-500">{String(payment.method ?? 'Cash')}</p>
            </div>
            <p className="text-sm font-extrabold text-emerald-600">{formatDueMoney(Number(payment.amount ?? 0))}</p>
          </div>
        ))}
      </div>
    );
  }

  if (activeTab === 'notes' || activeTab === 'documents') {
    const label = activeTab === 'notes' ? 'notes' : 'documents';
    const count = activeTab === 'notes' ? (customer.tabCounts?.notes ?? 0) : (customer.tabCounts?.documents ?? 0);
    return count > 0 ? (
      <EmptyTab message={`${count} ${label} on file — detail view coming soon.`} />
    ) : (
      <EmptyTab message={`No ${label} yet.`} />
    );
  }

  return null;
}
