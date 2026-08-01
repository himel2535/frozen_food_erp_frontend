'use client';

import { Calculator, Pencil } from 'lucide-react';
import { PO_SUMMARY_CLS } from '@/components/modules/purchases/purchase-order-form/po-form-styles';
import type { PoOrderTotals } from '@/components/modules/purchases/purchase-order-form/po-form-types';
import { formatMoney } from '@/lib/services/purchases-service';

export function PoOrderSummary({
  totals,
  onEditDiscount,
  onEditTax,
}: {
  totals: PoOrderTotals;
  onEditDiscount: () => void;
  onEditTax: () => void;
}) {
  return (
    <div className={PO_SUMMARY_CLS}>
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="w-4 h-4 text-blue-600" />
        <h3 className="text-sm font-extrabold text-slate-900">Order Summary</h3>
      </div>
      <div className="space-y-2">
        <Row label="Subtotal" value={formatMoney(totals.subtotal)} />
        <Row label="Discount" value={formatMoney(totals.discountAmount)} onEdit={onEditDiscount} />
        <Row label="Tax" value={formatMoney(totals.taxAmount)} onEdit={onEditTax} />
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
          <span className="text-sm font-extrabold text-blue-700">Total Amount</span>
          <span className="text-lg font-extrabold text-blue-700">{formatMoney(totals.total)}</span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, onEdit }: { label: string; value: string; onEdit?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1 text-slate-500 font-medium text-xs">
        {label}
        {onEdit ? (
          <button type="button" onClick={onEdit} className="p-0.5 rounded hover:bg-blue-50 text-blue-600 cursor-pointer">
            <Pencil className="w-3 h-3" />
          </button>
        ) : null}
      </span>
      <span className="font-bold text-slate-800 text-xs">{value}</span>
    </div>
  );
}
