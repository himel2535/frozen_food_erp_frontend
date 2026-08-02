'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calculator,
  Download,
  Factory,
  Info,
  Package,
  ShoppingCart,
  SlidersHorizontal,
} from 'lucide-react';
import { DetailViewShell } from '@/components/shared/DetailViewShell';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import type { AppState } from '@/lib/state/types';
import { downloadProductionWhatIfCsv } from '@/lib/services/inventory-export';
import {
  getProductionWhatIfAnalysis,
  resolveRecipeForInventoryRow,
  type ProductionWhatIfLine,
} from '@/lib/services/recipes-service';

type Row = Record<string, unknown>;

const CATEGORY_COLORS: Record<string, string> = {
  'Action Figures': 'bg-violet-100 text-violet-700',
  'Toy Car': 'bg-blue-100 text-blue-700',
  'Building Blocks': 'bg-sky-100 text-sky-700',
  'Plastic Parts': 'bg-blue-100 text-blue-700',
  Electronics: 'bg-rose-100 text-rose-700',
  Packaging: 'bg-amber-100 text-amber-700',
};

function ProductThumb({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category] ?? 'bg-slate-100 text-slate-600';
  return (
    <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Package className="w-5 h-5" />
    </span>
  );
}

function MaterialStatusChip({ line }: { line: ProductionWhatIfLine }) {
  if (line.hasShortage) {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-[10px] font-bold text-rose-800">
        Shortage
      </span>
    );
  }
  return (
    <span className="inline-flex px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-800">
      Surplus
    </span>
  );
}

