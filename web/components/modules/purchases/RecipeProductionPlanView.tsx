'use client';

import { toast } from '@/lib/ui/feedback';

import { useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { Download } from 'lucide-react';
import { FormHeader } from '@/components/layout/FormHeader';
import { Footer } from '@/components/layout/Footer';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { ProductionPlanExportModal } from '@/components/modules/purchases/ProductionPlanExportModal';
import {
  downloadProductionPlanPdf,
  type ProductionPlanPdfOptions,
} from '@/lib/services/export-production-plan-pdf';
import { formatAmount } from '@/lib/services/domain-service';
import {
  formatMoney,
  getProductionPlan,
  type ProductionPlanLine,
  type Recipe,
} from '@/lib/services/recipes-service';
import type { AppState } from '@/lib/state/types';

interface RecipeProductionPlanViewProps {
  recipe: Recipe;
  batchQty: number;
  appState: AppState;
  onBack: () => void;
  onEditQty: () => void;
}

function PlanStatusChip({ line }: { line: ProductionPlanLine }) {
  if (!line.insight.inInventory) {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-[10px] font-bold text-rose-800">
        Not in inventory
      </span>
    );
  }
  if (line.shortfallQty > 0) {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-md bg-orange-50 border border-orange-200 text-[10px] font-bold text-orange-800">
        Short
      </span>
    );
  }
  return (
    <span className="inline-flex px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-800">
      OK
    </span>
  );
}

function SupplierCell({ line }: { line: ProductionPlanLine }) {
  const { insight, shortfallQty, unit } = line;
  if (shortfallQty <= 0 && insight.inInventory && !insight.insufficientForBom) {
    return <span className="text-[11px] font-semibold text-slate-400">—</span>;
  }

  if (!insight.showSupplierSuggestions || !insight.supplierOffers.length) {
    if (insight.recommendedSupplier) {
      return (
        <span className="text-[11px] font-semibold text-blue-700">{insight.recommendedSupplier}</span>
      );
    }
    return <span className="text-[11px] font-semibold text-slate-400">No supplier data</span>;
  }

  return (
    <div className="space-y-0.5 min-w-[120px]">
      {insight.supplierOffers.slice(0, 3).map((offer) => (
        <p
          key={offer.supplierId}
          className={`text-[10px] font-semibold leading-snug ${
            offer.supplierName === insight.recommendedSupplier ? 'text-blue-700' : 'text-slate-600'
          }`}
        >
          {offer.supplierName === insight.recommendedSupplier ? '★ ' : ''}
          {offer.supplierName} · {offer.availableQty} {unit} · {formatMoney(offer.price)}
        </p>
      ))}
    </div>
  );
}

