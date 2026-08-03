'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, Download, Layers, Package, Pencil } from 'lucide-react';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { RecipeSelect } from '@/components/modules/inventory/shared/selects';
import { FORM_LABEL_CLS } from '@/components/shared/AppForm';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import type { AppState } from '@/lib/state/types';
import { downloadMaterialRequirementCsv } from '@/lib/services/inventory-export';
import {
  getMaterialRequirementReport,
  resolveRecipeForInventoryRow,
  type MaterialRequirementLine,
  type MaterialRequirementReport,
  type Recipe,
} from '@/lib/services/recipes-service';

type Row = Record<string, unknown>;

const CARD_CLS = 'premium-card premium-shadow rounded-xl border border-slate-200/80 bg-white p-3 md:p-4';

const MATERIAL_CATEGORY_COLORS: Record<string, string> = {
  Plastic: 'bg-blue-100 text-blue-700',
  Chemicals: 'bg-violet-100 text-violet-700',
  Packaging: 'bg-amber-100 text-amber-700',
  'Plastic Parts': 'bg-sky-100 text-sky-700',
  Electronics: 'bg-rose-100 text-rose-700',
  Hardware: 'bg-slate-100 text-slate-600',
};

function MaterialIcon({ category, compact = false }: { category: string; compact?: boolean }) {
  const color = MATERIAL_CATEGORY_COLORS[category] ?? 'bg-slate-100 text-slate-600';
  const size = compact ? 'w-6 h-6' : 'w-8 h-8';
  const iconSize = compact ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <span className={`${size} rounded-lg flex items-center justify-center shrink-0 ${color}`}>
      <Package className={iconSize} />
    </span>
  );
}

