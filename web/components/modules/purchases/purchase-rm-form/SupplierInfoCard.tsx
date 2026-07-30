'use client';

import { Building2, Mail, MapPin, Phone, Star } from 'lucide-react';
import { formatPoMoney } from '@/lib/services/purchase-rm-service';

export function SupplierInfoCard({
  profile,
}: {
  profile: {
    name: string;
    rating: number;
    status: string;
    phone: string;
    email: string;
    address: string;
    outstanding: number;
    creditLimit: number;
    lastPurchaseLabel: string;
    lastPoId: string;
    paymentTerms: string;
    onTimeDelivery: number;
  } | null;
}) {
  if (!profile) {
    return (
      <p className="text-xs text-slate-500">
        Select a supplier to view profile and purchase history.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <Building2 className="w-6 h-6" />
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-slate-900 text-sm">{profile.name}</span>
            <span className="inline-flex items-center gap-0.5 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < profile.rating ? 'fill-current' : 'text-slate-200'}`} />
              ))}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold capitalize">{profile.status}</span>
          </div>
          <p className="flex items-center gap-1.5 text-slate-600"><Phone className="w-3.5 h-3.5" />{profile.phone}</p>
          <p className="flex items-center gap-1.5 text-slate-600"><Mail className="w-3.5 h-3.5" />{profile.email}</p>
          <p className="flex items-start gap-1.5 text-slate-600"><MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />{profile.address}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Outstanding', value: formatPoMoney(profile.outstanding), sub: `Credit: ${formatPoMoney(profile.creditLimit)}`, danger: true },
          { label: 'Last Purchase', value: profile.lastPurchaseLabel, sub: profile.lastPoId },
          { label: 'Payment Terms', value: profile.paymentTerms.split(' ')[0] + ' Days', sub: 'Credit' },
          { label: 'On Time Delivery', value: `${profile.onTimeDelivery}%`, sub: 'Good' },
        ].map((tile) => (
          <div key={tile.label} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
            <p className="text-[10px] font-bold uppercase text-slate-500">{tile.label}</p>
            <p className={`text-sm font-extrabold mt-1 ${tile.danger ? 'text-rose-600' : 'text-slate-900'}`}>{tile.value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{tile.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