export function RecipeProductionPlanView({
  recipe,
  batchQty,
  appState,
  onBack,
  onEditQty,
}: RecipeProductionPlanViewProps) {
  const plan = useMemo(() => getProductionPlan(appState, recipe, batchQty), [appState, recipe, batchQty]);
  const { lines, summary } = plan;
  const [exporting, setExporting] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const handleExportPdf = async (options: ProductionPlanPdfOptions) => {
    setExporting(true);
    try {
      await downloadProductionPlanPdf(recipe, batchQty, plan, options);
      setExportModalOpen(false);
    } catch {
      toast.error('Action required', { module: 'Purchases', description: "Failed to generate PDF. Please try again." });
    } finally {
      setExporting(false);
    }
  };

  const columns = useMemo<AppTableColumn<ProductionPlanLine>[]>(
    () => [
      {
        key: 'material',
        label: 'Material',
        render: (row) => (
          <div className="min-w-[120px]">
            <span className="font-semibold text-slate-800 block">{row.name}</span>
            <span className="text-[10px] font-semibold text-slate-500">{row.category}</span>
          </div>
        ),
      },
      {
        key: 'required',
        label: 'Required',
        render: (row) => (
          <span className="font-bold text-slate-800">
            {row.requiredQty.toLocaleString(undefined, { maximumFractionDigits: 2 })} {row.unit}
          </span>
        ),
      },
      {
        key: 'unitCost',
        label: 'Unit Cost (tk)',
        render: (row) => (
          <span className="font-semibold text-slate-800 tabular-nums">{formatAmount(row.unitCost)}</span>
        ),
      },
      {
        key: 'lineCost',
        label: 'Total Cost (tk)',
        render: (row) => (
          <span className="font-bold text-slate-800 tabular-nums">{formatAmount(row.lineCost)}</span>
        ),
      },
      {
        key: 'inStock',
        label: 'In Stock',
        render: (row) => (
          <span className={row.shortfallQty > 0 ? 'text-orange-700 font-semibold' : 'text-emerald-700 font-semibold'}>
            {row.inStockQty.toLocaleString(undefined, { maximumFractionDigits: 2 })} {row.unit}
          </span>
        ),
      },
      {
        key: 'shortfall',
        label: 'Shortfall',
        render: (row) =>
          row.shortfallQty > 0 ? (
            <span className="font-bold text-rose-700">
              {row.shortfallQty.toLocaleString(undefined, { maximumFractionDigits: 2 })} {row.unit}
            </span>
          ) : (
            <span className="text-slate-400">—</span>
          ),
      },
      {
        key: 'status',
        label: 'Status',
        render: (row) => <PlanStatusChip line={row} />,
      },
      {
        key: 'supplier',
        label: 'Supplier',
        render: (row) => <SupplierCell line={row} />,
      },
    ],
    [],
  );

  return (
    <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 flex flex-col">
      <FormHeader
        title={`Production Plan — ${batchQty.toLocaleString()} × ${recipe.product}`}
        subtitle={`${recipe.model} · ${recipe.recipeNumber} · BOM ${recipe.version}`}
        onBack={onBack}
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="premium-card premium-shadow p-3.5 flex items-center justify-between gap-3 transition-all hover:border-slate-300 min-h-[72px]">
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-500 tracking-wide block">Total Material Cost (tk)</span>
            <span className="text-lg font-extrabold text-slate-900 leading-tight truncate tabular-nums">
              {formatAmount(summary.totalLineCost)}
            </span>
          </div>
          <Icon icon="flat-color-icons:currency-exchange" width={38} height={38} className="shrink-0" />
        </div>
        <div className="premium-card premium-shadow p-3.5 flex items-center justify-between gap-3 transition-all hover:border-slate-300 min-h-[72px]">
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-500 tracking-wide block">In Stock OK</span>
            <span className="text-lg font-extrabold text-emerald-700 leading-tight">{summary.materialsFullyInStock}</span>
          </div>
          <Icon icon="fluent-color:checkmark-circle-24" width={38} height={38} className="shrink-0" />
        </div>
        <div className="premium-card premium-shadow p-3.5 flex items-center justify-between gap-3 transition-all hover:border-slate-300 min-h-[72px]">
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-500 tracking-wide block">Short Items</span>
            <span className="text-lg font-extrabold text-rose-700 leading-tight">{summary.materialsShort}</span>
          </div>
          <Icon icon="fluent-color:alert-badge-24" width={38} height={38} className="shrink-0" />
        </div>
        <div className="premium-card premium-shadow p-3.5 flex items-center justify-between gap-3 transition-all hover:border-slate-300 min-h-[72px]">
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-500 tracking-wide block">Est. Purchase (Shortfall) (tk)</span>
            <span className="text-lg font-extrabold text-slate-900 leading-tight truncate tabular-nums">
              {formatAmount(summary.estimatedPurchaseForShortfall)}
            </span>
          </div>
          <Icon icon="flat-color-icons:paid" width={38} height={38} className="shrink-0" />
        </div>
      </section>

      <AppTable<ProductionPlanLine>
        columns={columns}
        rows={lines}
        rowKey={(row) => row.materialId}
        emptyMessage="No materials in this BOM."
      />

      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => setExportModalOpen(true)}
          disabled={exporting}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          {exporting ? 'Exporting…' : 'Export PDF'}
        </button>
        <button
          type="button"
          onClick={onEditQty}
          className="px-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold cursor-pointer transition-colors"
        >
          Edit Quantity
        </button>
      </div>

      <ProductionPlanExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExport={handleExportPdf}
        exporting={exporting}
      />

      <Footer />
    </div>
  );
}
