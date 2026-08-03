'use client';

import Link from 'next/link';
import {
  Building2,
  Calendar,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Star,
} from 'lucide-react';
import { PO_SIDEBAR_CARD_CLS } from '@/components/modules/purchases/purchase-order-form/po-form-styles';
import { formatMoney } from '@/lib/services/purchases-service';
import { StatusBadge } from '@/components/shared/StatusBadge';

export type PoSupplierSidebarProfile = {
  id: string;
  name: string;
  rating: number;
  status: string;
  phone: string;
  email: string;
  address: string;
  outstanding: number;
  creditLimit: number;
  paymentTerms: string;
  onTimeDelivery: number;
  lastPurchaseLabel: string;
  lastPoId: string;
};

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 truncate">{label}</p>
      <p className="text-xs font-extrabold text-slate-800 mt-0.5 truncate" title={value}>{value}</p>
    </div>
  );
}

export function PoSupplierDetailsCard({
  supplierId,
  profile,
}: {
  supplierId: string;
  profile: PoSupplierSidebarProfile | null;
}) {
  return (
    <div className={`${PO_SIDEBAR_CARD_CLS} min-h-[320px] flex flex-col`}>
      <h3 className="text-sm font-extrabold text-slate-900">Supplier Details</h3>

      {!profile ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-2 py-6">
          <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
            <Building2 className="w-5 h-5" />
          </span>
          <p className="text-xs text-slate-500 font-medium">Select a supplier to view details.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-3 text-xs">
          <div className="flex items-start gap-2">
            <span className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-slate-900 leading-tight">{profile.name}</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <StatusBadge status={profile.status} />
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-50 text-[10px] font-bold text-amber-700">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {profile.rating.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 border-t border-slate-100 pt-2">
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
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">Commercial Snapshot</p>
            <div className="grid grid-cols-2 gap-1.5">
              <StatCell
                label="Credit Limit"
                value={profile.creditLimit > 0 ? formatMoney(profile.creditLimit) : '—'}
              />
              <StatCell label="Outstanding" value={formatMoney(profile.outstanding)} />
              <StatCell label="Payment Terms" value={profile.paymentTerms} />
              <StatCell label="On-Time Delivery" value={`${profile.onTimeDelivery}%`} />
            </div>
            {profile.lastPoId !== '—' ? (
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                Last PO: {profile.lastPoId} · {profile.lastPurchaseLabel}
              </p>
            ) : null}
          </div>
        </div>
      )}

      {supplierId ? (
        <Link
          href={`/purchases/suppliers/${supplierId}`}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer mt-auto pt-2"
        >
          View Full Profile <ExternalLink className="w-3 h-3" />
        </Link>
      ) : null}
    </div>
  );
}
