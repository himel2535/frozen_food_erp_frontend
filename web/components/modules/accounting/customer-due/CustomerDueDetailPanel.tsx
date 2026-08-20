'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/shared/Button';
import { Phone, MessageCircle, CalendarPlus, X, UserRound, MapPin, Bookmark, CheckCircle2 } from 'lucide-react';
import {
  formatDueDate,
  formatDueMoney,
  type CustomerReceivable,
  type CollectionActivityType,
} from '@/lib/services/customer-receivables-service';
import {
  formatActionSchedule,
  formatDueMoneyDetailed,
  openPhoneCall,
  openWhatsApp,
} from '@/lib/utils/communication-utils';
import {
  COLLECTION_STATUS_BADGE,
  CUSTOMER_DUE_AGING_BADGE,
  DUE_PANEL_CLS,
  DUE_TAB_ACTIVE,
  DUE_TAB_INACTIVE,
} from './customer-due-styles';
import type { CustomerDueDetailTab } from './customer-due-types';

const PANEL_SHELL = `${DUE_PANEL_CLS} min-h-[580px] h-full flex flex-col gap-3`;

function SummaryMini({ label, value, tone }: { label: string; value: string; tone?: 'red' | 'green' | 'default' }) {
  const valueCls = tone === 'red' ? 'text-rose-600' : tone === 'green' ? 'text-emerald-600' : 'text-slate-900';
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-extrabold ${valueCls}`}>{value}</p>
    </div>
  );
}

function formatActivityTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function ActivityIcon({ type }: { type: CollectionActivityType }) {
  if (type === 'promise') return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
  if (type === 'call') return <Phone className="w-4 h-4 text-blue-600 shrink-0" />;
  if (type === 'whatsapp') return <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />;
  return <span className="h-2.5 w-2.5 rounded-full bg-slate-400 shrink-0 mt-1" />;
}

function promiseStatusBadge(status?: 'waiting' | 'missed' | 'received') {
  if (status === 'missed') return 'bg-rose-100 text-rose-700 border-rose-200';
  if (status === 'received') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  return 'bg-amber-100 text-amber-700 border-amber-200';
}

function promiseStatusLabel(status?: 'waiting' | 'missed' | 'received') {
  if (status === 'missed') return 'Promise Missed';
  if (status === 'received') return 'Payment Received';
  return 'Waiting for Payment';
}

export function CustomerDueDetailPanel({
  customer,
  payments = [],
  detailTab,
  onDetailTabChange,
  onReceive,
  onClose,
}: {
  customer: CustomerReceivable | null;
  payments?: Array<{ id?: string; amount?: number; date?: string; method?: string; reference?: string }>;
  detailTab: CustomerDueDetailTab;
  onDetailTabChange: (tab: CustomerDueDetailTab) => void;
  onClose?: () => void;
  onReceive: (customer: CustomerReceivable) => void;
}) {
  const router = useRouter();

  if (!customer) {
    return (
      <aside className={PANEL_SHELL}>
        <div className="flex flex-col items-center justify-center text-center py-8 flex-1">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
            <UserRound className="w-7 h-7" />
          </span>
          <h3 className="font-extrabold text-slate-900">Select a customer</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
            Click a row in the table to view collection actions, promises, and payment history.
          </p>
        </div>
      </aside>
    );
  }

  const overdueAmount = customer.status === 'overdue' ? customer.totalDue : 0;
  const invoiceCount = customer.invoices.length;
  const detailTabs: { id: CustomerDueDetailTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'followups', label: 'Follow-ups' },
    { id: 'invoices', label: `Invoices (${invoiceCount})` },
    { id: 'payments', label: 'Payments' },
  ];

  const nextActionTitle = customer.nextAction?.type === 'call'
    ? 'Call Customer'
    : customer.nextAction?.type === 'whatsapp'
      ? 'WhatsApp Customer'
      : customer.nextAction?.label ?? 'Next Action';

  return (
    <aside className={PANEL_SHELL}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-extrabold text-slate-900 truncate text-base">{customer.company}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{customer.phone}</p>
          {customer.location && (
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 shrink-0" />
              {customer.location}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {(customer.isCriticalOverdue || customer.isMissed) && (
            <Bookmark className="w-4 h-4 text-rose-500 fill-rose-500" />
          )}
          {onClose && (
            <button
              type="button"
              title="Close panel"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-center">
        <p className="text-[10px] font-bold uppercase tracking-wide text-rose-500">Outstanding</p>
        <p className="text-2xl font-extrabold text-rose-600 mt-0.5">{formatDueMoneyDetailed(customer.totalDue)}</p>
        <span className={`inline-flex mt-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${CUSTOMER_DUE_AGING_BADGE[customer.status] ?? CUSTOMER_DUE_AGING_BADGE.active}`}>
          {customer.agingLabel}
        </span>
      </div>

      {customer.nextAction && (
        <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3 space-y-2">
          <div className="flex items-start gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 shrink-0">
              <Phone className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-slate-900">{nextActionTitle}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{formatActionSchedule(customer.nextAction.scheduledAt)}</p>
            </div>
          </div>
          {customer.nextAction.reason && (
            <p className="text-xs text-slate-600 leading-relaxed">{customer.nextAction.reason}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="!text-[11px] !px-3 !py-1.5"
              leftIcon={<Phone className="w-3.5 h-3.5" />}
              onClick={() => openPhoneCall(customer.phone)}
            >
              Call
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="!text-[11px] !px-3 !py-1.5"
              leftIcon={<MessageCircle className="w-3.5 h-3.5" />}
              onClick={() => openWhatsApp(customer.phone)}
            >
              WhatsApp
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="!text-[11px] !px-3 !py-1.5"
              leftIcon={<CalendarPlus className="w-3.5 h-3.5" />}
              onClick={() => router.push(`/accounting/receivables/${customer.customerId}/follow-up?add=1`)}
            >
              Follow-up
            </Button>
          </div>
        </div>
      )}

      {customer.paymentPromise && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Payment Promise</p>
              <p className="text-lg font-extrabold text-slate-900 mt-0.5">{formatDueMoneyDetailed(customer.paymentPromise.amount)}</p>
              <p className="text-[11px] text-slate-500">
                Due {customer.paymentPromise.dueDate === new Date().toISOString().slice(0, 10) ? 'today' : formatDueDate(customer.paymentPromise.dueDate)}
              </p>
            </div>
            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${promiseStatusBadge(customer.paymentPromise.status)}`}>
              {promiseStatusLabel(customer.paymentPromise.status)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="success"
              size="sm"
              className="!px-3 !py-1.5 !text-[11px]"
              onClick={() => onReceive(customer)}
            >
              Mark Received
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="!px-3 !py-1.5 !text-[11px]"
              onClick={() => router.push(`/accounting/receivables/${customer.customerId}/follow-up`)}
            >
              Follow Up
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <SummaryMini label="Total Due" value={formatDueMoney(customer.totalDue)} tone="red" />
        <SummaryMini label="Overdue" value={formatDueMoney(overdueAmount)} tone="red" />
        <SummaryMini
          label="Last Payment"
          value={customer.lastPaymentAmount > 0 ? formatDueMoney(customer.lastPaymentAmount) : '—'}
          tone="green"
        />
      </div>

      <div className="flex border-b border-slate-200 overflow-x-auto">
        {detailTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`flex-1 pb-2 text-[11px] whitespace-nowrap px-1 ${detailTab === tab.id ? DUE_TAB_ACTIVE : DUE_TAB_INACTIVE}`}
            onClick={() => onDetailTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {detailTab === 'overview' && (
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-2">Recent Activity</h4>
              {customer.recentActivity.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No recent activity.</p>
              ) : (
                <div className="space-y-0">
                  {customer.recentActivity.map((activity, index) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <ActivityIcon type={activity.type} />
                        {index < customer.recentActivity.length - 1 && (
                          <span className="w-px flex-1 bg-slate-200 min-h-[24px]" />
                        )}
                      </div>
                      <div className="pb-4 min-w-0">
                        <p className="text-xs font-medium text-slate-800 leading-snug">{activity.text}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{formatActivityTime(activity.at)}</p>
                        <p className="text-[10px] text-slate-400">{activity.by}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {detailTab === 'followups' && (
          <div className="space-y-2">
            {customer.nextAction ? (
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="font-bold text-sm text-slate-900">{customer.nextAction.label}</p>
                <p className="text-[11px] text-slate-500 mt-1">{formatActionSchedule(customer.nextAction.scheduledAt)}</p>
                {customer.nextAction.reason && (
                  <p className="text-xs text-slate-600 mt-2">{customer.nextAction.reason}</p>
                )}
                <div className="flex gap-2 mt-3">
                  <Button type="button" variant="outline" size="sm" className="!text-[10px] !px-2.5 !py-1.5" onClick={() => openPhoneCall(customer.phone)}>Call</Button>
                  <Button type="button" variant="outline" size="sm" className="!text-[10px] !px-2.5 !py-1.5" onClick={() => openWhatsApp(customer.phone)}>WhatsApp</Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">No follow-ups scheduled.</p>
            )}
          </div>
        )}

        {detailTab === 'invoices' && (
          <div className="space-y-2">
            {customer.invoices.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No invoices on record.</p>
            ) : (
              customer.invoices.map((inv) => (
                <div key={inv.invoiceId} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{inv.invoiceId}</p>
                      <p className="text-[11px] text-slate-500">{formatDueDate(inv.dueDate)}</p>
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${COLLECTION_STATUS_BADGE[inv.status === 'overdue' ? 'promise_missed' : 'none']}`}>
                      {inv.due <= 0 ? 'Paid' : inv.status === 'overdue' ? 'Overdue' : 'Open'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] mt-2">
                    <div><span className="text-slate-500 block">Amount</span><span className="font-bold">{formatDueMoney(inv.amount)}</span></div>
                    <div><span className="text-slate-500 block">Paid</span><span className="font-bold text-emerald-600">{formatDueMoney(inv.paid)}</span></div>
                    <div><span className="text-slate-500 block">Due</span><span className="font-bold text-rose-600">{formatDueMoney(inv.due)}</span></div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {detailTab === 'payments' && (
          <div className="space-y-2">
            {payments.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No payment history yet.</p>
            ) : (
              payments.map((payment) => (
                <div key={String(payment.id)} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-emerald-700 text-sm">{formatDueMoney(Number(payment.amount ?? 0))}</p>
                      <p className="text-[11px] text-slate-500">{formatDueDate(String(payment.date ?? ''))}</p>
                    </div>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      {String(payment.method ?? 'Cash')}
                    </span>
                  </div>
                  {payment.reference ? (
                    <p className="text-[11px] text-slate-500 mt-1">Ref: {String(payment.reference)}</p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 mt-auto">
        <Button
          type="button"
          disabled={customer.totalDue <= 0}
          variant="primary"
          size="md"
          className="!w-full"
          onClick={() => onReceive(customer)}
        >
          Receive Payment
        </Button>
      </div>
    </aside>
  );
}
