'use client';

import { AlertTriangle, Info, Package, Star, Truck } from 'lucide-react';
import { formatMoney, type MaterialInsight, type SupplierOffer } from '@/lib/services/recipes-service';

interface BomMaterialInsightProps {
  insight: MaterialInsight;
  materialName: string;
  variant?: 'card' | 'compact';
  className?: string;
  onSelectSupplier?: (name: string) => void;
}

function StockChip({ insight }: { insight: MaterialInsight }) {
  if (!insight.inInventory) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-[10px] font-bold text-rose-800">
        <AlertTriangle className="w-3 h-3" />
        Not in inventory
      </span>
    );
  }
  if (insight.insufficientForBom) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-[10px] font-bold text-rose-800">
        <AlertTriangle className="w-3 h-3" />
        Need {insight.requiredQty} {insight.unit}, only {insight.availability} available
      </span>
    );
  }
  if (insight.stockStatus === 'out') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-[10px] font-bold text-rose-800">
        <AlertTriangle className="w-3 h-3" />
        Out of stock ({insight.availability} {insight.unit})
      </span>
    );
  }
  if (insight.stockStatus === 'low') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 border border-orange-200 text-[10px] font-bold text-orange-800">
        <AlertTriangle className="w-3 h-3" />
        Low stock: {insight.availability} {insight.unit}
      </span>
    );
  }
  if (insight.stockStatus === 'ok') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-800">
        <Package className="w-3 h-3" />
        {insight.availability} {insight.unit} · {formatMoney(insight.lastPrice)}
      </span>
    );
  }
  return null;
}

function SupplierOfferRow({
  offer,
  unit,
  isRecommended,
  onSelect,
}: {
  offer: SupplierOffer;
  unit: string;
  isRecommended: boolean;
  onSelect?: (name: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(offer.supplierName)}
      className={`w-full flex items-center justify-between gap-1 px-2 py-1.5 rounded-md text-left text-[10px] font-semibold border cursor-pointer transition-colors ${
        isRecommended
          ? 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
      }`}
    >
      <span className="inline-flex items-center gap-1 min-w-0 truncate">
        {isRecommended ? <Star className="w-3 h-3 shrink-0 fill-blue-500 text-blue-500" /> : <Truck className="w-3 h-3 shrink-0" />}
        <span className="truncate">{offer.supplierName}</span>
      </span>
      <span className="shrink-0 text-[9px] font-bold whitespace-nowrap">
        {offer.availableQty} {unit} · {formatMoney(offer.price)}
      </span>
    </button>
  );
}

function SupplierOffersList({
  insight,
  onSelectSupplier,
}: {
  insight: MaterialInsight;
  onSelectSupplier?: (name: string) => void;
}) {
  if (!insight.showSupplierSuggestions || !insight.supplierOffers.length) return null;

  return (
    <div className="space-y-1 pt-1 border-t border-slate-100">
      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Source from supplier</p>
      {insight.supplierOffers.slice(0, 3).map((offer) => (
        <SupplierOfferRow
          key={offer.supplierId}
          offer={offer}
          unit={insight.unit}
          isRecommended={offer.supplierName === insight.recommendedSupplier}
          onSelect={onSelectSupplier}
        />
      ))}
      {insight.recommendedSupplier && (
        <p className="text-[9px] font-semibold text-blue-600 pt-0.5">
          Suggested: {insight.recommendedSupplier}
        </p>
      )}
    </div>
  );
}

export function BomMaterialInsight({
  insight,
  materialName,
  variant = 'card',
  className = '',
  onSelectSupplier,
}: BomMaterialInsightProps) {
  if (variant === 'compact') {
    if (!materialName.trim()) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-500">
          <Info className="w-3 h-3" />
          Type a material for stock hints
        </span>
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
        <StockChip insight={insight} />
        {insight.code && (
          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600">
            {insight.code}
          </span>
        )}
        {insight.showSupplierSuggestions &&
          insight.supplierOffers.slice(0, 3).map((offer) => (
            <button
              key={offer.supplierId}
              type="button"
              onClick={() => onSelectSupplier?.(offer.supplierName)}
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md border text-[10px] font-bold cursor-pointer ${
                offer.supplierName === insight.recommendedSupplier
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
              }`}
            >
              <Truck className="w-2.5 h-2.5" />
              {offer.supplierName}
            </button>
          ))}
      </div>
    );
  }

  if (!materialName.trim()) {
    return (
      <div className={`rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-1.5 h-fit ${className}`.trim()}>
        <div className="flex items-center gap-2 text-slate-600">
          <Info className="w-4 h-4 shrink-0" />
          <span className="text-[10px] font-extrabold uppercase tracking-wide">Inventory Insight</span>
        </div>
        <p className="text-[11px] font-semibold text-slate-500 leading-snug">Select or type a material to see stock and supplier hints.</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-slate-200 bg-white/80 p-3 space-y-2 h-fit ${className}`.trim()}>
      <div className="flex items-center gap-2 text-slate-700">
        <Info className="w-4 h-4 shrink-0" />
        <span className="text-[10px] font-extrabold uppercase tracking-wide">Inventory Insight</span>
      </div>

      {!insight.inInventory && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-[11px] font-semibold text-rose-800 leading-snug">
          Not in your warehouse stock.{insight.code ? ' See supplier options below.' : ' Add manually or pick from inventory.'}
        </div>
      )}

      {insight.inInventory && insight.insufficientForBom && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-[11px] font-semibold text-rose-800 leading-snug">
          Your stock: {insight.availability} {insight.unit} — need {insight.requiredQty} {insight.unit} for this line. Source from a supplier below.
        </div>
      )}

      {insight.inInventory && !insight.insufficientForBom && insight.stockStatus === 'out' && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-[11px] font-semibold text-rose-800 leading-snug">
          Out of stock in your warehouse ({insight.availability} {insight.unit}). Check suppliers below.
        </div>
      )}

      {insight.inInventory && !insight.insufficientForBom && insight.stockStatus === 'low' && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-2 text-[11px] font-semibold text-orange-800 leading-snug">
          In your stock: {insight.availability} {insight.unit} (low). Last price {formatMoney(insight.lastPrice)}.
        </div>
      )}

      {insight.inInventory && !insight.insufficientForBom && insight.stockStatus === 'ok' && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-[11px] font-semibold text-emerald-800 leading-snug">
          In your stock: {insight.availability} {insight.unit} · {formatMoney(insight.lastPrice)}
        </div>
      )}

      {insight.code && (
        <p className="text-[10px] font-semibold text-slate-500">
          {insight.category} · {insight.code}
        </p>
      )}

      <SupplierOffersList insight={insight} onSelectSupplier={onSelectSupplier} />
    </div>
  );
}
