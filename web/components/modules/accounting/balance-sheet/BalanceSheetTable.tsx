'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import {
  formatBsAmount,
  formatBsMoney,
  type BalanceSheetDisplayRow,
  type BalanceSheetMetrics,
} from '@/lib/services/balance-sheet-service';

export function BalanceSheetTable({
  rows,
  metrics,
  onEdit,
  onDelete,
}: {
  rows: BalanceSheetDisplayRow[];
  metrics: BalanceSheetMetrics;
  onEdit: (sourceId: string) => void;
  onDelete: (sourceId: string) => void;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleGroup = (groupKey: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  };

  return (
    <div className="premium-card premium-shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-xs">
          <thead>
            <tr className="border-b border-indigo-100 bg-indigo-50 text-left">
              <th className="px-4 py-2.5 w-8" />
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-indigo-700/90 text-left">Line Item</th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-indigo-700/90 text-left">Section</th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-indigo-700/90 text-left">Type</th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-indigo-700/90 text-right">Amount (BDT)</th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-indigo-700/90 text-right w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500 font-medium">
                  No balance sheet lines match the current filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                if (row.rowType === 'group_header') {
                  const isCollapsed = collapsed.has(row.groupKey!);
                  return (
                    <tr key={row.id} className="bg-slate-50/80 border-y border-slate-100">
                      <td className="px-4 py-2.5">
                        <button
                          type="button"
                          onClick={() => toggleGroup(row.groupKey!)}
                          className="inline-flex items-center justify-center w-6 h-6 rounded text-slate-500 hover:bg-slate-100 cursor-pointer"
                          aria-label={isCollapsed ? 'Expand group' : 'Collapse group'}
                        >
                          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                      <td colSpan={3} className="px-4 py-2.5 font-extrabold text-slate-800">
                        {row.lineItem}
                      </td>
                      <td className="px-4 py-2.5 text-right font-extrabold text-slate-800 tabular-nums">
                        {formatBsAmount(row.groupTotal ?? 0)}
                      </td>
                      <td />
                    </tr>
                  );
                }

                if (collapsed.has(row.groupKey!)) return null;

                return (
                  <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/40">
                    <td className="px-4 py-2.5" />
                    <td className="px-4 py-2.5 pl-8 font-medium text-slate-700">{row.lineItem}</td>
                    <td className="px-4 py-2.5 text-slate-500">{row.sectionLabel}</td>
                    <td className="px-4 py-2.5 text-slate-500">{row.type}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-800 tabular-nums">
                      {formatBsAmount(row.amount ?? 0)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(row.sourceId!)}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 text-blue-600 hover:bg-blue-50 cursor-pointer"
                          aria-label={`Edit ${row.lineItem}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(row.sourceId!)}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                          aria-label={`Delete ${row.lineItem}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50 border-t border-slate-200">
                <td colSpan={4} className="px-4 py-3 font-extrabold text-slate-900">Totals</td>
                <td className="px-4 py-3 text-right">
                  <div className="space-y-1">
                    <div className="font-extrabold text-blue-700 tabular-nums">{formatBsMoney(metrics.totalAssets)}</div>
                    <div className="font-extrabold text-rose-700 tabular-nums">{formatBsMoney(metrics.totalLiabilities)}</div>
                    <div className="font-extrabold text-emerald-700 tabular-nums">{formatBsMoney(metrics.totalEquity)}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className={`inline-flex flex-col items-end rounded-lg px-2.5 py-1.5 ${metrics.isBalanced ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    <span className="font-extrabold">{metrics.isBalanced ? 'Balanced' : 'Unbalanced'}</span>
                    <span className="text-[10px] font-semibold">Difference {formatBsMoney(metrics.difference)}</span>
                  </div>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