export function InventoryProductionCapacityView({
  variant,
  row,
  appState,
  onBack,
}: {
  variant: 'finished-goods' | 'semi-finished';
  row: Row;
  appState: AppState;
  onBack: () => void;
}) {
  const name = String(row.name ?? '—');
  const code = String(row.id ?? '—');
  const sku = String(row.sku ?? '—');
  const category = String(row.category ?? 'Uncategorized');
  const currentStockQty = Number(row.quantity ?? 0);
  const unit = String(row.unit ?? 'pcs');
  const stockLabel = variant === 'finished-goods' ? 'Current Finished Stock' : 'Current Semi-Finished Stock';

  const recipe = useMemo(
    () => resolveRecipeForInventoryRow(appState, {
      id: row.id as string | number,
      sku: String(row.sku ?? ''),
      name: String(row.name ?? ''),
      recipeId: row.recipeId as string | number | undefined,
    }),
    [appState, row.id, row.name, row.sku, row.recipeId],
  );

  const baseCapacity = useMemo(
    () => (recipe ? getProductionWhatIfAnalysis(appState, recipe, currentStockQty, 1) : null),
    [appState, recipe, currentStockQty],
  );

  const [targetQty, setTargetQty] = useState('');

  useEffect(() => {
    if (!baseCapacity) return;
    setTargetQty(String(Math.max(1, baseCapacity.capacity.maxProducibleUnits || 1)));
  }, [baseCapacity?.capacity.maxProducibleUnits]);

  const analysis = useMemo(() => {
    if (!recipe) return null;
    const qty = Math.max(1, Math.floor(Number(targetQty) || 0));
    return getProductionWhatIfAnalysis(appState, recipe, currentStockQty, qty);
  }, [appState, recipe, currentStockQty, targetQty]);

  const columns = useMemo<AppTableColumn<ProductionWhatIfLine>[]>(() => {
    const target = analysis?.targetQty ?? 0;
    const maxUnits = analysis?.capacity.maxProducibleUnits ?? 0;
    return [
      {
        key: 'material',
        label: 'Raw Material',
        render: (line) => (
          <div className="min-w-[140px]">
            <span className="font-semibold text-slate-800 block">{line.name}</span>
            <span className="text-[10px] font-semibold text-slate-500">{line.category}</span>
          </div>
        ),
      },
      {
        key: 'perUnit',
        label: 'Required Per Unit',
        render: (line) => (
          <span className="font-semibold text-slate-700">
            {line.effectiveQtyPerProduct.toLocaleString(undefined, { maximumFractionDigits: 2 })} {line.unit}
          </span>
        ),
      },
      {
        key: 'totalRequired',
        label: `Total Required (${target.toLocaleString()} ${unit})`,
        render: (line) => (
          <span className="font-bold text-slate-800">
            {line.totalRequiredForTarget.toLocaleString(undefined, { maximumFractionDigits: 2 })} {line.unit}
          </span>
        ),
      },
      {
        key: 'available',
        label: 'Available Stock',
        render: (line) => (
          <span className="font-bold text-slate-800">
            {line.availableQty.toLocaleString(undefined, { maximumFractionDigits: 2 })} {line.unit}
          </span>
        ),
      },
      {
        key: 'shortageSurplus',
        label: 'Shortage / Surplus',
        render: (line) => (
          <span className={`font-bold ${line.hasShortage ? 'text-rose-700' : 'text-emerald-700'}`}>
            {line.hasShortage
              ? `${line.shortageForTarget.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${line.unit}`
              : `${line.surplusForTarget.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${line.unit}`}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        render: (line) => <MaterialStatusChip line={line} />,
      },
      {
        key: 'remaining',
        label: `Remaining After Producing ${maxUnits.toLocaleString()} ${unit}`,
        render: (line) => (
          <span className="font-bold text-slate-700">
            {line.remainingAfterMaxProduction.toLocaleString(undefined, { maximumFractionDigits: 2 })} {line.unit}
          </span>
        ),
      },
    ];
  }, [analysis?.capacity.maxProducibleUnits, analysis?.targetQty, unit]);

  if (!recipe) {
    return (
      <DetailViewShell
        title="Production Calculator (What-If Analysis)"
        subtitle="Plan a target production quantity and see material requirements, shortages & remaining balance."
        onBack={onBack}
      >
        <div className="flex flex-col items-center justify-center text-center py-10 px-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
            <Calculator className="w-7 h-7" />
          </span>
          <h3 className="font-extrabold text-slate-900">No BOM linked</h3>
          <p className="text-xs text-slate-500 mt-2 max-w-md">
            This product does not have an active recipe/BOM yet. Create one under Purchases → Recipes to run what-if production analysis.
          </p>
          <Link
            href="/purchases/recipes"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl cursor-pointer"
          >
            Open Recipes
          </Link>
        </div>
      </DetailViewShell>
    );
  }

  if (!analysis) return null;

  const { capacity } = analysis;
  const purchaseQuery = analysis.purchaseShortages.length
    ? `?${analysis.purchaseShortages.map((item) => `material=${encodeURIComponent(item.name)}&qty=${encodeURIComponent(String(item.qty))}`).join('&')}`
    : '';

  return (
    <DetailViewShell
      title="Production Calculator (What-If Analysis)"
      subtitle="Plan a target production quantity and see material requirements, shortages & remaining balance."
      onBack={onBack}
      actions={(
        <button
          type="button"
          onClick={() => downloadProductionWhatIfCsv(analysis, name)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 rounded-xl cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          Download Report
        </button>
      )}
    >
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
        <div className="flex items-start gap-3">
          <ProductThumb category={category} />
          <div className="min-w-0">
            <h3 className="font-extrabold text-slate-900">{name}</h3>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Code: {code} · SKU: {sku || '—'} · Recipe {recipe.recipeNumber}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{stockLabel}</span>
            <p className="text-lg font-extrabold text-slate-900 mt-1">{currentStockQty.toLocaleString()} {unit}</p>
          </div>
          <div className="rounded-xl border border-blue-200/80 bg-blue-50/80 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wide text-blue-700">Can Produce Now (Max)</span>
            <p className="text-lg font-extrabold text-blue-700 mt-1">{capacity.maxProducibleUnits.toLocaleString()} {unit}</p>
          </div>
          <div className="rounded-xl border border-violet-200/80 bg-violet-50/80 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wide text-violet-700">Total Potential Stock</span>
            <p className="text-lg font-extrabold text-violet-700 mt-1">{analysis.totalPotentialStock.toLocaleString()} {unit}</p>
          </div>
          <div className="rounded-xl border border-rose-200/80 bg-rose-50/80 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wide text-rose-700">Limiting Material</span>
            <p className="text-sm font-extrabold text-rose-800 mt-1 truncate">{capacity.limitingMaterialName}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">What-If Planning</h3>
          <p className="text-xs text-slate-500 mt-0.5">Set a target quantity to simulate material requirements and shortages.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4 items-start">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">Set Target Production Quantity</label>
            <input
              type="number"
              min={1}
              step={1}
              value={targetQty}
              onChange={(e) => setTargetQty(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 cursor-pointer"
            />
            <p className="text-[11px] font-semibold text-slate-500 mt-1.5">
              Maximum Possible: {capacity.maxProducibleUnits.toLocaleString()} {unit}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[capacity.maxProducibleUnits, Math.max(1, capacity.maxProducibleUnits + 150), analysis.totalPotentialStock]
                .filter((value, index, arr) => arr.indexOf(value) === index && value > 0)
                .map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTargetQty(String(value))}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 cursor-pointer"
                  >
                    {value.toLocaleString()} {unit}
                  </button>
                ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-blue-200/80 bg-blue-50/70 p-4">
              <span className="text-[11px] font-bold uppercase tracking-wide text-blue-700">Can Produce Now</span>
              <p className="text-xl font-extrabold text-blue-700 mt-1">{capacity.maxProducibleUnits.toLocaleString()} {unit}</p>
            </div>
            <div className="rounded-xl border border-rose-200/80 bg-rose-50/70 p-4">
              <span className="text-[11px] font-bold uppercase tracking-wide text-rose-700">Shortfall</span>
              <p className="text-xl font-extrabold text-rose-700 mt-1">{analysis.shortfallUnits.toLocaleString()} {unit}</p>
            </div>
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-4">
              <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">After Production</span>
              <p className="text-xl font-extrabold text-emerald-700 mt-1">{analysis.afterProductionStock.toLocaleString()} {unit}</p>
            </div>
          </div>
        </div>

        {analysis.shortfallUnits > 0 ? (
          <div className="rounded-xl border border-blue-200/80 bg-blue-50/80 px-4 py-3 flex items-start gap-2 text-xs text-blue-800">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              You want to produce <span className="font-bold">{analysis.targetQty.toLocaleString()} {unit}</span> but can produce only{' '}
              <span className="font-bold">{capacity.maxProducibleUnits.toLocaleString()} {unit}</span> with available materials.
              You are short of <span className="font-bold">{analysis.shortfallUnits.toLocaleString()} {unit}</span> due to material shortage.
            </p>
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">Material Requirement Analysis</h3>
          <p className="text-xs text-slate-500 mt-0.5">Raw material availability vs requirements for your target quantity.</p>
        </div>

        {analysis.lines.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-8 text-center">
            <Package className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No materials in this recipe</p>
            <p className="text-xs text-slate-500 mt-1">Add BOM lines in Purchases → Recipes to calculate production capacity.</p>
          </div>
        ) : (
          <AppTable
            columns={columns}
            rows={analysis.lines}
            emptyMessage="No materials found."
          />
        )}
      </div>

      {analysis.purchaseShortages.length > 0 ? (
        <div className="rounded-xl border border-rose-200/80 bg-rose-50/80 px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-2 text-xs text-rose-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Production cannot be completed with current stock. To produce full {analysis.targetQty.toLocaleString()} {unit}, you need to purchase:{' '}
              {analysis.purchaseShortages.map((item) => `${item.qty.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${item.unit} ${item.name}`).join(', ')}.
            </p>
          </div>
          <Link
            href={`/purchases/purchase-rm${purchaseQuery}`}
            className="inline-flex items-center gap-1.5 shrink-0 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-3 py-2 rounded-xl cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Create Purchase Request
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex items-center gap-2 text-slate-700">
            <Factory className="w-4 h-4" />
            <span className="text-xs font-extrabold uppercase tracking-wide">Produce Maximum Possible</span>
          </div>
          <p className="text-xs text-slate-500">Create a production order for the maximum quantity currently possible.</p>
          <Link
            href="/manufacturing/bom"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl cursor-pointer"
          >
            Create Production Order
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex items-center gap-2 text-slate-700">
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-xs font-extrabold uppercase tracking-wide">Adjust Target Quantity</span>
          </div>
          <p className="text-xs text-slate-500">Match your target to available raw materials.</p>
          <button
            type="button"
            onClick={() => setTargetQty(String(capacity.maxProducibleUnits))}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl cursor-pointer"
          >
            Adjust to {capacity.maxProducibleUnits.toLocaleString()} {unit}
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex items-center gap-2 text-slate-700">
            <Package className="w-4 h-4" />
            <span className="text-xs font-extrabold uppercase tracking-wide">View BOM Details</span>
          </div>
          <p className="text-xs text-slate-500">Open the linked recipe and review all BOM materials.</p>
          <Link
            href={`/purchases/recipes?recipe=${encodeURIComponent(recipe.recipeNumber)}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-700 border border-violet-200 bg-violet-50 hover:bg-violet-100 px-3 py-2 rounded-xl cursor-pointer"
          >
            View BOM
          </Link>
        </div>
      </div>
    </DetailViewShell>
  );
}
