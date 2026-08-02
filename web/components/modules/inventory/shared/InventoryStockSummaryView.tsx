'use client';

import { Download, Info } from 'lucide-react';
import { DetailViewShell } from '@/components/shared/DetailViewShell';
import { formatMoney } from '@/lib/services/inventory-service';
import {
  downloadInventoryStockSummaryCsv,
  type InventoryStockSummary,
} from '@/lib/services/inventory-export';

function SummaryTable({
  title,
  rows,
}: {
  title: string;
  rows: InventoryStockSummary['byCategory'];
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="text-left px-3 py-2 font-bold">Label</th>
              <th className="text-right px-3 py-2 font-bold">Products</th>
              <th className="text-right px-3 py-2 font-bold">Qty</th>
              <th className="text-right px-3 py-2 font-bold">Value</th>
              <th className="text-right px-3 py-2 font-bold">Low</th>
              <th className="text-right px-3 py-2 font-bold">Out</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-slate-400 font-medium">No data</td>
              </tr>
            ) : rows.map((row) => (
              <tr key={row.label}>
                <td className="px-3 py-2 font-semibold text-slate-800">{row.label}</td>
                <td className="px-3 py-2 text-right font-semibold text-slate-700">{row.products}</td>
                <td className="px-3 py-2 text-right font-semibold text-slate-700">{row.quantity.toLocaleString()}</td>
                <td className="px-3 py-2 text-right font-bold text-blue-700">{formatMoney(row.value)}</td>
                <td className="px-3 py-2 text-right font-semibold text-amber-600">{row.lowStock}</td>
                <td className="px-3 py-2 text-right font-semibold text-rose-600">{row.outOfStock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function InventoryStockSummaryView({
  summary,
  onBack,
}: {
  summary: InventoryStockSummary;
  onBack: () => void;
}) {
  const title = summary.variant === 'finished-goods' ? 'Finished Goods Stock Summary' : 'Semi-Finished Stock Summary';
  const { totals } = summary;

  return (
    <DetailViewShell
      title={title}
      subtitle="Breakdown by category, warehouse, and stock status"
      onBack={onBack}
      actions={(
        <button
          type="button"
          onClick={() => downloadInventoryStockSummaryCsv(summary)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 rounded-xl cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          Download Summary
        </button>
      )}
    >
      <div className={`grid gap-3 ${summary.variant === 'finished-goods' ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-7' : 'grid-cols-2 md:grid-cols-5'}`}>
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Products</span>
          <p className="text-lg font-extrabold text-slate-900 mt-1">{totals.products}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Total Qty</span>
          <p className="text-lg font-extrabold text-blue-700 mt-1">{totals.quantity.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Total Value</span>
          <p className="text-lg font-extrabold text-blue-700 mt-1">{formatMoney(totals.value)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">In Stock</span>
          <p className="text-lg font-extrabold text-emerald-600 mt-1">{totals.inStock}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Low Stock</span>
          <p className="text-lg font-extrabold text-amber-600 mt-1">{totals.lowStock}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Out of Stock</span>
          <p className="text-lg font-extrabold text-rose-600 mt-1">{totals.outOfStock}</p>
        </div>
        {summary.variant === 'finished-goods' ? (
          <>
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Reserved</span>
              <p className="text-lg font-extrabold text-amber-600 mt-1">{Number(totals.reserved ?? 0).toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Available</span>
              <p className="text-lg font-extrabold text-emerald-600 mt-1">{Number(totals.available ?? 0).toLocaleString()}</p>
            </div>
          </>
        ) : null}
      </div>

      {summary.variant === 'finished-goods' ? (
        <div className="rounded-xl border border-blue-200/80 bg-blue-50/80 px-4 py-3 flex items-start gap-2 text-xs text-blue-800">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            <span className="font-bold">Available Qty = Stock Qty − Reserved Qty.</span>{' '}
            Reserved qty are allocated for customer orders but not delivered yet.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 flex items-start gap-2 text-xs text-emerald-800">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            <span className="font-bold">Track WIP parts stock by warehouse and location.</span>{' '}
            Use this summary to monitor semi-finished inventory across production stages.
          </p>
        </div>
      )}

      <div className="space-y-6">
        <SummaryTable title="By Category" rows={summary.byCategory} />
        <SummaryTable title="By Warehouse" rows={summary.byWarehouse} />
        <SummaryTable title="By Status" rows={summary.byStatus} />
      </div>
    </DetailViewShell>
  );
}
