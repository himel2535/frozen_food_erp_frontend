'use client';

import { Download, ListTree, Pencil } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
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
  onManageBom,
}: {
  variant: 'finished-goods' | 'semi-finished';
  row: Row;
  appState: AppState;
  onBack: () => void;
  onEdit: () => void;
  onManageBom?: () => void;
}) {
  const { formatDateTime } = useLocaleFormat();
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
  const lastUpdated = row.lastUpdated ? formatDateTime(String(row.lastUpdated)) : '—';

  const linkedRecipe = resolveRecipeForInventoryRow(appState, {
    id: row.id as string | number,
    sku: variant === 'finished-goods' ? String(row.sku ?? '') : String(row.id ?? ''),
    name: String(row.name ?? ''),
    recipeId: row.recipeId as string | number | undefined,
  });

  return (
    <DetailViewShell
      title={name}
      subtitle={id}
      onBack={onBack}
      actions={(
        <div className="flex items-center gap-2 shrink-0">
          {onManageBom ? (
            <button
              type="button"
              onClick={onManageBom}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-700 border border-violet-200 bg-violet-50 hover:bg-violet-100 px-3 py-2 rounded-xl cursor-pointer"
            >
              <ListTree className="w-3.5 h-3.5" />
              Manage BOM
            </button>
          ) : null}
          <Button
            type="button"
            onClick={() => downloadInventoryProductCsv(row, variant, appState)}
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Download Spec
          </Button>
          <Button
            type="button"
            onClick={onEdit}
            variant="primary"
            size="sm"
            leftIcon={<Pencil className="w-3.5 h-3.5" />}
          >
            Edit
          </Button>
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
              </>
            ) : null}
            <InfoRow
              label="Linked BOM"
              value={linkedRecipe
                ? `${linkedRecipe.recipeNumber} — ${linkedRecipe.product}`
                : 'None'}
            />
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

      {variant === 'semi-finished' ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Parts Used</h3>
            {onManageBom ? (
              <button
                type="button"
                onClick={onManageBom}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-700 cursor-pointer"
              >
                <ListTree className="w-3.5 h-3.5" />
                Manage BOM
              </button>
            ) : null}
          </div>
          {linkedRecipe && linkedRecipe.materials.length > 0 ? (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-2.5 font-bold text-slate-500">Part</th>
                    <th className="text-right px-4 py-2.5 font-bold text-slate-500">Qty / Unit</th>
                    <th className="text-right px-4 py-2.5 font-bold text-slate-500">Unit</th>
                    <th className="text-right px-4 py-2.5 font-bold text-slate-500">Cost / Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {linkedRecipe.materials.map((material) => (
                    <tr key={material.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2.5 font-semibold text-slate-800">{material.name}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-700">
                        {material.qtyPerProduct.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-600">{material.unit}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-700">
                        {formatMoney(material.standardCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center text-sm text-slate-500">
              {linkedRecipe
                ? 'No parts added to this BOM yet.'
                : 'No BOM linked. Use Manage BOM to create and add parts.'}
            </div>
          )}
        </div>
      ) : null}
    </DetailViewShell>
  );
}
