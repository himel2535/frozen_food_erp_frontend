'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { formatMoney, getRecipeBomCost, type Recipe } from '@/lib/services/recipes-service';

const QUICK_QTY = [100, 500, 1000];

const INPUT_CLS =
  'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10';

interface PlanProductionModalProps {
  open: boolean;
  recipe: Recipe | null;
  initialQty?: string;
  onClose: () => void;
  onSubmit: (qty: number) => void;
}

export function PlanProductionModal({
  open,
  recipe,
  initialQty = '',
  onClose,
  onSubmit,
}: PlanProductionModalProps) {
  const [qtyInput, setQtyInput] = useState(initialQty);

  useEffect(() => {
    if (open) setQtyInput(initialQty);
  }, [open, initialQty]);

  if (!open || !recipe) return null;

  const handleSubmit = () => {
    const qty = Number(qtyInput);
    if (!Number.isFinite(qty) || qty < 1) {
      window.alert('Enter a valid quantity (minimum 1).');
      return;
    }
    onSubmit(Math.floor(qty));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
        aria-label="Close modal"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-production-title"
        className="relative w-full max-w-[420px] premium-card premium-shadow p-6 space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="plan-production-title" className="text-base font-extrabold text-slate-900">
              Plan Production
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              {recipe.product} · {recipe.model} · BOM {recipe.version}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs font-semibold text-slate-500">
          {recipe.materials.length} material{recipe.materials.length === 1 ? '' : 's'} in BOM · Est.{' '}
          {formatMoney(getRecipeBomCost(recipe))} / product
        </p>

        <div>
          <label className="block mb-2 text-xs font-bold text-slate-600">
            How many products do you want to make? *
          </label>
          <input
            type="number"
            min={1}
            step={1}
            value={qtyInput}
            onChange={(e) => setQtyInput(e.target.value)}
            className={INPUT_CLS}
            placeholder="e.g. 500"
            autoFocus
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {QUICK_QTY.map((qty) => (
            <button
              key={qty}
              type="button"
              onClick={() => setQtyInput(String(qty))}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer transition-colors ${
                qtyInput === String(qty)
                  ? 'bg-violet-100 border-violet-300 text-violet-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {qty.toLocaleString()}
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
          >
            Calculate Materials
          </button>
        </div>
      </div>
    </div>
  );
}
