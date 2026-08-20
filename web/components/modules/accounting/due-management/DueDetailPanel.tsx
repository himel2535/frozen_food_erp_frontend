'use client';

import { X, MessageCircle } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import {
  formatDueDate,
  formatDueMoney,
  getDueStatusLabel,
  getPartyInitials,
  getPartyInvoices,
  getPartySummary,
  type DueEntry,
} from '@/lib/services/due-management-service';
import { DUE_AVATAR_CLS, DUE_BTN_RECEIVE, DUE_PANEL_CLS, DUE_STATUS_BADGE, DUE_TAB_ACTIVE, DUE_TAB_INACTIVE } from './due-styles';
import type { DueDetailTab } from './due-types';

function SummaryMini({ label, value, tone }: { label: string; value: string; tone?: 'red' | 'green' | 'default' }) {
  const valueCls = tone === 'red' ? 'text-rose-600' : tone === 'green' ? 'text-emerald-600' : 'text-slate-900';
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-extrabold ${valueCls}`}>{value}</p>
    </div>
  );
}

export function DueDetailPanel({
  entries,
  partyId,
  detailTab,
  onDetailTabChange,
  onClose,
  onReceive,
  onSendReminder,
}: {
  entries: DueEntry[];
  partyId: string;
  detailTab: DueDetailTab;
  onDetailTabChange: (tab: DueDetailTab) => void;
  onClose: () => void;
  onReceive: (entry: DueEntry) => void;
  onSendReminder: () => void;
}) {
  const summary = getPartySummary(entries, partyId);
  const invoices = getPartyInvoices(entries, partyId);
  if (!summary) return null;

  const detailTabs: { id: DueDetailTab; label: string }[] = [
    { id: 'invoices', label: 'Due Invoices' },
    { id: 'payments', label: 'Payments' },
    { id: 'reminders', label: 'Reminders' },
  ];

  return (
    <aside className={DUE_PANEL_CLS}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`${DUE_AVATAR_CLS} h-11 w-11 text-sm`}>{getPartyInitials(summary.partyName)}</span>
          <div className="min-w-0">
            <h3 className="font-extrabold text-slate-900 truncate">{summary.partyName}</h3>
            <p className="text-xs text-slate-500">{summary.partyLocation}</p>
          </div>
        </div>
        <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer" onClick={onClose} aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <SummaryMini label="Total Due" value={formatDueMoney(summary.totalDue)} tone="red" />
        <SummaryMini label="Overdue" value={formatDueMoney(summary.totalOverdue)} tone="red" />
        <SummaryMini label="Total Paid" value={formatDueMoney(summary.totalPaid)} tone="green" />
        <SummaryMini label="Total Business" value={formatDueMoney(summary.totalBusiness)} />
      </div>

      <div className="flex border-b border-slate-200">
        {detailTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`flex-1 pb-2 text-xs ${detailTab === tab.id ? DUE_TAB_ACTIVE : DUE_TAB_INACTIVE}`}
            onClick={() => onDetailTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {detailTab === 'invoices' && (
        <div className="space-y-2 max-h-[360px] overflow-y-auto">
          {invoices.map((inv) => (
            <div key={inv.id} className="rounded-lg border border-slate-200 p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{inv.invoiceId}</p>
                  <p className="text-[11px] text-slate-500">{formatDueDate(inv.invoiceDate)}</p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${DUE_STATUS_BADGE[inv.status] ?? DUE_STATUS_BADGE.upcoming}`}>
                  {getDueStatusLabel(inv)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div><span className="text-slate-500 block">Total</span><span className="font-bold">{formatDueMoney(inv.total)}</span></div>
                <div><span className="text-slate-500 block">Paid</span><span className="font-bold text-emerald-600">{formatDueMoney(inv.paid)}</span></div>
                <div><span className="text-slate-500 block">Due</span><span className="font-bold text-rose-600">{formatDueMoney(inv.due)}</span></div>
              </div>
              <button type="button" className={`${DUE_BTN_RECEIVE} w-full`} onClick={() => onReceive(inv)}>
                Receive
              </button>
            </div>
          ))}
        </div>
      )}

      {detailTab === 'payments' && (
        <p className="text-xs text-slate-500 py-6 text-center">No payment history yet.</p>
      )}

      {detailTab === 'reminders' && (
        <p className="text-xs text-slate-500 py-6 text-center">No reminders sent yet.</p>
      )}

      <Button
        type="button"
        variant="primary"
        size="sm"
        leftIcon={<MessageCircle className="w-4 h-4" />}
        className="!w-full"
        onClick={onSendReminder}
      >
        Send Reminder
      </Button>
    </aside>
  );
}
