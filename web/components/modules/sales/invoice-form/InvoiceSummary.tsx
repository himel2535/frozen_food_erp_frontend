'use client';

import { Calculator, Pencil } from 'lucide-react';
import { INV_SUMMARY_CLS } from '@/components/modules/sales/invoice-form/inv-form-styles';
import type { InvoiceTotals } from '@/components/modules/sales/invoice-form/inv-form-types';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

export function InvoiceSummary({
  totals,
  paidAmount,
  onPaidAmountChange,
  onEditDiscount,
  onEditTax,
}: {
  totals: InvoiceTotals;
  paidAmount: number;
  onPaidAmountChange: (value: number) => void;
  onEditDiscount: () => void;
  onEditTax: () => void;
}) {
  const { formatMoney } = useLocaleFormat();
  return (
    <div className={INV_SUMMARY_CLS}>
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-4 h-4 text-blue-600" />
        <h3 className="text-sm font-extrabold text-slate-900">Summary</h3>
      </div>
      <div className="space-y-2.5">
        <Row label="Subtotal" value={formatMoney(totals.subtotal, { decimals: 2 })} />
        <Row
          label="Discount"
          value={formatMoney(totals.discountAmount, { decimals: 2 })}
          onEdit={onEditDiscount}
        />
        <Row label="Tax" value={formatMoney(totals.taxAmount, { decimals: 2 })} onEdit={onEditTax} />
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-sm font-extrabold text-blue-700">Total Amount</span>
          <span className="text-lg font-extrabold text-blue-700">{formatMoney(totals.total, { decimals: 2 })}</span>
        </div>
        <div className="pt-3 border-t border-slate-200 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 font-semibold text-xs">Paid Amount</span>
            <div className="relative w-32">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">৳</span>
              <input
                type="number"
                min={0}
                max={totals.total}
                value={paidAmount || ''}
                onChange={(e) => {
                  const val = Math.max(0, Number(e.target.value) || 0);
                  onPaidAmountChange(val);
                }}
                className="w-full pl-5 pr-2 py-1 text-right text-xs font-bold text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Balance Due</span>
            <span className={`text-sm font-extrabold ${totals.total - paidAmount > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
              {formatMoney(Math.max(0, totals.total - paidAmount), { decimals: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-slate-500 font-medium text-xs">
        {label}
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            title={`Edit ${label.toLowerCase()}`}
            className="p-0.5 rounded hover:bg-blue-50 text-blue-600 cursor-pointer"
          >
            <Pencil className="w-3 h-3" />
          </button>
        ) : null}
      </span>
      <span className="font-bold text-slate-800 text-xs">{value}</span>
    </div>
  );
}
