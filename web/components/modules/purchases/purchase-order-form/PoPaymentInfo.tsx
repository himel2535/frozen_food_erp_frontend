'use client';

import { PO_LABEL_CLS, PO_SIDEBAR_CARD_CLS } from '@/components/modules/purchases/purchase-order-form/po-form-styles';
import { PO_PAYMENT_STATUS_OPTIONS } from '@/components/modules/purchases/purchase-order-form/po-form-options';
import { formatMoney } from '@/lib/services/purchases-service';

export function PoPaymentInfo({
  paymentStatus,
  paidAmount,
  balanceDue,
  onPaymentStatusChange,
  onPaidAmountChange,
}: {
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  paidAmount: string;
  balanceDue: number;
  onPaymentStatusChange: (status: 'unpaid' | 'partial' | 'paid') => void;
  onPaidAmountChange: (value: string) => void;
}) {
  return (
    <div className={PO_SIDEBAR_CARD_CLS}>
      <h3 className="text-sm font-extrabold text-slate-900">Payment Information</h3>
      <div>
        <label className={PO_LABEL_CLS}>Payment Status</label>
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100">
          {PO_PAYMENT_STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onPaymentStatusChange(opt.value as 'unpaid' | 'partial' | 'paid')}
              className={`py-1.5 rounded-lg text-[10px] font-bold capitalize cursor-pointer transition-all ${
                paymentStatus === opt.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white/80'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className={PO_LABEL_CLS}>Paid Amount</label>
        <input
          type="number"
          min={0}
          step={0.01}
          value={paidAmount}
          onChange={(e) => onPaidAmountChange(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-200/90 bg-white text-xs font-medium"
        />
      </div>
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs font-bold text-slate-600">Balance Due</span>
        <span className="text-sm font-extrabold text-rose-600">{formatMoney(balanceDue)}</span>
      </div>
    </div>
  );
}