function formatQty(value: number, unit: string) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit}`;
}

type StockStatus = 'in-stock' | 'low' | 'out';

function getStockStatus(line: MaterialRequirementLine): StockStatus {
  if (line.totalOverallQty <= 0) return 'out';
  if (line.totalOverallQty < line.requiredForCurrentStock + line.effectiveQtyPerProduct) return 'low';
  return 'in-stock';
}

function StockStatusChip({ status }: { status: StockStatus }) {
  if (status === 'out') {
    return (
      <span className="inline-flex px-2.5 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-[10px] font-bold text-rose-700">
        Out of Stock
      </span>
    );
  }
  if (status === 'low') {
    return (
      <span className="inline-flex px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-700">
        Low Stock
      </span>
    );
  }
  return (
    <span className="inline-flex px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
      In Stock
    </span>
  );
}

function PageHeader({
  onBack,
  backLabel,
  onDownload,
}: {
  onBack: () => void;
  backLabel: string;
  onDownload?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="space-y-1">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {backLabel}
        </button>
        <div>
          <h1 className="text-lg font-extrabold text-blue-600 tracking-tight">
            Material Requirements (BOM vs Inventory)
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            See total raw materials in factory — loose inventory plus materials used in semi-finished and finished products.
          </p>
        </div>
      </div>
      {onDownload ? (
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex items-center gap-1.5 shrink-0 text-xs font-bold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 rounded-xl cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </button>
      ) : null}
    </div>
  );
}

function ProductStrip({
  name,
  code,
  sku,
  unit,
  currentStockQty,
  recipe,
  report,
}: {
  name: string;
  code: string;
  sku: string;
  unit: string;
  currentStockQty: number;
  recipe: Recipe;
  report: MaterialRequirementReport;
}) {
  return (
    <div className="border-b border-slate-100 pb-3 mb-3">
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <h2 className="font-extrabold text-slate-900">{name}</h2>
        <span className="bg-violet-100 text-violet-700 text-[10px] font-bold px-2 py-0.5 rounded-md">{code}</span>
      </div>
      {sku ? (
        <p className="text-[11px] font-semibold text-slate-500 mb-2">SKU: {sku} · Unit: {unit}</p>
      ) : null}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
          <span className="text-[10px] font-bold uppercase text-slate-500 block">Current Stock</span>
          <p className="text-sm font-extrabold text-slate-900 mt-0.5">{currentStockQty.toLocaleString()} {unit}</p>
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
          <span className="text-[10px] font-bold uppercase text-slate-500 block">Linked BOM</span>
          <p className="text-sm font-extrabold text-slate-900 mt-0.5">{recipe.recipeNumber}</p>
        </div>
        <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
          <span className="text-[10px] font-bold uppercase text-blue-600 block">Max Total Possible</span>
          <p className="text-sm font-extrabold text-blue-700 mt-0.5">{report.maxTotalUnits.toLocaleString()} {unit}</p>
        </div>
        <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2">
          <span className="text-[10px] font-bold uppercase text-emerald-600 block">Max Additional</span>
          <p className="text-sm font-extrabold text-emerald-700 mt-0.5">{report.maxAdditionalUnits.toLocaleString()} {unit}</p>
        </div>
        <div className="rounded-lg bg-rose-50 border border-rose-100 px-3 py-2 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase text-rose-600 block">Limiting Material</span>
          <p className="text-sm font-extrabold text-rose-700 mt-0.5 truncate">{report.limitingMaterialName}</p>
        </div>
      </div>
    </div>
  );
}

function MaterialOverallSummarySection({ lines }: { lines: MaterialRequirementLine[] }) {
  if (!lines.length) return null;

  return (
    <div className="mb-3 rounded-xl border border-blue-200/60 bg-gradient-to-br from-blue-50/50 to-orange-50/30 p-3">
      <div className="mb-2">
        <h3 className="text-sm font-extrabold text-slate-900">Factory Raw Material Total</h3>
        <p className="text-xs font-semibold text-slate-500 mt-0.5">
          Raw Inventory + Used in Semi-Finished + Used in Finished Goods = Total in Factory
        </p>
      </div>

      <div className="space-y-2">
        {lines.map((line) => (
          <div
            key={`${line.materialId}-${line.name}`}
            className={`rounded-lg border bg-white px-3 py-2.5 ${
              line.isLimiting ? 'border-rose-200 border-l-4 border-l-rose-500' : 'border-slate-200'
            }`}
          >
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <MaterialIcon category={line.category} compact />
                <div>
                  <span className="text-sm font-extrabold text-slate-900">{line.name}</span>
                  {line.isLimiting ? (
                    <span className="ml-2 inline-flex px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-[10px] font-bold text-rose-700">
                      Limiting
                    </span>
                  ) : null}
                  <p className="text-[10px] font-semibold text-slate-400">{line.category}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600 lg:justify-end">
                <span className="rounded-md bg-slate-50 border border-slate-100 px-2 py-1 whitespace-nowrap">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Raw Inventory</span>
                  {formatQty(line.rawQty, line.unit)}
                </span>
                <span className="text-slate-300 font-bold">+</span>
                <span className="rounded-md bg-slate-50 border border-slate-100 px-2 py-1 whitespace-nowrap">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">In Semi-Finished</span>
                  {formatQty(line.inSemiFinishedQty, line.unit)}
                </span>
                <span className="text-slate-300 font-bold">+</span>
                <span className="rounded-md bg-slate-50 border border-slate-100 px-2 py-1 whitespace-nowrap">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">In Finished Goods</span>
                  {formatQty(line.inFinishedGoodsQty, line.unit)}
                </span>
                <span className="text-slate-300 font-bold">=</span>
                <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-1 whitespace-nowrap">
                  <span className="text-[10px] font-bold uppercase text-blue-600 block">Total in Factory</span>
                  <span className="text-sm font-extrabold text-blue-700">{formatQty(line.totalOverallQty, line.unit)}</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function InventoryMaterialRequirementView({
  variant,
  row,
  appState,
  onBack,
  backLabel = 'Back to Inventory',
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
  const currentStockQty = Number(row.quantity ?? 0);
  const unit = String(row.unit ?? 'pcs');

  const [linkRecipeId, setLinkRecipeId] = useState('');

  const recipe = useMemo(
    () => resolveRecipeForInventoryRow(appState, {
      id: row.id as string | number,
      sku: String(row.sku ?? ''),
      name: String(row.name ?? ''),
      recipeId: row.recipeId as string | number | undefined,
    }),
    [appState, row.id, row.name, row.sku, row.recipeId],
  );

  const report = useMemo(
    () => (recipe ? getMaterialRequirementReport(appState, recipe, currentStockQty) : null),
    [appState, recipe, currentStockQty],
  );

  const columns = useMemo<AppTableColumn<MaterialRequirementLine>[]>(() => [
    {
      key: 'material',
      label: 'Raw Material',
      render: (line) => (
        <div className="flex items-center gap-2.5 min-w-[140px]">
          <MaterialIcon category={line.category} compact />
          <span className="min-w-0">
            <span className="font-semibold text-slate-800 block">{line.name}</span>
            <span className="text-[10px] font-semibold text-slate-500">{line.category}</span>
          </span>
        </div>
      ),
    },
    {
      key: 'required',
      label: 'Required Per Unit',
      render: (line) => (
        <span className="font-bold text-slate-800 whitespace-nowrap">
          {formatQty(line.effectiveQtyPerProduct, line.unit)}
        </span>
      ),
    },
    {
      key: 'usedInStock',
      label: 'Used in Current Stock',
      render: (line) => (
        <span className="font-bold text-slate-700 whitespace-nowrap">
          {formatQty(line.requiredForCurrentStock, line.unit)}
        </span>
      ),
    },
    {
      key: 'maxAdditional',
      label: 'Max Additional Units',
      render: (line) => (
        <span className={`font-bold whitespace-nowrap ${line.isLimiting ? 'text-rose-600' : 'text-slate-700'}`}>
          {line.maxAdditionalUnitsFromMaterial.toLocaleString()} {unit}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (line) => <StockStatusChip status={getStockStatus(line)} />,
    },
  ], [unit]);

  if (!recipe) {
    return (
      <div className={`${MODULE_LIST_SHELL} bg-slate-50`}>
        <div className="w-full space-y-2">
          <PageHeader onBack={onBack} backLabel={backLabel} />
          <div className={`${CARD_CLS} flex flex-col items-center justify-center text-center py-10 px-4 max-w-md mx-auto`}>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
              <Layers className="w-7 h-7" />
            </span>
            <h3 className="font-extrabold text-slate-900">No BOM linked</h3>
            <p className="text-xs text-slate-500 mt-2">
              Link a Bill of Materials to view raw material requirements for <span className="font-bold">{name}</span>.
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
                Link BOM &amp; View Requirements
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

  if (!report) return null;

  return (
    <div className={`${MODULE_LIST_SHELL} bg-slate-50`}>
      <div className="w-full space-y-2">
        <PageHeader
          onBack={onBack}
          backLabel={backLabel}
          onDownload={() => downloadMaterialRequirementCsv(report, name)}
        />

        <div className={`${CARD_CLS} !p-0 overflow-hidden`}>
          <div className="p-3 md:p-4">
            <ProductStrip
              name={name}
              code={code}
              sku={sku}
              unit={unit}
              currentStockQty={currentStockQty}
              recipe={recipe}
              report={report}
            />

            {report.lines.length > 0 ? (
              <MaterialOverallSummarySection lines={report.lines} />
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-8 text-center">
                <Package className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No materials in this recipe</p>
                <p className="text-xs text-slate-500 mt-1">Add BOM lines in Purchases → Recipes.</p>
              </div>
            )}
          </div>

          {report.lines.length > 0 ? (
            <>
              <div className="border-t border-slate-100 px-3 md:px-4 pt-3 pb-2 bg-slate-50/50">
                <h3 className="text-sm font-extrabold text-slate-900">BOM Details</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Per-unit requirements and how many more units you can make from total factory material.
                </p>
              </div>
              <AppTable
                columns={columns}
                rows={report.lines}
                emptyMessage="No materials found."
              />
              <div className="px-3 md:px-4 pb-3 md:pb-4">
                <p className="text-[11px] font-semibold text-slate-500">
                  Factory totals (Raw + Semi-Finished + Finished Goods) are shown in the summary above. Max Additional = total factory material minus your current stock ({currentStockQty.toLocaleString()} {unit}).
                </p>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
