'use client';

import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatMoney, getPurchaseOrderSupplierProfile } from '@/lib/services/purchases-service';
import type { AppState } from '@/lib/state/types';
import { buildPoActivityTimeline } from './purchase-orders-utils';
import { PO_CARD_CLS } from './purchase-orders-styles';

export function PurchaseOrdersDetailSidebar({
  po,
  appState,
}: {
  po: Record<string, unknown>;
  appState: AppState;
}) {
  const supplierId = String(po.supplierId ?? '');
  const supplier = supplierId ? getPurchaseOrderSupplierProfile(appState, supplierId) : null;
  const timeline = buildPoActivityTimeline(po);

  return (
    <div className={`${PO_CARD_CLS} p-4 flex flex-col h-full space-y-4 xl:sticky xl:top-4`}>
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-extrabold text-slate-900 break-all leading-tight min-w-0">{String(po.id)}</h3>
          <StatusBadge status={String(po.status)} />
        </div>
        <p className="text-[10px] text-slate-500 mt-1.5">
          Created {String(po.date ?? '—')} · {String(po.purchaserName ?? 'Procurement Team')}
        </p>
      </div>

      {supplier ? (
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 space-y-1 text-xs shrink-0">
          <p className="font-bold text-slate-800">{supplier.name}</p>
          <p className="text-slate-600">{supplier.phone}</p>
          <p className="text-slate-600">{supplier.email}</p>
          <p className="text-slate-500">{supplier.address}</p>
          <p className="text-rose-600 font-semibold">Outstanding: {formatMoney(supplier.outstanding)}</p>
          <p className="text-slate-500">Credit: {formatMoney(supplier.creditLimit)}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs text-slate-600 shrink-0">
          <p className="font-bold text-slate-800">{String(po.supplier ?? po.supplierName ?? '—')}</p>
          <p className="text-slate-500 mt-1">No supplier profile linked.</p>
        </div>
      )}

      <div className="space-y-2 flex-1 flex flex-col min-h-0">
        <p className="text-[10px] font-bold uppercase text-slate-500">Timeline</p>
        {timeline.map((entry, i) => (
          <div key={i} className="flex gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
            <div>
              <p className="font-semibold text-slate-800">{entry.label}</p>
              <p className="text-[10px] text-slate-500">
                {entry.at.slice(0, 10)}
                {entry.by ? ` · ${entry.by}` : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
