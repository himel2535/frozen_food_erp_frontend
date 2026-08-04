'use client';

import Link from 'next/link';
import {
  Building2,
  Calendar,
  CreditCard,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  User,
} from 'lucide-react';
import type { SoCustomerSidebarProfile } from '@/components/modules/sales/sales-order-form/so-customer-profile';
import { SO_SIDEBAR_CARD_CLS } from '@/components/modules/sales/sales-order-form/so-form-styles';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { StatusBadge } from '@/components/shared/StatusBadge';

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 truncate">{label}</p>
      <p className="text-xs font-extrabold text-slate-800 mt-0.5 truncate" title={value}>{value}</p>
    </div>
  );
}

export function SoCustomerDetailsCard({
  customerId,
  profile,
}: {
  customerId: string;
  profile: SoCustomerSidebarProfile | null;
}) {
  const { formatMoney, formatCount } = useLocaleFormat();
  return (
    <div className={`${SO_SIDEBAR_CARD_CLS} min-h-[320px] flex flex-col`}>
      <h3 className="text-sm font-extrabold text-slate-900">Customer Details</h3>

      {!profile ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-2 py-6">
          <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
            <User className="w-5 h-5" />
          </span>
          <p className="text-xs text-slate-500 font-medium">Select a customer to view details.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-3 text-xs">
          <div className="flex items-start gap-2">
            <span className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-slate-900 leading-tight">{profile.name}</p>
              {profile.company ? (
                <p className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3 h-3 shrink-0" />{profile.company}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <StatusBadge status={profile.status} />
                {profile.customerType !== '—' ? (
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600 capitalize">
                    {profile.customerType}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-1.5 border-t border-slate-100 pt-2">
            {profile.contactPerson ? (
              <p className="flex items-center gap-1.5 text-slate-600">
                <User className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{profile.contactPerson}</span>
              </p>
            ) : null}
            {profile.phone ? (
              <p className="flex items-center gap-1.5 text-slate-600">
                <Phone className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{profile.phone}</span>
              </p>
            ) : null}
            {profile.email ? (
              <p className="flex items-center gap-1.5 text-slate-600">
                <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{profile.email}</span>
              </p>
            ) : null}
            {profile.address ? (
              <p className="flex items-start gap-1.5 text-slate-600">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
                <span className="leading-snug">{profile.address}</span>
              </p>
            ) : null}
          </div>

          <div className="border-t border-slate-100 pt-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">Financial Snapshot</p>
            <div className="grid grid-cols-2 gap-1.5">
              <StatCell
                label="Credit Limit"
                value={profile.creditLimit > 0 ? formatMoney(profile.creditLimit, { decimals: 2 }) : '—'}
              />
              <StatCell label="Outstanding" value={formatMoney(profile.outstanding, { decimals: 2 })} />
              <StatCell label="Open Orders" value={formatCount(profile.salesOrderCount)} />
              <StatCell label="Payment Terms" value={profile.paymentTerms} />
            </div>
            {profile.openReceivables > 0 ? (
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-700 font-semibold">
                <CreditCard className="w-3.5 h-3.5 shrink-0" />
                Open receivables: {formatMoney(profile.openReceivables, { decimals: 2 })}
              </p>
            ) : null}
            {profile.lastOrderDate ? (
              <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                Last order: {profile.lastOrderDate}
              </p>
            ) : null}
          </div>
        </div>
      )}

      {customerId ? (
        <Link
          href={`/crm/customers/${customerId}`}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer mt-auto pt-2"
        >
          View Full Profile <ExternalLink className="w-3 h-3" />
        </Link>
      ) : null}
    </div>
  );
}
