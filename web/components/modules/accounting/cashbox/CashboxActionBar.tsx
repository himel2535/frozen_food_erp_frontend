'use client';

import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/shared/Button';
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
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button
        type="button"
        variant="success"
        size="sm"
        leftIcon={<Plus className="w-4 h-4" />}
        onClick={onCashIn}
      >
        Cash In
      </Button>
      <Button
        type="button"
        variant="danger"
        size="sm"
        leftIcon={<Minus className="w-4 h-4" />}
        onClick={onCashOut}
      >
        Cash Out
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        leftIcon={<ArrowRightLeft className="w-4 h-4" />}
        onClick={onTransfer}
      >
        Transfer
      </Button>
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
