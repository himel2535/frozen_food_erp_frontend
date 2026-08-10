'use client';

import { useRef } from 'react';
import { Barcode, Grid3X3, List, Search } from 'lucide-react';
import { POS_CATEGORIES } from './pos-utils';
import type { PosCategoryId, PosProduct } from './pos-types';

export function PosProductPanel({
  products,
  search,
  category,
  viewMode,
  barcodeMode,
  formatMoney,
  formatNumber,
  labels,
  onSearchChange,
  onSearchKeyDown,
  onCategoryChange,
  onViewModeChange,
  onAdd,
  onBarcodeClick,
}: {
  products: PosProduct[];
  search: string;
  category: PosCategoryId;
  viewMode: 'grid' | 'list';
  barcodeMode?: boolean;
  formatMoney: (n: number) => string;
  formatNumber: (n: number) => string;
  labels: Record<string, string>;
  onSearchChange: (v: string) => void;
  onSearchKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onCategoryChange: (v: PosCategoryId) => void;
  onViewModeChange: (v: 'grid' | 'list') => void;
  onAdd: (product: PosProduct) => void;
  onBarcodeClick?: () => void;
}) {
  const searchRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col min-h-0 flex-1 gap-3">
      <div className="relative shrink-0">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          ref={searchRef}
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={onSearchKeyDown}
          placeholder={barcodeMode ? 'Scan barcode or type SKU, then press Enter...' : labels.searchPlaceholder}
          className={`w-full pl-10 pr-12 py-2.5 rounded-xl border text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-400/60 ${
            barcodeMode
              ? 'border-sky-300/80 bg-sky-50/70 ring-2 ring-sky-200/50'
              : 'border-blue-100/70 bg-white/70'
          }`}
        />
        <button
          type="button"
          onClick={() => {
            onBarcodeClick?.();
            searchRef.current?.focus();
          }}
          className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg inline-flex items-center justify-center cursor-pointer transition-colors ${
            barcodeMode ? 'bg-sky-100 text-sky-700' : 'text-slate-400 hover:bg-slate-100'
          }`}
          title="Barcode scanner"
        >
          <Barcode className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex flex-wrap items-center gap-1.5">
          {POS_CATEGORIES.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onCategoryChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                category === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white/70 text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {labels[tab.labelKey] ?? tab.fallback}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-xl border border-slate-200/80 bg-white/70 p-0.5 shrink-0">
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
              viewMode === 'grid' ? 'bg-blue-50 text-blue-700' : 'text-slate-500'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" /> {labels.gridView}
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
              viewMode === 'list' ? 'bg-blue-50 text-blue-700' : 'text-slate-500'
            }`}
          >
            <List className="w-3.5 h-3.5" /> {labels.listView}
          </button>
        </div>
      </div>

      <div className={`flex-1 min-h-0 overflow-y-auto pr-1 ${viewMode === 'grid' ? 'grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 auto-rows-max content-start' : 'space-y-2'}`}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            viewMode={viewMode}
            formatMoney={formatMoney}
            formatNumber={formatNumber}
            labels={labels}
            onAdd={() => onAdd(product)}
          />
        ))}
        {products.length === 0 ? (
          <p className="col-span-full text-center text-xs text-slate-400 py-10">{labels.noProducts}</p>
        ) : null}
      </div>
    </div>
  );
}

function ProductCard({
  product,
  viewMode,
  formatMoney,
  formatNumber,
  labels,
  onAdd,
}: {
  product: PosProduct;
  viewMode: 'grid' | 'list';
  formatMoney: (n: number) => string;
  formatNumber: (n: number) => string;
  labels: Record<string, string>;
  onAdd: () => void;
}) {
  const outOfStock = product.stock <= 0;

  if (viewMode === 'list') {
    return (
      <div className="flex items-center gap-3 premium-card premium-shadow p-3 bg-white/80">
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${product.imageGradient} flex items-center justify-center text-2xl shrink-0`}>
          {product.imageEmoji}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-slate-800 truncate">{product.name}</p>
          <p className="text-[10px] text-slate-400">{product.sku}</p>
          <p className="text-[10px] font-semibold text-emerald-600 mt-0.5">
            {labels.inStock}: {formatNumber(product.stock)}
          </p>
        </div>
        <div className="text-right shrink-0 w-[5.5rem]">
          <p className="text-sm font-extrabold text-blue-600 tabular-nums truncate">{formatMoney(product.price)}</p>
          <button
            type="button"
            disabled={outOfStock}
            onClick={onAdd}
            className="mt-1 w-full inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-45 disabled:cursor-not-allowed text-white text-[11px] font-bold cursor-pointer"
          >
            + {labels.add}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-card premium-shadow bg-white/85 p-3 flex flex-col">
      <div className={`aspect-[4/3] rounded-xl bg-gradient-to-br ${product.imageGradient} flex items-center justify-center text-5xl mb-3`}>
        {product.imageEmoji}
      </div>
      <p className="text-xs font-bold text-slate-800 leading-snug min-h-[2rem]">{product.name}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{product.sku}</p>
      <p className="text-[10px] font-semibold text-emerald-600 mt-1">
        {labels.inStock}: {formatNumber(product.stock)}
      </p>
      <div className="mt-auto pt-3 grid grid-cols-[minmax(0,1fr)_5.25rem] gap-2 items-center">
        <p className="text-sm font-extrabold text-blue-600 tabular-nums truncate min-w-0">{formatMoney(product.price)}</p>
        <button
          type="button"
          disabled={outOfStock}
          onClick={onAdd}
          className="w-full inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-45 disabled:cursor-not-allowed text-white text-[11px] font-bold cursor-pointer"
        >
          + {labels.add}
        </button>
      </div>
    </div>
  );
}
