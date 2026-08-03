'use client';

import { Phone, MessageCircle } from 'lucide-react';
import type { CustomerReceivable } from '@/lib/services/customer-receivables-service';
import { formatActionSchedule, openPhoneCall, openWhatsApp } from '@/lib/utils/communication-utils';
import { FU_BTN_GREEN, FU_BTN_OUTLINE, FU_CARD_CLS, FU_WIDGET_TITLE_CLS } from './follow-up-styles';

function isActionOverdue(scheduledAt: string) {
  const d = new Date(scheduledAt);
  return !Number.isNaN(d.getTime()) && d.getTime() < Date.now();
}

function overdueLabel(scheduledAt: string) {
  const d = new Date(scheduledAt);
  if (Number.isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  if (diffMs <= 0) return '';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `Overdue by ${mins}m`;
  const hours = Math.floor(mins / 60);
  return `Overdue by ${hours}h`;
}

export function FollowUpNextActionWidget({ customer }: { customer: CustomerReceivable }) {
  if (!customer.nextAction) return null;

  const title = customer.nextAction.type === 'call'
    ? 'Call Customer'
    : customer.nextAction.type === 'whatsapp'
      ? 'WhatsApp Customer'
      : customer.nextAction.label;

  const overdue = isActionOverdue(customer.nextAction.scheduledAt);
  const overdueText = overdue ? overdueLabel(customer.nextAction.scheduledAt) : '';

  return (
    <div className={`${FU_CARD_CLS} p-4 space-y-3`}>
      <p className={FU_WIDGET_TITLE_CLS}>Next Action</p>
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 shrink-0">
          <Phone className="w-4 h-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-slate-900">{title}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{formatActionSchedule(customer.nextAction.scheduledAt)}</p>
          {overdueText && (
            <span className="inline-flex mt-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 text-[10px] font-bold">
              {overdueText}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={FU_BTN_GREEN} onClick={() => openPhoneCall(customer.phone)}>
          <Phone className="w-3.5 h-3.5" />
          Call Now
        </button>
        <button type="button" className={FU_BTN_GREEN} onClick={() => openWhatsApp(customer.phone)}>
          <MessageCircle className="w-3.5 h-3.5" />
          WhatsApp
        </button>
        <button type="button" className={FU_BTN_OUTLINE}>Edit</button>
      </div>
    </div>
  );
}
