'use client';

import { toast } from '@/lib/ui/feedback';

import { Phone, MessageCircle, FileText, MoreHorizontal, CalendarPlus, UserRound } from 'lucide-react';
import {
  formatDueDate,
  formatDueMoney,
  getCustomerStatusLabel,
  getPartyInitials,
  type CustomerReceivable,
} from '@/lib/services/customer-receivables-service';
import {
  CUSTOMER_DUE_STATUS_BADGE,
  DUE_AVATAR_CLS,
  DUE_BTN_RECEIVE,
  DUE_PANEL_CLS,
  DUE_TAB_ACTIVE,
  DUE_TAB_INACTIVE,
} from './customer-due-styles';
import type { CustomerDueDetailTab } from './customer-due-types';

const PANEL_SHELL = `${DUE_PANEL_CLS} min-h-[580px] h-full flex flex-col`;

function SummaryMini({ label, value, tone }: { label: string; value: string; tone?: 'red' | 'green' | 'default' }) {
  const valueCls = tone === 'red' ? 'text-rose-600' : tone === 'green' ? 'text-emerald-600' : 'text-slate-900';
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-extrabold ${valueCls}`}>{value}</p>
    </div>
  );
}

const DETAIL_TABS: { id: CustomerDueDetailTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'followups', label: 'Follow-ups' },
];

function PanelFooter({
  disabled,
  onReceive,
}: {
  disabled?: boolean;
  onReceive?: () => void;
}) {
  return (
    <div className="space-y-2 pt-2 border-t border-slate-100 mt-auto">
      <button
        type="button"
        disabled={disabled}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-bold py-2.5 cursor-pointer"
        onClick={disabled ? undefined : onReceive}
      >
        Receive Payment
      </button>
      <div className="flex items-center justify-center gap-2">
        {[
          { icon: Phone, label: 'Call' },
          { icon: MessageCircle, label: 'WhatsApp' },
          { icon: FileText, label: 'Statement' },
          { icon: MoreHorizontal, label: 'More' },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            type="button"
            title={label}
            disabled={disabled}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            onClick={disabled ? undefined : () => toast.info('Feature coming soon', { module: 'Customer Due', description: "${label} integration coming soon." })}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function CustomerDueDetailPanel({
  customer,
  detailTab,
  onDetailTabChange,
  onReceive,
}: {
  customer: CustomerReceivable | null;
  detailTab: CustomerDueDetailTab;
  onDetailTabChange: (tab: CustomerDueDetailTab) => void;
  onClose?: () => void;
  onReceive: (customer: CustomerReceivable) => void;
}) {
  if (!customer) {
    return (
      <aside className={PANEL_SHELL}>
        <div className="flex flex-col items-center justify-center text-center py-8 flex-1">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
            <UserRound className="w-7 h-7" />
          </span>
          <h3 className="font-extrabold text-slate-900">Select a customer</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
            Click a row in the table to view outstanding balance, invoices, and payment actions.
          </p>
        </div>

        <div className="flex border-b border-slate-200 overflow-x-auto opacity-50 pointer-events-none">
          {DETAIL_TABS.map((tab) => (
            <button key={tab.id} type="button" className={`flex-1 pb-2 text-[11px] whitespace-nowrap px-1 ${DUE_TAB_INACTIVE}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center flex-1">
          <p className="text-xs text-slate-400">Customer details will appear here</p>
        </div>

        <PanelFooter disabled />
      </aside>
    );
  }

  const overdueAmount = customer.status === 'overdue' ? customer.totalDue : 0;
  const outstandingInvoices = customer.invoices.filter((inv) => inv.due > 0);

  return (
    <aside className={PANEL_SHELL}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`${DUE_AVATAR_CLS} h-11 w-11 text-sm`}>{getPartyInitials(customer.name)}</span>
          <div className="min-w-0">
            <h3 className="font-extrabold text-slate-900 truncate">{customer.name}</h3>
            <p className="text-xs text-slate-500 truncate">{customer.company}</p>
            <p className="text-[11px] text-slate-400">{customer.phone}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-center">
        <p className="text-[10px] font-bold uppercase tracking-wide text-rose-500">Outstanding</p>
        <p className="text-2xl font-extrabold text-rose-600 mt-0.5">{formatDueMoney(customer.totalDue)}</p>
        <span className={`inline-flex mt-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${CUSTOMER_DUE_STATUS_BADGE[customer.status] ?? CUSTOMER_DUE_STATUS_BADGE.active}`}>
          {getCustomerStatusLabel(customer.status)}
        </span>
      </div>

      <div className="flex border-b border-slate-200 overflow-x-auto">
        {DETAIL_TABS.map((tab) => (
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
            <div className="grid grid-cols-2 gap-2">
              <SummaryMini label="Total Due" value={formatDueMoney(customer.totalDue)} tone="red" />
              <SummaryMini label="Overdue" value={formatDueMoney(overdueAmount)} tone="red" />
              <SummaryMini label="Last Payment" value={customer.lastPaymentAmount > 0 ? formatDueMoney(customer.lastPaymentAmount) : '—'} tone="green" />
              <SummaryMini label="Credit Limit" value={formatDueMoney(customer.creditLimit)} />
              <SummaryMini label="Available Credit" value={formatDueMoney(customer.availableCredit)} tone="green" />
              <SummaryMini label="Customer Since" value={formatDueDate(customer.customerSince)} />
            </div>

            {outstandingInvoices.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2">Outstanding Invoices</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {outstandingInvoices.map((inv) => (
                    <div key={inv.invoiceId} className="rounded-lg border border-slate-200 p-2.5 flex items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-sm text-slate-900">{inv.invoiceId}</p>
                        <p className="text-[11px] text-slate-500">{formatDueDate(inv.dueDate)} · {formatDueMoney(inv.due)} due</p>
                      </div>
                      <button type="button" className={DUE_BTN_RECEIVE} onClick={() => onReceive(customer)}>
                        Receive
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Next Follow-up</p>
                  <p className="text-xs font-semibold text-slate-700 mt-1">
                    {customer.nextFollowUp
                      ? new Date(customer.nextFollowUp).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : 'Not scheduled'}
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  onClick={() => toast.info('Feature coming soon', { module: 'Customer Due', description: "Add follow-up coming soon." })}
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {detailTab === 'invoices' && (
          <div className="space-y-2">
            {customer.invoices.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No invoices on record.</p>
            ) : (
              customer.invoices.map((inv) => (
                <div key={inv.invoiceId} className="rounded-lg border border-slate-200 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{inv.invoiceId}</p>
                      <p className="text-[11px] text-slate-500">{formatDueDate(inv.dueDate)}</p>
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${CUSTOMER_DUE_STATUS_BADGE[inv.status] ?? CUSTOMER_DUE_STATUS_BADGE.active}`}>
                      {inv.status === 'overdue' ? 'Overdue' : inv.due <= 0 ? 'Paid' : 'Due Soon'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div><span className="text-slate-500 block">Amount</span><span className="font-bold">{formatDueMoney(inv.amount)}</span></div>
                    <div><span className="text-slate-500 block">Paid</span><span className="font-bold text-emerald-600">{formatDueMoney(inv.paid)}</span></div>
                    <div><span className="text-slate-500 block">Due</span><span className="font-bold text-rose-600">{formatDueMoney(inv.due)}</span></div>
                  </div>
                  {inv.due > 0 && (
                    <button type="button" className={`${DUE_BTN_RECEIVE} w-full`} onClick={() => onReceive(customer)}>
                      Receive
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {detailTab === 'transactions' && (
          <p className="text-xs text-slate-500 py-6 text-center">No transaction history yet.</p>
        )}

        {detailTab === 'followups' && (
          <p className="text-xs text-slate-500 py-6 text-center">No follow-up history yet.</p>
        )}
      </div>

      <PanelFooter onReceive={() => onReceive(customer)} />
    </aside>
  );
}
