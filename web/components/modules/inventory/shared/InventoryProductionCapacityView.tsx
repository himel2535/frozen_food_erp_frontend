'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Calculator,
  Factory,
  Info,
  Layers,
  Package,
  Pencil,
  ShoppingCart,
} from 'lucide-react';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { RecipeSelect } from '@/components/modules/inventory/shared/selects';
import { FORM_LABEL_CLS } from '@/components/shared/AppForm';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import type { AppState } from '@/lib/state/types';
import {
  getProductionWhatIfAnalysis,
  resolveRecipeForInventoryRow,
  type ProductionWhatIfLine,
} from '@/lib/services/recipes-service';

type Row = Record<string, unknown>;

const CARD_CLS = 'premium-card premium-shadow rounded-xl border border-slate-200/80 bg-white p-5';

const MATERIAL_CATEGORY_COLORS: Record<string, string> = {
  Plastic: 'bg-blue-100 text-blue-700',
  Chemicals: 'bg-violet-100 text-violet-700',
  Packaging: 'bg-amber-100 text-amber-700',
  'Plastic Parts': 'bg-sky-100 text-sky-700',
  Electronics: 'bg-rose-100 text-rose-700',
  Hardware: 'bg-slate-100 text-slate-600',
};

function MaterialIcon({ category }: { category: string }) {
  const color = MATERIAL_CATEGORY_COLORS[category] ?? 'bg-slate-100 text-slate-600';
  return (
    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
      <Package className="w-4 h-4" />
    </span>
  );
}

