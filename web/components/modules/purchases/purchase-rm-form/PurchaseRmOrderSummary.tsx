'use client';

import { PRM_SUMMARY_CLS } from '@/components/modules/purchases/purchase-rm-form/prm-form-styles';
import type { PurchaseRmTotals } from '@/components/modules/purchases/purchase-rm-form/prm-form-types';
import { formatPoMoney } from '@/lib/services/purchase-rm-service';

export function PurchaseRmOrderSummary({ totals }: { totals: PurchaseRmTotals }) {
  return (
    <div className={PRM_SUMMARY_CLS}>
      <h3 className="text-sm font-extrabold text-slate-900 mb-3">Order Summary</h3>
      <div className="space-y-2">
        <Row label="Total Items" value={String(totals.totalItems)} />
        <Row label="Total Quantity" value={`${totals.totalQty.toLocaleString()} PCS`} />
        <Row label="Sub Total" value={formatPoMoney(totals.subTotal)} />
        <Row label="Discount" value={formatPoMoney(totals.discount)} />
        <Row label={`VAT (${totals.vatPct}%)`} value={formatPoMoney(totals.vat)} />
        <Row label={`AIT (${totals.aitPct}%)`} value={formatPoMoney(totals.ait)} />
        <Row label="Other Charges" value={formatPoMoney(totals.otherCharges)} />
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
          <span className="font-extrabold text-slate-800">Grand Total</span>
          <span className="text-lg font-extrabold text-blue-700">{formatPoMoney(totals.grandTotal)}</span>
        </div>
      </div>
      <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-[11px] font-semibold text-emerald-800">
        You will save {formatPoMoney(totals.discount)} with this purchase.
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className="font-bold text-slate-800">{value}</span>
    </div>
  );
}
