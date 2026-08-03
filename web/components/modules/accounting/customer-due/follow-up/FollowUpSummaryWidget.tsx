'use client';

import type { CustomerReceivable } from '@/lib/services/customer-receivables-service';
import { formatDueDate, formatDueMoney } from '@/lib/services/customer-receivables-service';
import { formatDueMoneyDetailed } from '@/lib/utils/communication-utils';
import { FU_CARD_CLS } from './follow-up-styles';

function StatCell({ label, value, tone }: { label: string; value: string; tone?: 'red' | 'green' | 'default' }) {
  const valueCls = tone === 'red' ? 'text-rose-600' : tone === 'green' ? 'text-emerald-600' : 'text-slate-900';
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-extrabold ${valueCls}`}>{value}</p>
    </div>
  );
}

export function FollowUpSummaryWidget({ customer }: { customer: CustomerReceivable }) {
  const overdueAmount = customer.status === 'overdue' ? customer.totalDue : 0;
  const lastPayment = customer.lastPaymentAmount > 0
    ? `${formatDueMoney(customer.lastPaymentAmount)}${customer.lastPaymentDate ? ` on ${formatDueDate(customer.lastPaymentDate)}` : ''}`
    : '—';

  return (
    <div className={`${FU_CARD_CLS} p-4 space-y-3`}>
      <h3 className="text-sm font-extrabold text-slate-900">Customer Summary</h3>
      <div className="grid grid-cols-2 gap-2">
        <StatCell label="Total Due" value={formatDueMoney(customer.totalDue)} tone="red" />
        <StatCell label="Overdue" value={formatDueMoney(overdueAmount)} tone="red" />
        <StatCell label="Last Payment" value={lastPayment} tone="green" />
        <StatCell label="Credit Limit" value={formatDueMoney(customer.creditLimit)} />
        <StatCell label="Available Credit" value={formatDueMoney(customer.availableCredit)} tone="green" />
        <StatCell label="Customer Since" value={customer.customerSince || '—'} />
      </div>
    </div>
  );
}

export function FollowUpSummaryAmount({ amount }: { amount: number }) {
  return <span className="text-2xl font-extrabold text-slate-900">{formatDueMoneyDetailed(amount)}</span>;
}
