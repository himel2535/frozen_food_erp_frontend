'use client';

import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight, Plus, Minus } from 'lucide-react';
import { CB_BTN_CASH_IN, CB_BTN_CASH_OUT, CB_BTN_TRANSFER } from './cashbox-styles';
import type { CashboxTab } from './cashbox-types';

export function CashboxActionBar({
  onCashIn,
  onCashOut,
  onTransfer,
}: {
  onCashIn: () => void;
  onCashOut: () => void;
  onTransfer: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={CB_BTN_CASH_IN} onClick={onCashIn}>
        <Plus className="w-4 h-4" />
        Cash In
      </button>
      <button type="button" className={CB_BTN_CASH_OUT} onClick={onCashOut}>
        <Minus className="w-4 h-4" />
        Cash Out
      </button>
      <button type="button" className={CB_BTN_TRANSFER} onClick={onTransfer}>
        <ArrowRightLeft className="w-4 h-4" />
        Transfer
      </button>
    </div>
  );
}

export function CashboxTypeArrow({ type }: { type: string }) {
  if (type === 'cash_in') {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
        <ArrowDownLeft className="w-3.5 h-3.5" />
        Cash In
      </span>
    );
  }
  if (type === 'transfer') {
    return (
      <span className="inline-flex items-center gap-1 text-indigo-600 font-bold text-xs">
        <ArrowRightLeft className="w-3.5 h-3.5" />
        Transfer
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-xs">
      <ArrowUpRight className="w-3.5 h-3.5" />
      Cash Out
    </span>
  );
}

export type { CashboxTab };
