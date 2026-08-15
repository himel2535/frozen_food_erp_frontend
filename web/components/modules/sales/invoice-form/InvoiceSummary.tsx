'use client';

import { Calculator, Pencil } from 'lucide-react';
import { INV_SUMMARY_CLS } from '@/components/modules/sales/invoice-form/inv-form-styles';
import type { InvoiceTotals } from '@/components/modules/sales/invoice-form/inv-form-types';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

export function InvoiceSummary({
  totals,
  onEditDiscount,
  onEditTax,
}: {
  totals: InvoiceTotals;
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
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-700">Paid (Cash)</span>
          <span className="text-sm font-extrabold text-emerald-600">{formatMoney(totals.total, { decimals: 2 })}</span>
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
