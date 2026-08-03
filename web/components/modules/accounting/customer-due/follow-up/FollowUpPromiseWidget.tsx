'use client';

import type { CustomerReceivable } from '@/lib/services/customer-receivables-service';
import { formatDueDate, isValidIsoDate } from '@/lib/services/customer-receivables-service';
import { formatDueMoneyDetailed, openPhoneCall } from '@/lib/utils/communication-utils';
import { FU_BTN_BLUE_OUTLINE, FU_BTN_GREEN_OUTLINE, FU_CARD_CLS, FU_WIDGET_TITLE_CLS } from './follow-up-styles';

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

function formatPromiseDueLabel(dueDate?: string) {
  if (!isValidIsoDate(dueDate)) return 'Due date not set';
  const today = new Date().toISOString().slice(0, 10);
  if (dueDate === today) return 'Due Today • Before 5:00 PM';
  return `Due ${formatDueDate(dueDate!)}`;
}

export function FollowUpPromiseWidget({
  customer,
  onMarkReceived,
}: {
  customer: CustomerReceivable;
  onMarkReceived: () => void;
}) {
  if (!customer.paymentPromise) return null;

  const dueLabel = formatPromiseDueLabel(customer.paymentPromise.dueDate);

  return (
    <div className={`${FU_CARD_CLS} p-4 space-y-3`}>
      <div className="flex items-center justify-between gap-2">
        <p className={FU_WIDGET_TITLE_CLS}>Payment Promise</p>
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${promiseStatusBadge(customer.paymentPromise.status)}`}>
          {promiseStatusLabel(customer.paymentPromise.status)}
        </span>
      </div>
      <p className="text-2xl font-extrabold text-slate-900">{formatDueMoneyDetailed(customer.paymentPromise.amount)}</p>
      <p className="text-[11px] text-slate-500">{dueLabel}</p>
      <p className="text-[10px] text-slate-400">Promise logged by {customer.assignedTo?.name ?? 'Staff'}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={FU_BTN_GREEN_OUTLINE} onClick={onMarkReceived}>
          Mark Received
        </button>
        <button type="button" className={FU_BTN_BLUE_OUTLINE} onClick={() => openPhoneCall(customer.phone)}>
          Follow Up Now
        </button>
      </div>
    </div>
  );
}
