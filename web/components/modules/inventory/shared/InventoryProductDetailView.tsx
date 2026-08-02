'use client';

import { Download, Pencil } from 'lucide-react';
import { DetailViewShell } from '@/components/shared/DetailViewShell';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { AppState } from '@/lib/state/types';
import {
  formatMoney,
  getFinishedGoodsAvailable,
  getFinishedGoodsStockStatus,
  getFinishedGoodsStockValue,
  getSemiFinishedLocationLabel,
  getSemiFinishedStockStatus,
  getSemiFinishedTotalValue,
  getWarehouseName,
} from '@/lib/services/inventory-service';
import { downloadInventoryProductCsv } from '@/lib/services/inventory-export';
import { resolveRecipeForInventoryRow } from '@/lib/services/recipes-service';

type Row = Record<string, unknown>;

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-xs py-2 border-b border-slate-50 last:border-0">
      <span className="text-slate-500 font-semibold shrink-0">{label}</span>
      <span className="text-slate-800 font-bold text-right">{value || '—'}</span>
    </div>
  );
}

function MetricCard({ label, value, tone = 'slate' }: { label: string; value: string; tone?: 'slate' | 'blue' | 'amber' | 'emerald' }) {
  const toneClass = {
    slate: 'text-slate-900',
    blue: 'text-blue-700',
    amber: 'text-amber-600',
    emerald: 'text-emerald-600',
  }[tone];

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <p className={`text-lg font-extrabold mt-1 ${toneClass}`}>{value}</p>
    </div>
  );
}

export function InventoryProductDetailView({
  variant,
  row,
  appState,
  onBack,
  onEdit,
}: {
  variant: 'finished-goods' | 'semi-finished';
  row: Row;
  appState: AppState;
  onBack: () => void;
  onEdit: () => void;
}) {
  const name = String(row.name ?? '—');
  const id = String(row.id ?? '—');
  const warehouse = getWarehouseName(appState, String(row.warehouseId ?? 'WH-001'));
  const location = variant === 'semi-finished' ? getSemiFinishedLocationLabel(appState, row) : warehouse;
  const status = variant === 'finished-goods'
    ? getFinishedGoodsStockStatus(row)
    : getSemiFinishedStockStatus(row);
  const stockQty = Number(row.quantity ?? 0);
  const avgCost = Number(row.avgCost ?? row.price ?? 0);
  const stockValue = variant === 'finished-goods'
    ? getFinishedGoodsStockValue(row)
    : getSemiFinishedTotalValue(row);
  const lastUpdated = row.lastUpdated
    ? new Date(String(row.lastUpdated)).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : '—';

  const linkedRecipe = variant === 'finished-goods'
    ? resolveRecipeForInventoryRow(appState, {
        id: row.id as string | number,
        sku: String(row.sku ?? ''),
        name: String(row.name ?? ''),
        recipeId: row.recipeId as string | number | undefined,
      })
    : null;

  return (
    <DetailViewShell
      title={name}
      subtitle={id}
      onBack={onBack}
      actions={(
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => downloadInventoryProductCsv(row, variant, appState)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 rounded-xl cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download Spec
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-xl cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        </div>
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={status} />
        <span className="text-xs font-semibold text-slate-500">{String(row.category ?? 'Uncategorized')}</span>
      </div>

      <div className={`grid gap-3 ${variant === 'finished-goods' ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-2 md:grid-cols-4'}`}>
        <MetricCard label="Stock Qty" value={stockQty.toLocaleString()} tone="blue" />
        {variant === 'finished-goods' ? (
          <>
            <MetricCard label="Reserved" value={Number(row.reserved ?? 0).toLocaleString()} tone="amber" />
            <MetricCard label="Available" value={getFinishedGoodsAvailable(row).toLocaleString()} tone="emerald" />
          </>
        ) : null}
        <MetricCard label="Avg. Cost" value={formatMoney(avgCost)} />
        <MetricCard label="Stock Value" value={formatMoney(stockValue)} tone="blue" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Product Details</h3>
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-2">
            {variant === 'finished-goods' ? (
              <>
                <InfoRow label="SKU" value={String(row.sku ?? '')} />
                <InfoRow label="Barcode" value={String(row.barcode ?? '')} />
                <InfoRow
                  label="Linked BOM"
                  value={linkedRecipe
                    ? `${linkedRecipe.recipeNumber} — ${linkedRecipe.product}`
                    : 'None'}
                />
              </>
            ) : null}
            <InfoRow label="Category" value={String(row.category ?? '')} />
            <InfoRow label="Unit" value={String(row.unit ?? 'pcs')} />
            <InfoRow label="Min. Stock Level" value={Number(row.minStock ?? row.threshold ?? 0).toLocaleString()} />
            <InfoRow label="Warehouse" value={warehouse} />
            <InfoRow label="Location" value={location} />
            <InfoRow label="Last Updated" value={lastUpdated} />
          </div>
        </div>

        {String(row.notes ?? '').trim() ? (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Notes</h3>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap">
              {String(row.notes)}
            </div>
          </div>
        ) : null}
      </div>
    </DetailViewShell>
  );
}
