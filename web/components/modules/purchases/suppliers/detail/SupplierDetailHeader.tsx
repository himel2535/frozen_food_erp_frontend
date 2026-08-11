'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Mail, MapPin, Phone, User } from 'lucide-react';
import { toast } from '@/lib/ui/feedback';
import type { SupplierDetailProfile } from '@/lib/services/suppliers-service';
import { InventoryItemThumb } from '@/components/shared/InventoryItemThumb';
import { formatDetailDate, SD_BTN_GREEN, SD_BTN_OUTLINE, SD_BTN_PRIMARY, SD_CARD, supplierDetailInitials } from './supplier-detail-styles';
import { SUPPLIER_STATUS_BADGE, SUPPLIER_STATUS_DOT } from '../suppliers-styles';

export function SupplierDetailHeaderActions({
  profile,
  onDeactivate,
}: {
  profile: SupplierDetailProfile;
  onDeactivate: () => void;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { supplier } = profile;

  return (
    <>
      <button
        type="button"
        className={SD_BTN_PRIMARY}
        onClick={() => router.push(`/purchases/orders/new?supplierId=${supplier.id}`)}
      >
        + Create PO
      </button>
      <button
        type="button"
        className={SD_BTN_OUTLINE}
        onClick={() => toast.info('Feature coming soon', { module: 'Suppliers', description: 'Add Bill coming soon.' })}
      >
        + Add Bill
      </button>
      <button
        type="button"
        className={SD_BTN_GREEN}
        onClick={() => router.push(`/accounting/payables?supplierId=${supplier.id}`)}
      >
        Record Payment
      </button>
      <div className="relative">
        <button
          type="button"
          className={`${SD_BTN_OUTLINE} gap-1`}
          onClick={() => setMenuOpen((v) => !v)}
        >
          More
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        {menuOpen && (
          <>
            <button type="button" className="fixed inset-0 z-10 cursor-default" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              <button
                type="button"
                className="block w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                onClick={() => { setMenuOpen(false); router.push(`/purchases/suppliers?edit=${supplier.id}`); }}
              >
                Edit Supplier
              </button>
              {supplier.recordStatus === 'active' && (
                <button
                  type="button"
                  className="block w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                  onClick={() => { setMenuOpen(false); onDeactivate(); }}
                >
                  Deactivate
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export function SupplierDetailHeader({
  profile,
}: {
  profile: SupplierDetailProfile;
}) {
  const { supplier } = profile;
  const statusCls = SUPPLIER_STATUS_BADGE[supplier.recordStatus === 'inactive' ? 'inactive' : 'clear'] ?? SUPPLIER_STATUS_BADGE.clear;
  const dotCls = SUPPLIER_STATUS_DOT[supplier.recordStatus === 'inactive' ? 'inactive' : 'clear'] ?? SUPPLIER_STATUS_DOT.clear;

  return (
    <div className={`${SD_CARD} flex flex-col lg:flex-row lg:items-start gap-5`}>
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <InventoryItemThumb
          imageUrl={supplier.imageUrl}
          alt={supplier.name}
          className="h-16 w-16 md:h-20 md:w-20 rounded-2xl border border-slate-200 object-cover shrink-0 shadow-md"
          fallback={(
            <span className="inline-flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-2xl bg-violet-500 text-white text-xl font-extrabold shrink-0 shadow-md">
              {supplierDetailInitials(supplier.name)}
            </span>
          )}
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">{supplier.name}</h1>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusCls}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${dotCls}`} />
              {supplier.recordStatus === 'inactive' ? 'Inactive' : 'Active'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {supplier.code} • {profile.categoryLabel} • Since {formatDetailDate(supplier.createdAt)}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" />{supplier.contactName}</span>
            <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" />{supplier.phone}</span>
            {supplier.email && <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" />{supplier.email}</span>}
            <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" />{profile.location}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
