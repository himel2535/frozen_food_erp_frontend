'use client';

import { toast } from '@/lib/ui/feedback';

import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight, Settings2 } from 'lucide-react';
import {
  formatTrialAmount,
  formatTrialMoney,
  type TrialBalanceAccount,
  type TrialBalanceMetrics,
} from '@/lib/services/trial-balance-service';

export function TrialBalanceTable({
  rows,
  metrics,
}: {
  rows: TrialBalanceAccount[];
  metrics: TrialBalanceMetrics;
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="premium-card premium-shadow overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900">Account Balances</h3>
        <button
          type="button"
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer"
          onClick={() => toast.info('Feature coming soon', { module: 'Trial Balance', description: "Column settings coming soon." })}
          aria-label="Table settings"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-xs">
          <thead>
            <tr className="border-b border-indigo-100 bg-indigo-50 text-left">
              <th className="px-4 py-2.5 w-10" />
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-indigo-700/90 text-left">Account Code</th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-indigo-700/90 text-left">Account Name</th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-indigo-700/90 text-left">Parent Account</th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-indigo-700/90 text-left">Debit (৳)</th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-indigo-700/90 text-left">Credit (৳)</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500 font-medium">
                  No accounts match the current filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const expanded = expandedIds.has(row.id);
                const hasChildren = (row.children?.length ?? 0) > 0;
                return (
                  <Fragment key={row.id}>
                    <tr className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-2.5">
                        <button
                          type="button"
                          onClick={() => toggleExpand(row.id)}
                          className="inline-flex items-center justify-center w-6 h-6 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                          aria-label={expanded ? 'Collapse row' : 'Expand row'}
                        >
                          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-slate-800">{row.accountCode}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-700">{row.accountName}</td>
                      <td className="px-4 py-2.5 text-slate-500">{row.parentAccount}</td>
                      <td className="px-4 py-2.5 text-left font-semibold text-slate-800 tabular-nums">
                        {formatTrialAmount(row.debit)}
                      </td>
                      <td className="px-4 py-2.5 text-left font-semibold text-slate-800 tabular-nums">
                        {formatTrialAmount(row.credit)}
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="border-b border-slate-50 bg-slate-50/40">
                        <td colSpan={6} className="px-10 py-2 text-[11px] text-slate-500">
                          {hasChildren
                            ? `${row.children!.length} sub-account${row.children!.length === 1 ? '' : 's'} — drill-down coming soon.`
                            : 'No sub-accounts for this ledger account.'}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="bg-blue-50/80 border-t border-blue-100">
                <td colSpan={4} className="px-4 py-3 font-extrabold text-slate-900">
                  Total
                </td>
                <td className="px-4 py-3 text-left font-extrabold text-blue-700 tabular-nums">
                  {formatTrialMoney(metrics.totalDebit)}
                </td>
                <td className="px-4 py-3 text-left font-extrabold text-blue-700 tabular-nums">
                  {formatTrialMoney(metrics.totalCredit)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
