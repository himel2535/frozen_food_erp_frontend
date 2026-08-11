'use client';

import { CheckCircle2, Plus, Printer } from 'lucide-react';
import type { PosReceiptData } from './pos-receipt';
import { POS_BTN_PRIMARY, POS_BTN_DRAFT } from './pos-styles';

export function PosReceiptView({
  receipt,
  formatMoney,
  onPrint,
  onNewSale,
}: {
  receipt: PosReceiptData;
  formatMoney: (n: number) => string;
  onPrint: () => void;
  onNewSale: () => void;
}) {
  const displayDate =
    receipt.displayDate ||
    (() => {
      const parsed = Date.parse(receipt.date);
      return Number.isNaN(parsed) ? receipt.date : new Date(parsed).toLocaleString();
    })();

  return (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-start py-2">
      <div className="w-full max-w-lg premium-card premium-shadow p-5 sm:p-6 space-y-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Sale completed</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Receipt <span className="font-bold text-slate-700">{receipt.receiptId}</span>
              {receipt.invoiceId ? (
                <>
                  {' · '}Invoice <span className="font-bold text-slate-700">{receipt.invoiceId}</span>
                </>
              ) : null}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-3">
          {receipt.company?.name ? (
            <div className="pb-2 border-b border-slate-200/70">
              <p className="text-sm font-extrabold text-slate-900">{receipt.company.name}</p>
              {receipt.company.address ? (
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{receipt.company.address}</p>
              ) : null}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <p className="font-bold uppercase tracking-wide text-slate-400">Date</p>
              <p className="font-semibold text-slate-700 mt-0.5">{displayDate}</p>
            </div>
            <div>
              <p className="font-bold uppercase tracking-wide text-slate-400">Customer</p>
              <p className="font-semibold text-slate-700 mt-0.5 truncate">{receipt.customer}</p>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-200 pt-2 space-y-2">
            {receipt.items.map((item) => (
              <div key={`${receipt.receiptId}-${item.id}`} className="flex items-start justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 truncate">{item.name}</p>
                  <p className="text-[10px] text-slate-500">
                    {item.sku} · {item.qty} × {formatMoney(item.price)}
                  </p>
                </div>
                <p className="font-bold text-slate-800 tabular-nums shrink-0">
                  {formatMoney(item.price * item.qty)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-slate-200 pt-2 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="tabular-nums font-semibold">{formatMoney(receipt.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Discount</span>
              <span className="tabular-nums font-semibold">{formatMoney(receipt.discount)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax (VAT {receipt.taxRate}%)</span>
              <span className="tabular-nums font-semibold">{formatMoney(receipt.tax)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1">
              <span>Total</span>
              <span className="tabular-nums">{formatMoney(receipt.total)}</span>
            </div>
          </div>

          {receipt.note ? (
            <p className="text-[11px] text-slate-500 border-t border-slate-200/70 pt-2">
              Note: {receipt.note}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button type="button" onClick={onPrint} className={`flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl ${POS_BTN_DRAFT}`}>
            <Printer className="w-4 h-4" />
            Print Again
          </button>
          <button type="button" onClick={onNewSale} className={`flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl ${POS_BTN_PRIMARY}`}>
            <Plus className="w-4 h-4" />
            New Sale
          </button>
        </div>
      </div>
    </div>
  );
}
