'use client';

import { ArrowLeft, Building2, Calendar, Mail, MapPin, MoreHorizontal, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  CD_ACCENT_BAR,
  CD_BODY,
  CD_CAPTION,
  CD_CARD,
  CD_PAGE_LINK,
} from '@/components/modules/crm/customer-detail/customer-detail-styles';
import {
  customerAvatarClass,
  customerInitials,
  formatDetailDate,
} from '@/components/modules/crm/customer-detail/customer-detail-utils';

type CustomerDetailHeaderProps = {
  customerId: string;
  customer: Record<string, unknown>;
  contacts: Array<Record<string, unknown>>;
  addresses: Array<Record<string, unknown>>;
  metrics: {
    customerSince: unknown;
    lastActivityDate: unknown;
  };
};

export function CustomerDetailHeader({
  customerId,
  customer,
  contacts,
  addresses,
  metrics,
}: CustomerDetailHeaderProps) {
  const router = useRouter();
  const primary = contacts.find((c) => c.primary) ?? contacts[0];
  const billing = addresses.find((a) => a.type === 'billing') ?? addresses[0];
  const name = String(customer.name ?? primary?.name ?? 'Customer');
  const company = String(customer.company ?? '');
  const repName = String(customer.salesRepName ?? customer.ownerName ?? 'Unassigned');

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push('/crm/customers')}
          className={`inline-flex items-center gap-2 ${CD_PAGE_LINK}`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customers
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push(`/crm/customers?edit=${customerId}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
          >
            Edit Customer
          </button>
          <button
            type="button"
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 cursor-pointer"
            aria-label="More actions"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className={`relative overflow-hidden ${CD_CARD}`}>
        <div className={CD_ACCENT_BAR} />
        <div className="flex flex-col lg:flex-row lg:items-start gap-5 pt-1">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div
              className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-lg md:text-xl font-extrabold shrink-0 ring-4 ring-white shadow-md ${customerAvatarClass(name)}`}
            >
              {customerInitials(name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">{name}</h1>
                <StatusBadge status={String(customer.status ?? 'active')} />
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {company ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 text-xs font-bold border border-violet-100">
                    <Building2 className="w-3.5 h-3.5" />
                    {company}
                  </span>
                ) : null}
                {customer.companyType ? (
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                    {String(customer.companyType)}
                  </span>
                ) : null}
              </div>
              <div className={`flex flex-wrap gap-4 mt-3 ${CD_CAPTION}`}>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Customer Since: {formatDetailDate(metrics.customerSince)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Last Activity: {formatDetailDate(metrics.lastActivityDate)}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 mt-3 bg-slate-50/80 rounded-xl px-4 py-2.5">
                {primary?.phone ? (
                  <span className={`inline-flex items-center gap-1.5 ${CD_BODY}`}>
                    <Phone className="w-4 h-4 text-slate-400" />
                    {String(primary.phone)}
                  </span>
                ) : null}
                {primary?.email ? (
                  <span className={`inline-flex items-center gap-1.5 ${CD_BODY}`}>
                    <Mail className="w-4 h-4 text-slate-400" />
                    {String(primary.email)}
                  </span>
                ) : null}
                {billing ? (
                  <span className={`inline-flex items-center gap-1.5 ${CD_BODY}`}>
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {[billing.city, billing.country].filter(Boolean).join(', ') || String(billing.line1 ?? '')}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="lg:w-60 shrink-0 premium-card p-4 border border-blue-100/80 bg-gradient-to-br from-blue-50/90 to-white">
            <p className={`${CD_CAPTION} uppercase tracking-wide`}>Assigned Representative</p>
            <div className="flex items-center gap-3 mt-2">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold ring-2 ring-white shadow-sm ${customerAvatarClass(repName)}`}>
                {customerInitials(repName)}
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900">{repName}</p>
                <p className={CD_CAPTION}>Sales Executive</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
