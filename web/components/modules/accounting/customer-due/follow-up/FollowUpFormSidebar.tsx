'use client';

import Link from 'next/link';
import { toast } from '@/lib/ui/feedback';
import {
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  Phone,
  Send,
  Wallet,
} from 'lucide-react';
import type { CollectionActivity } from '@/lib/state/customer-collection-seed';
import type { CustomerReceivable } from '@/lib/services/customer-receivables-service';
import { formatDueDate, formatDueMoney } from '@/lib/services/customer-receivables-service';
import {
  formatDueMoneyDetailed,
  getCompanyInitials,
  openPhoneCall,
  openWhatsApp,
} from '@/lib/utils/communication-utils';
import { FollowUpPromiseWidget } from './FollowUpPromiseWidget';
import { CUSTOMER_DUE_AGING_BADGE, DUE_AVATAR_CLS } from '../customer-due-styles';
import { FU_BTN_OUTLINE, FU_CARD_CLS, FU_WIDGET_TITLE_CLS, ICON_CIRCLE_BY_TYPE } from './follow-up-styles';

function formatActivityShort(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function ActivityMiniIcon({ type }: { type: CollectionActivity['type'] }) {
  const cls = ICON_CIRCLE_BY_TYPE[type] ?? ICON_CIRCLE_BY_TYPE.note;
  if (type === 'call') return <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${cls}`}><Phone className="w-3.5 h-3.5" /></span>;
  if (type === 'whatsapp') return <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${cls}`}><MessageCircle className="w-3.5 h-3.5" /></span>;
  if (type === 'promise') return <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${cls}`}><CheckCircle2 className="w-3.5 h-3.5" /></span>;
  return <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${cls}`}><span className="h-2 w-2 rounded-full bg-current" /></span>;
}

export function FollowUpFormSidebar({
  customer,
  timeline,
  onReceivePayment,
  onMarkReceived,
  onViewAllActivity,
}: {
  customer: CustomerReceivable;
  timeline: CollectionActivity[];
  onReceivePayment: () => void;
  onMarkReceived: () => void;
  onViewAllActivity: () => void;
}) {
  const overdueAmount = customer.status === 'overdue' ? customer.totalDue : 0;
  const overdueDays = customer.status === 'overdue' && customer.agingDays > 0
    ? `${customer.agingDays} Days Overdue`
    : customer.agingLabel;
  const lastPayment = customer.lastPaymentAmount > 0
    ? `${formatDueMoney(customer.lastPaymentAmount)}${customer.lastPaymentDate ? ` on ${formatDueDate(customer.lastPaymentDate)}` : ''}`
    : '—';

  const statusBadgeCls = customer.collectionStatus !== 'none'
    ? 'bg-rose-100 text-rose-700 border-rose-200'
    : (CUSTOMER_DUE_AGING_BADGE[customer.status] ?? 'bg-slate-100 text-slate-600 border-slate-200');

  return (
    <aside className="space-y-4">
      <div className={`${FU_CARD_CLS} p-4 space-y-3`}>
        <div className="flex items-start gap-3">
          <span className={`${DUE_AVATAR_CLS} h-11 w-11 text-sm shrink-0`}>{getCompanyInitials(customer.company)}</span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-slate-900">{customer.company}</p>
            <p className="text-xs text-slate-500">{customer.phone}</p>
            {customer.location && <p className="text-[11px] text-slate-400 mt-0.5">{customer.location}</p>}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Outstanding</p>
          <p className="text-2xl font-extrabold text-rose-600">{formatDueMoneyDetailed(customer.totalDue)}</p>
          <span className={`inline-flex mt-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusBadgeCls}`}>
            {overdueDays}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-slate-50 p-2">
            <p className="text-[9px] font-bold uppercase text-slate-500">Total Due</p>
            <p className="text-xs font-extrabold text-rose-600 mt-0.5">{formatDueMoney(customer.totalDue)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-2">
            <p className="text-[9px] font-bold uppercase text-slate-500">Overdue</p>
            <p className="text-xs font-extrabold text-rose-600 mt-0.5">{formatDueMoney(overdueAmount)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-2">
            <p className="text-[9px] font-bold uppercase text-slate-500">Last Payment</p>
            <p className="text-[10px] font-bold text-emerald-600 mt-0.5 leading-tight">{lastPayment}</p>
          </div>
        </div>
      </div>

      <FollowUpPromiseWidget customer={customer} onMarkReceived={onMarkReceived} />

      <div className={`${FU_CARD_CLS} p-4 space-y-3`}>
        <p className={FU_WIDGET_TITLE_CLS}>Quick Actions</p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={`${FU_BTN_OUTLINE} justify-center py-2.5`} onClick={() => openPhoneCall(customer.phone)}>
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
            Call Customer
          </button>
          <button type="button" className={`${FU_BTN_OUTLINE} justify-center py-2.5`} onClick={() => openWhatsApp(customer.phone)}>
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            Send WhatsApp
          </button>
          <button
            type="button"
            className={`${FU_BTN_OUTLINE} justify-center py-2.5`}
            onClick={() => toast.info('Feature coming soon', { module: 'Customer Due', description: 'Send Reminder coming soon.' })}
          >
            <Send className="w-3.5 h-3.5 text-purple-600" />
            Send Reminder
          </button>
          <button type="button" className={`${FU_BTN_OUTLINE} justify-center py-2.5`} onClick={onReceivePayment}>
            <Wallet className="w-3.5 h-3.5 text-purple-600" />
            Receive Payment
          </button>
        </div>
        <Link
          href={`/crm/customers/${customer.customerId}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
        >
          View Customer Profile
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className={`${FU_CARD_CLS} p-4 space-y-3`}>
        <div className="flex items-center justify-between gap-2">
          <p className={FU_WIDGET_TITLE_CLS}>Recent Activity</p>
          <button type="button" className="text-[10px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer" onClick={onViewAllActivity}>
            View All
          </button>
        </div>
        {timeline.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">No recent activity.</p>
        ) : (
          <div className="space-y-3">
            {timeline.map((activity) => (
              <div key={activity.id} className="flex gap-2.5">
                <ActivityMiniIcon type={activity.type} />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-slate-400">{formatActivityShort(activity.at)}</p>
                  <p className="text-xs font-semibold text-slate-800 leading-snug mt-0.5">
                    {activity.title ?? activity.text}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">By {activity.by}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
