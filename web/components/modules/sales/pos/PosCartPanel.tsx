'use client';

import { useState } from 'react';
import { ChevronDown, Minus, Plus, Trash2, UserRound } from 'lucide-react';
import type { PosCartItem } from './pos-types';
import { POS_BTN_DRAFT, POS_BTN_MORE, POS_BTN_PRIMARY } from './pos-styles';

export function PosCartPanel({
  cart,
  itemCount,
  customerId,
  customers,
  discount,
  note,
  totals,
  formatMoney,
  labels,
  onCustomerChange,
  onQtyChange,
  onRemove,
  onClear,
  onDiscountPrompt,
  onNotePrompt,
  onComplete,
  onSaveDraft,
  onMoreAction,
}: {
  cart: PosCartItem[];
  itemCount: number;
  customerId: string;
  customers: { id: string; name: string }[];
  discount: number;
  note: string;
  totals: { subtotal: number; discount: number; tax: number; total: number };
  formatMoney: (n: number) => string;
  labels: Record<string, string>;
  onCustomerChange: (id: string) => void;
  onQtyChange: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onDiscountPrompt: () => void;
  onNotePrompt: () => void;
  onComplete: () => void;
  onSaveDraft: () => void;
  onMoreAction: (action: 'hold' | 'recent' | 'clear' | 'reload-draft' | 'reset-tax') => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <aside className="premium-card premium-shadow bg-white/90 p-4 flex flex-col min-h-0 h-full">
      <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900">{labels.currentSale}</h2>
          <span className="inline-flex mt-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold">
            {itemCount} {labels.items}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
            <UserRound className="w-4 h-4 text-blue-600" />
          </span>
          <button
            type="button"
            onClick={onClear}
            disabled={cart.length === 0}
            className="w-8 h-8 rounded-lg border border-rose-100 bg-rose-50 text-rose-600 flex items-center justify-center cursor-pointer disabled:opacity-40"
            title={labels.clearCart}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 shrink-0">{labels.customer}</label>
      <select
        value={customerId}
        onChange={(e) => onCustomerChange(e.target.value)}
        className="w-full mb-3 bg-white/70 border border-blue-100/70 text-xs font-semibold rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/15"
      >
        <option value="walk-in">{labels.walkIn}</option>
        {customers.map((customer) => (
          <option key={customer.id} value={customer.id}>{customer.name}</option>
        ))}
      </select>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-0.5">
        {cart.length > 0 ? (
          <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_5.75rem_4.75rem] gap-x-2 px-1 pb-1 text-[9px] font-bold uppercase tracking-wide text-slate-400 shrink-0">
            <span aria-hidden="true" />
            <span>Item</span>
            <span className="text-center">Qty</span>
            <span className="text-right">Total</span>
          </div>
        ) : null}
        {cart.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[2.5rem_minmax(0,1fr)_5.75rem_4.75rem] gap-x-2 items-center rounded-xl border border-slate-100/90 bg-white p-2 shadow-[0_1px_0_rgba(15,23,42,0.04)]"
          >
            <div
              className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.imageGradient} flex items-center justify-center text-lg shrink-0`}
            >
              {item.imageEmoji}
            </div>

            <div className="min-w-0 pr-1">
              <p className="text-[11px] font-bold text-slate-800 truncate leading-tight">{item.name}</p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.sku}</p>
              <p className="text-[10px] font-semibold text-blue-600 tabular-nums mt-0.5 truncate">
                {formatMoney(item.price)}
              </p>
            </div>

            <div className="flex h-7 w-[5.75rem] items-stretch overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => onQtyChange(item.id, item.qty - 1)}
                className="flex w-7 items-center justify-center text-slate-600 hover:bg-white cursor-pointer transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="flex flex-1 items-center justify-center text-xs font-extrabold text-slate-800 tabular-nums">
                {item.qty}
              </span>
              <button
                type="button"
                onClick={() => onQtyChange(item.id, item.qty + 1)}
                className="flex w-7 items-center justify-center text-slate-600 hover:bg-white cursor-pointer transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <div className="flex w-[4.75rem] shrink-0 flex-col items-end justify-center gap-1">
              <p
                className="w-full truncate text-right text-[10px] font-extrabold leading-tight text-slate-800 tabular-nums"
                title={formatMoney(item.price * item.qty)}
              >
                {formatMoney(item.price * item.qty)}
              </p>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="flex h-6 w-6 items-center justify-center rounded-md border border-rose-100 bg-rose-50 text-rose-500 hover:bg-rose-100 cursor-pointer transition-colors"
                aria-label="Remove item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {cart.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">{labels.emptyCart}</p>
        ) : null}
      </div>

      <div className="mt-3 space-y-2 shrink-0">
        <button type="button" onClick={onDiscountPrompt} className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-dashed border-blue-200 bg-blue-50/40 text-xs font-bold text-blue-700 cursor-pointer">
          {labels.addDiscount}
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={onNotePrompt} className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-600 cursor-pointer">
          {note ? `${labels.note}: ${note}` : labels.addNote}
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-200 space-y-1.5 text-xs shrink-0">
        <Row label={labels.subtotal} value={formatMoney(totals.subtotal)} />
        <Row label={labels.discount} value={formatMoney(totals.discount)} />
        <Row label={labels.tax} value={formatMoney(totals.tax)} />
        <div className="grid grid-cols-[1fr_6.5rem] items-center pt-1 gap-2">
          <span className="text-sm font-extrabold text-slate-900">{labels.total}</span>
          <span className="text-lg font-extrabold text-slate-900 tabular-nums text-right truncate">{formatMoney(totals.total)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onComplete}
        disabled={cart.length === 0}
        className={`mt-3 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl shrink-0 ${POS_BTN_PRIMARY}`}
      >
        ✓ {labels.completeSale} <span className="text-[10px] font-bold opacity-80">F2</span>
      </button>

      <div className="mt-2 grid grid-cols-2 gap-2 shrink-0 relative">
        <button type="button" onClick={onSaveDraft} className={POS_BTN_DRAFT}>
          {labels.saveDraft}
        </button>
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          className={`${POS_BTN_MORE} inline-flex items-center justify-center gap-1`}
        >
          {labels.moreOptions}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
        </button>
        {moreOpen ? (
          <div className="absolute right-0 bottom-full mb-1 z-20 w-48 rounded-xl border border-slate-200 bg-white shadow-lg p-1">
            {[
              { id: 'hold' as const, label: 'Hold Sale' },
              { id: 'recent' as const, label: 'Recent Sales' },
              { id: 'reload-draft' as const, label: 'Reload Draft' },
              { id: 'reset-tax' as const, label: 'Reset Tax to 5%' },
              { id: 'clear' as const, label: 'Clear Cart' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onMoreAction(item.id);
                  setMoreOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[1fr_6.5rem] items-center gap-2 text-slate-600 font-semibold">
      <span>{label}</span>
      <span className="tabular-nums text-right truncate">{value}</span>
    </div>
  );
}
