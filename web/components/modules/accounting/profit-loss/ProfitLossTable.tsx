'use client';

import { Pencil } from 'lucide-react';
import {
  formatPlAmount,
  formatPlMoney,
  formatPlPercent,
  type ProfitLossDisplayRow,
} from '@/lib/services/profit-loss-service';

const TONE_CLS: Record<string, string> = {
  green: 'text-emerald-700 border-emerald-200 bg-emerald-50/50',
  red: 'text-rose-700 border-rose-200 bg-rose-50/50',
  blue: 'text-blue-700 border-blue-200 bg-blue-50/50',
  purple: 'text-violet-700 border-violet-200 bg-violet-50/50',
  neutral: 'text-slate-700 border-slate-200 bg-slate-50/50',
};

function toneText(tone?: string) {
  if (tone === 'green') return 'text-emerald-700';
  if (tone === 'red') return 'text-rose-700';
  if (tone === 'blue') return 'text-blue-700';
  if (tone === 'purple') return 'text-violet-700';
  return 'text-slate-800';
}

export function ProfitLossTable({
  rows,
  onEdit,
}: {
  rows: ProfitLossDisplayRow[];
  onEdit: (sourceId: string) => void;
}) {
  return (
    <div className="premium-card premium-shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-xs">
          <thead>
            <tr className="border-b border-indigo-100 bg-indigo-50 text-left">
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-indigo-700/90 text-left">Line Item</th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-indigo-700/90 text-left">Category</th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-indigo-700/90 text-right">Amount (৳)</th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-indigo-700/90 text-right">% of Revenue</th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-indigo-700/90 text-right w-16">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              if (row.rowType === 'section_header') {
                return (
                  <tr key={row.id} className={`border-y ${TONE_CLS[row.tone ?? 'neutral']}`}>
                    <td colSpan={5} className="px-4 py-2 font-extrabold uppercase tracking-wide text-[11px]">
                      {row.lineItem}
                    </td>
                  </tr>
                );
              }

              const isSubtotal = row.rowType === 'subtotal';
              const isComputed = row.rowType === 'computed';
              const isEditable = row.rowType === 'line_item' && row.sourceId;

              const rowCls = row.highlight
                ? 'bg-emerald-50/80 border-t border-emerald-100'
                : isSubtotal || isComputed
                  ? 'bg-slate-50/60 border-t border-slate-100'
                  : 'border-b border-slate-50 hover:bg-slate-50/40';

              return (
                <tr key={row.id} className={rowCls}>
                  <td className={`px-4 py-2.5 text-left ${isSubtotal || isComputed ? `font-extrabold ${toneText(row.tone)}` : 'font-medium text-slate-700 pl-8'}`}>
                    {row.lineItem}
                  </td>
                  <td className="px-4 py-2.5 text-left text-slate-500">
                    {row.category ?? (isSubtotal || isComputed ? '—' : '')}
                  </td>
                  <td className={`px-4 py-2.5 text-right tabular-nums font-semibold ${toneText(row.tone)}`}>
                    {row.amount != null ? formatPlAmount(row.amount) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">
                    {row.percentOfRevenue != null ? formatPlPercent(row.percentOfRevenue) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {isEditable ? (
                      <button
                        type="button"
                        onClick={() => onEdit(row.sourceId!)}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 cursor-pointer"
                        aria-label={`Edit ${row.lineItem}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { formatPlMoney };
