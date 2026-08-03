'use client';

import { ChevronRight, MapPin } from 'lucide-react';
import type { CustomerReceivable } from '@/lib/services/customer-receivables-service';
import { formatDueMoneyDetailed, getCompanyInitials } from '@/lib/utils/communication-utils';
import { COLLECTION_STATUS_BADGE, CUSTOMER_DUE_AGING_BADGE, DUE_AVATAR_CLS } from '../customer-due-styles';
import { FU_CARD_CLS } from './follow-up-styles';

export function FollowUpCustomerCard({ customer }: { customer: CustomerReceivable }) {
  const overdueDays = customer.status === 'overdue' && customer.agingDays > 0
    ? `${customer.agingDays} Days`
    : customer.agingLabel;

  const statusBadgeCls = customer.collectionStatus !== 'none'
    ? (COLLECTION_STATUS_BADGE[customer.collectionStatus] ?? COLLECTION_STATUS_BADGE.none)
    : (CUSTOMER_DUE_AGING_BADGE[customer.status] ?? COLLECTION_STATUS_BADGE.none);

  return (
    <div className={`${FU_CARD_CLS} p-4 md:p-5`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className={`${DUE_AVATAR_CLS} h-12 w-12 text-sm`}>{getCompanyInitials(customer.company)}</span>
          <div className="min-w-0">
            <h2 className="text-base font-extrabold text-slate-900 truncate">{customer.company}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{customer.phone}</p>
            {customer.location && (
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 shrink-0" />
                {customer.location}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Outstanding</p>
            <p className="text-lg font-extrabold text-rose-600">{formatDueMoneyDetailed(customer.totalDue)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Overdue</p>
            <p className="text-lg font-extrabold text-rose-600">{overdueDays}</p>
          </div>
          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusBadgeCls}`}>
            {customer.collectionStatusLabel}
          </span>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            Customer Overview
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
