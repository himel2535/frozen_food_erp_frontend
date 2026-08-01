'use client';

import { FlaskConical, Package, Puzzle } from 'lucide-react';
import {
  PRODUCT_TYPE_CARDS,
  type ProductTypeCardId,
} from '@/components/modules/inventory/product-form/product-form-options';

const ICONS = {
  package: Package,
  flask: FlaskConical,
  puzzle: Puzzle,
} as const;

export function ProductTypeSelector({
  value,
  onChange,
}: {
  value: ProductTypeCardId;
  onChange: (id: ProductTypeCardId) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {PRODUCT_TYPE_CARDS.map((card) => {
        const Icon = ICONS[card.icon];
        const selected = value === card.id;
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onChange(card.id)}
            className={`flex flex-col items-start gap-2 p-3 rounded-xl border text-left transition-all cursor-pointer min-h-[100px] ${
              selected
                ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-200'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                selected ? 'border-blue-600' : 'border-slate-300'
              }`}
            >
              {selected ? <span className="w-2 h-2 rounded-full bg-blue-600" /> : null}
            </span>
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-600 shrink-0">
              <Icon className="w-4 h-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-extrabold text-slate-900">{card.label}</span>
              <span className="block text-[11px] font-semibold text-slate-500 mt-0.5 leading-snug">{card.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
