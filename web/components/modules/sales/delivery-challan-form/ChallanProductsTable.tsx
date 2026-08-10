'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { DeliveryChallanLineItem } from '@/components/modules/sales/delivery-challan-form/dc-form-types';
import { computeLineRemaining, summarizeChallanItems } from '@/components/modules/sales/delivery-challan-form/dc-form-types';
import { CHALLAN_PRODUCT_CATALOG } from '@/components/modules/sales/delivery-challan-form/dc-form-options';
import { DC_TABLE_FOOTER_CLS } from '@/components/modules/sales/delivery-challan-form/dc-form-styles';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

export function ChallanProductsTable({
  items,
  onChange,
  error,
}: {
  items: DeliveryChallanLineItem[];
  onChange: (items: DeliveryChallanLineItem[]) => void;
  error?: string;
}) {
  const { formatCount } = useLocaleFormat();
  const { totalItems, totalDeliverQty } = summarizeChallanItems(items);

  const updateItem = (id: string, patch: Partial<DeliveryChallanLineItem>) => {
    onChange(
      items.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, ...patch };
        next.remainingQty = computeLineRemaining(next);
        return next;
      }),
    );
  };

  const removeItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const addItem = () => {
    const catalog = CHALLAN_PRODUCT_CATALOG[0];
    onChange([
      ...items,
      {
        id: `line-${Date.now()}`,
        productId: catalog?.id ?? '',
        productName: catalog?.name ?? '',
        sku: catalog?.sku ?? '',
        imageUrl: catalog?.imageUrl ?? '/images/logo-toys.png',
        orderedQty: 0,
        previouslyDelivered: 0,
        deliverNow: 0,
        remainingQty: 0,
        unit: catalog?.unit ?? 'Pcs',
      },
    ]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h5 className="text-xs font-extrabold text-slate-800">Products</h5>
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-1.5 text-blue-700 hover:text-blue-800 text-xs font-bold cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white/70">
        <table className="min-w-[960px] w-full text-xs">
          <thead>
            <tr className="bg-slate-50/90 text-[10px] font-bold uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="px-3 py-2.5 text-left w-10">#</th>
              <th className="px-3 py-2.5 text-left">Product</th>
              <th className="px-3 py-2.5 text-left">SKU / Code</th>
              <th className="px-3 py-2.5 text-right">Ordered Qty</th>
              <th className="px-3 py-2.5 text-right">Previously Delivered</th>
              <th className="px-3 py-2.5 text-right">Deliver Now *</th>
              <th className="px-3 py-2.5 text-right">Remaining Qty</th>
              <th className="px-3 py-2.5 text-left">Unit</th>
              <th className="px-3 py-2.5 text-center w-14">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-slate-500 font-semibold">
                  Select a sales order to load products, or add items manually.
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-3 py-2.5 font-bold text-slate-500">{index + 1}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2 min-w-[180px]">
                      <img
                        src={item.imageUrl || '/images/logo-toys.png'}
                        alt=""
                        className="w-8 h-8 rounded-lg border border-slate-200 object-cover shrink-0"
                      />
                      <select
                        value={item.productId}
                        onChange={(e) => {
                          const product = CHALLAN_PRODUCT_CATALOG.find((p) => p.id === e.target.value);
                          if (!product) return;
                          updateItem(item.id, {
                            productId: product.id,
                            productName: product.name,
                            sku: product.sku,
                            imageUrl: product.imageUrl,
                            unit: product.unit,
                          });
                        }}
                        className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold cursor-pointer"
                      >
                        {CHALLAN_PRODUCT_CATALOG.map((product) => (
                          <option key={product.id} value={product.id}>{product.name}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-slate-700">{item.sku}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-slate-700">{formatCount(item.orderedQty)}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-slate-600">{formatCount(item.previouslyDelivered)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <input
                      type="number"
                      min={0}
                      value={item.deliverNow}
                      onChange={(e) => updateItem(item.id, { deliverNow: Number(e.target.value || 0) })}
                      className="w-24 ml-auto px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                    />
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-emerald-600">{formatCount(item.remainingQty)}</td>
                  <td className="px-3 py-2.5 font-semibold text-slate-600">{item.unit}</td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className={DC_TABLE_FOOTER_CLS}>
          <span>Total Items: <strong className="text-slate-800">{totalItems}</strong></span>
          <span>
            Total Deliver Now Qty:{' '}
            <strong className="text-emerald-700">{formatCount(totalDeliverQty)} Pcs</strong>
          </span>
        </div>
      </div>
      {error ? <p className="text-[10px] font-semibold text-rose-600">{error}</p> : null}
    </div>
  );
}