function MaterialStatusChip({ line }: { line: ProductionWhatIfLine }) {
  if (line.hasShortage) {
    return (
      <span className="inline-flex px-2.5 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-[10px] font-bold text-rose-700">
        Shortage
      </span>
    );
  }
  return (
    <span className="inline-flex px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
      Surplus
    </span>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
        checked ? 'bg-blue-600' : 'bg-slate-200'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function PageHeader({
  onBack,
  backLabel,
}: {
  onBack: () => void;
  backLabel: string;
}) {
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {backLabel}
      </button>
      <div>
        <h1 className="text-xl font-extrabold text-blue-600 tracking-tight">
          Production Calculator (What-If Analysis)
        </h1>
        <p className="text-xs font-semibold text-slate-500 mt-1">
          Plan a target production quantity and see material requirements, shortages &amp; remaining balance.
        </p>
      </div>
    </div>
  );
}

export function InventoryProductionCapacityView({
  variant,
  row,
  appState,
  onBack,
  backLabel = 'Back to Capacity Report',
  onEdit,
  onLinkBom,
}: {
  variant: 'finished-goods' | 'semi-finished';
  row: Row;
  appState: AppState;
  onBack: () => void;
  backLabel?: string;
  onEdit?: () => void;
  onLinkBom?: (recipeId: string) => void;
}) {
  const name = String(row.name ?? '—');
  const code = String(row.id ?? '—');
  const sku = String(row.sku ?? '—');
  const category = String(row.category ?? 'Uncategorized');
  const currentStockQty = Number(row.quantity ?? 0);
  const unit = String(row.unit ?? 'pcs');
  const stockLabel = variant === 'finished-goods' ? 'Current Finished Stock' : 'Current Semi-Finished Stock';

  const [linkRecipeId, setLinkRecipeId] = useState('');
  const [materialFilter, setMaterialFilter] = useState<'all' | 'shortage'>('all');
  const [unitView, setUnitView] = useState(true);

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
    const max = baseCapacity.capacity.maxProducibleUnits || 1;
    setTargetQty(String(max + 150));
  }, [baseCapacity?.capacity.maxProducibleUnits]);

  const analysis = useMemo(() => {
    if (!recipe) return null;
    const qty = Math.max(1, Math.floor(Number(targetQty) || 0));
    return getProductionWhatIfAnalysis(appState, recipe, currentStockQty, qty);
  }, [appState, recipe, currentStockQty, targetQty]);

  const filteredLines = useMemo(() => {
    if (!analysis) return [];
    if (materialFilter === 'shortage') {
      return analysis.lines.filter((line) => line.hasShortage);
    }
    return analysis.lines;
  }, [analysis, materialFilter]);

  const purchaseQuery = analysis?.purchaseShortages.length
    ? `?${analysis.purchaseShortages.map((item) => `material=${encodeURIComponent(item.name)}&qty=${encodeURIComponent(String(item.qty))}`).join('&')}`
    : '';
  const primaryShortage = analysis?.purchaseShortages[0];

  const columns = useMemo<AppTableColumn<ProductionWhatIfLine>[]>(() => {
    const target = analysis?.targetQty ?? 0;
    const maxUnits = analysis?.capacity.maxProducibleUnits ?? 0;
    return [
      {
        key: 'material',
        label: 'Raw Material',
        render: (line) => (
          <div className="flex items-center gap-2.5 min-w-[140px]">
            <MaterialIcon category={line.category} />
            <span className="min-w-0">
              <span className="font-semibold text-slate-800 block">{line.name}</span>
              <span className="text-[10px] font-semibold text-slate-500">{line.category}</span>
            </span>
          </div>
        ),
      },
      {
        key: 'perUnit',
        label: 'Required Per Unit',
        render: (line) => (
          <span className={`font-semibold ${unitView ? 'text-blue-700 font-bold' : 'text-slate-700'}`}>
            {line.effectiveQtyPerProduct.toLocaleString(undefined, { maximumFractionDigits: 2 })} {line.unit}
          </span>
        ),
      },
      {
        key: 'totalRequired',
        label: `Total Required (${target.toLocaleString()} ${unit})`,
        render: (line) => (
          <span className={`font-bold ${!unitView ? 'text-blue-700' : 'text-slate-800'}`}>
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
          <span className={`font-bold ${line.hasShortage ? 'text-rose-600' : 'text-emerald-600'}`}>
            {line.hasShortage
              ? `${line.shortageForTarget.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${line.unit}`
              : `+${line.surplusForTarget.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${line.unit}`}
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
  }, [analysis?.capacity.maxProducibleUnits, analysis?.targetQty, unit, unitView]);

  if (!recipe) {
    return (
      <div className={`${MODULE_LIST_SHELL} bg-slate-50`}>
        <div className="w-full space-y-2">
          <PageHeader onBack={onBack} backLabel={backLabel} />
          <div className={`${CARD_CLS} flex flex-col items-center justify-center text-center py-10 px-4 max-w-md mx-auto`}>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
              <Calculator className="w-7 h-7" />
            </span>
            <h3 className="font-extrabold text-slate-900">No BOM linked</h3>
            <p className="text-xs text-slate-500 mt-2">
              Link a Bill of Materials to run what-if production analysis for <span className="font-bold">{name}</span>.
            </p>
            <div className="w-full mt-5 text-left space-y-2">
              <label className={FORM_LABEL_CLS}>Select BOM / Recipe</label>
              <RecipeSelect
                state={appState}
                value={linkRecipeId}
                onChange={setLinkRecipeId}
                filterProduct={{ id: String(row.id), sku: String(row.sku ?? ''), name: String(row.name ?? '') }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
              <button
                type="button"
                disabled={!linkRecipeId}
                onClick={() => linkRecipeId && onLinkBom?.(linkRecipeId)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl cursor-pointer"
              >
                Link BOM &amp; Open Calculator
              </button>
              {onEdit ? (
                <button
                  type="button"
                  onClick={onEdit}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 rounded-xl cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit Product
                </button>
              ) : null}
              <Link
                href="/purchases/recipes"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl cursor-pointer"
              >
                Open Recipes
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const { capacity } = analysis;

  return (
    <div className={`${MODULE_LIST_SHELL} bg-slate-50`}>
      <div className="w-full space-y-2">
        <PageHeader onBack={onBack} backLabel={backLabel} />

        {/* Product Overview Card */}
        <div className={CARD_CLS}>
          <div className="flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-6">
            <div className="flex items-start gap-3 shrink-0 lg:min-w-[240px]">
              <Image
                src="/images/logo-toys.png"
                alt={name}
                width={56}
                height={56}
                className="w-14 h-14 rounded-lg border border-slate-200 object-cover shrink-0"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-extrabold text-slate-900">{name}</h2>
                  <span className="bg-violet-100 text-violet-700 text-[10px] font-bold px-2 py-0.5 rounded-md">{code}</span>
                </div>
                <div className="mt-2 space-y-0.5 text-[11px] font-semibold text-slate-500">
                  <p>SKU: <span className="text-slate-700">{sku || '—'}</span></p>
                  <p>Category: <span className="text-slate-700">{category}</span></p>
                  <p>Unit: <span className="text-slate-700">{unit}</span></p>
                </div>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-0 lg:divide-x lg:divide-slate-200">
              <div className="lg:px-4">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block">{stockLabel}</span>
                <p className="text-lg font-extrabold text-slate-900 mt-1">{currentStockQty.toLocaleString()} {unit}</p>
              </div>
              <div className="lg:px-4">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block">Can Produce Now (Max)</span>
                <p className="text-lg font-extrabold text-emerald-600 mt-1">{capacity.maxProducibleUnits.toLocaleString()} {unit}</p>
              </div>
              <div className="lg:px-4">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block">Total Potential Stock</span>
                <p className="text-lg font-extrabold text-blue-600 mt-1">{analysis.totalPotentialStock.toLocaleString()} {unit}</p>
              </div>
              <div className="lg:px-4">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block">Limiting Material</span>
                <p className="text-sm font-extrabold text-rose-600 mt-1 truncate">{capacity.limitingMaterialName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Set Target Production Quantity Card */}
        <div className={CARD_CLS}>
          <h3 className="text-sm font-extrabold text-slate-900 mb-4">Set Target Production Quantity</h3>
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_280px] gap-4 items-start">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">Target Production Quantity</label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={targetQty}
                  onChange={(e) => setTargetQty(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 cursor-pointer pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{unit}</span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 mt-1.5">
                Maximum Possible: {capacity.maxProducibleUnits.toLocaleString()} {unit}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block">Can Produce Now</span>
                <p className="text-base font-extrabold text-emerald-600 mt-1">{capacity.maxProducibleUnits.toLocaleString()} {unit}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block flex items-center justify-center gap-1">
                  Shortfall
                  {analysis.shortfallUnits > 0 ? <AlertTriangle className="w-3 h-3 text-rose-500" /> : null}
                </span>
                <p className="text-base font-extrabold text-rose-600 mt-1">{analysis.shortfallUnits.toLocaleString()} {unit}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block">After Production</span>
                <p className="text-base font-extrabold text-blue-600 mt-1">{analysis.afterProductionStock.toLocaleString()} {unit}</p>
              </div>
            </div>

            {analysis.shortfallUnits > 0 ? (
              <div className="rounded-xl border border-blue-200/80 bg-blue-50/80 px-4 py-3 flex items-start gap-2 text-xs text-blue-800 h-full">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  You want to produce <span className="font-bold">{analysis.targetQty.toLocaleString()} {unit}</span> but can produce only{' '}
                  <span className="font-bold">{capacity.maxProducibleUnits.toLocaleString()} {unit}</span> with available materials.
                  You are short of <span className="font-bold">{analysis.shortfallUnits.toLocaleString()} {unit}</span> due to material shortage.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 flex items-start gap-2 text-xs text-emerald-800 h-full">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  Target quantity of <span className="font-bold">{analysis.targetQty.toLocaleString()} {unit}</span> can be produced with current raw material stock.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Material Requirement Analysis Card */}
        <div className={`${CARD_CLS} !p-0 overflow-hidden`}>
          <div className="px-5 pt-5 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-sm font-extrabold text-slate-900">
              Material Requirement Analysis for {analysis.targetQty.toLocaleString()} {unit}
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-bold text-slate-500">View:</span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                <button
                  type="button"
                  onClick={() => setMaterialFilter('all')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer ${
                    materialFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  All Materials
                </button>
                <button
                  type="button"
                  onClick={() => setMaterialFilter('shortage')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer ${
                    materialFilter === 'shortage' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Shortage Only
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500">Unit View</span>
                <ToggleSwitch checked={unitView} onChange={setUnitView} />
              </div>
            </div>
          </div>

          {analysis.lines.length === 0 ? (
            <div className="px-5 pb-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-8 text-center">
                <Package className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No materials in this recipe</p>
                <p className="text-xs text-slate-500 mt-1">Add BOM lines in Purchases → Recipes to calculate production capacity.</p>
              </div>
            </div>
          ) : (
            <AppTable
              columns={columns}
              rows={filteredLines}
              emptyMessage={materialFilter === 'shortage' ? 'No material shortages for this target.' : 'No materials found.'}
              footer={analysis.purchaseShortages.length > 0 ? (
                <tr>
                  <td colSpan={columns.length} className="!p-0">
                    <div className="bg-orange-50 border-t border-orange-200 px-5 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                      <div className="flex items-start gap-2 text-xs text-orange-900">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-orange-600" />
                        <p>
                          {primaryShortage ? (
                            <>
                              Production cannot be completed. You are short of{' '}
                              <span className="font-bold">
                                {primaryShortage.qty.toLocaleString(undefined, { maximumFractionDigits: 2 })} {primaryShortage.unit} {primaryShortage.name}
                              </span>{' '}
                              to produce {analysis.targetQty.toLocaleString()} {unit}.
                            </>
                          ) : (
                            <>Production cannot be completed with current stock.</>
                          )}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
                        {primaryShortage ? (
                          <p className="text-xs text-orange-800">
                            To produce full {analysis.targetQty.toLocaleString()} {unit}, you need to purchase:{' '}
                            <span className="font-bold">
                              {primaryShortage.qty.toLocaleString(undefined, { maximumFractionDigits: 2 })} {primaryShortage.unit} {primaryShortage.name}
                            </span>
                          </p>
                        ) : null}
                        <Link
                          href={`/purchases/purchase-rm${purchaseQuery}`}
                          className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 px-3 py-2 rounded-xl cursor-pointer whitespace-nowrap"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          Create Purchase Request
                        </Link>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : undefined}
            />
          )}
        </div>

        {/* Next Steps */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900">Next Steps</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className={CARD_CLS}>
              <div className="flex items-center gap-2 text-slate-700 mb-2">
                <Factory className="w-4 h-4" />
                <span className="text-xs font-extrabold uppercase tracking-wide">Produce Maximum Possible</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Create production order for <span className="font-bold">{capacity.maxProducibleUnits.toLocaleString()} {unit}</span> with available materials.
              </p>
              <Link
                href="/purchases/recipes"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl cursor-pointer"
              >
                Create Production Order
              </Link>
            </div>

            <div className={CARD_CLS}>
              <div className="flex items-center gap-2 text-slate-700 mb-2">
                <Calculator className="w-4 h-4" />
                <span className="text-xs font-extrabold uppercase tracking-wide">Adjust Target Quantity</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Change target quantity to match available materials.
              </p>
              <button
                type="button"
                onClick={() => setTargetQty(String(capacity.maxProducibleUnits))}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl cursor-pointer"
              >
                Adjust Quantity
              </button>
            </div>

            <div className={CARD_CLS}>
              <div className="flex items-center gap-2 text-slate-700 mb-2">
                <Layers className="w-4 h-4" />
                <span className="text-xs font-extrabold uppercase tracking-wide">View BOM Details</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Check the complete Bill of Materials for this product.
              </p>
              <Link
                href={`/purchases/recipes?recipe=${encodeURIComponent(recipe.recipeNumber)}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl cursor-pointer"
              >
                View BOM
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
