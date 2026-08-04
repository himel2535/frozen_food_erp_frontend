'use client';

import { Copy, Plus, Search, Trash2 } from 'lucide-react';
import { INVOICE_TAX_OPTIONS } from '@/components/modules/sales/invoice-form/inv-form-options';
import {
  INV_ADD_ROW_CLS,
  INV_INPUT_CLS,
  INV_TABLE_HEAD_CLS,
} from '@/components/modules/sales/invoice-form/inv-form-styles';
import {
  createEmptyLineItem,
  recalcLineItem,
  type InvoiceLineItem,
} from '@/components/modules/sales/invoice-form/inv-form-types';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

export function InvoiceItemsTable({
  items,
  productOptions,
  onChange,
  onAddItem,
  error,
}: {
  items: InvoiceLineItem[];
  productOptions: Array<{ id: string; name: string; sku?: string; price?: number }>;
  onChange: (items: InvoiceLineItem[]) => void;
  onAddItem?: () => void;
  error?: string;
}) {
  const { formatMoney } = useLocaleFormat();
  const updateItem = (id: string, patch: Partial<InvoiceLineItem>) => {
    onChange(items.map((item) => (item.id === id ? recalcLineItem({ ...item, ...patch }) : item)));
  };

  const removeItem = (id: string) => {
    const next = items.filter((i) => i.id !== id);
    onChange(next.length ? next : [createEmptyLineItem()]);
  };

  const copyItem = (id: string) => {
    const source = items.find((i) => i.id === id);
    if (!source) return;
    const copy = recalcLineItem({
      ...source,
      id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    });
    const idx = items.findIndex((i) => i.id === id);
    const next = [...items];
    next.splice(idx + 1, 0, copy);
    onChange(next);
  };

  const addRow = () => {
    if (onAddItem) {
      onAddItem();
      return;
    }
    onChange([...items, createEmptyLineItem()]);
  };

  const pickProduct = (id: string, productId: string) => {
    const product = productOptions.find((p) => p.id === productId);
    if (!product) return;
    updateItem(id, {
      productId: product.id,
      description: product.name,
      rate: Number(product.price ?? 0),
    });
  };

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-xs min-w-[960px]">
          <thead>
            <tr className={INV_TABLE_HEAD_CLS}>
              <th className="px-3 py-2.5 text-left w-10">#</th>
              <th className="px-3 py-2.5 text-left min-w-[220px]">Item / Description</th>
              <th className="px-3 py-2.5 text-left w-20">Qty</th>
              <th className="px-3 py-2.5 text-left w-28">Rate (৳)</th>
              <th className="px-3 py-2.5 text-left w-24">Discount</th>
              <th className="px-3 py-2.5 text-left w-28">Tax</th>
              <th className="px-3 py-2.5 text-right w-28">Amount (৳)</th>
              <th className="px-3 py-2.5 text-center w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const filteredProducts = productOptions.filter((p) => {
                const q = item.description.toLowerCase();
                if (!q) return true;
                return `${p.name} ${p.sku}`.toLowerCase().includes(q);
              });
              const calc = recalcLineItem(item);
              return (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-500 font-semibold">{index + 1}</td>
                  <td className="px-3 py-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        list={`inv-products-${item.id}`}
                        value={item.description}
                        onChange={(e) => updateItem(item.id, { description: e.target.value, productId: '' })}
                        placeholder="Search item or enter description"
                        className={`${INV_INPUT_CLS} pl-8`}
                      />
                      <datalist id={`inv-products-${item.id}`}>
                        {filteredProducts.slice(0, 30).map((p) => (
                          <option key={p.id} value={p.name} />
                        ))}
                      </datalist>
                    </div>
                    {filteredProducts.length > 0 && item.description && !item.productId ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {filteredProducts.slice(0, 3).map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => pickProduct(item.id, p.id)}
                            className="px-2 py-0.5 rounded-lg bg-blue-50 text-[10px] font-semibold text-blue-700 hover:bg-blue-100 cursor-pointer"
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={item.qty}
                      onChange={(e) => updateItem(item.id, { qty: Number(e.target.value) })}
                      className={`${INV_INPUT_CLS} w-16`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.rate}
                      onChange={(e) => updateItem(item.id, { rate: Number(e.target.value) })}
                      className={`${INV_INPUT_CLS} w-24`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        value={item.discountPct}
                        onChange={(e) => updateItem(item.id, { discountPct: Number(e.target.value) })}
                        className={`${INV_INPUT_CLS} w-16 pr-6`}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={item.taxLabel}
                      onChange={(e) => updateItem(item.id, { taxLabel: e.target.value })}
                      className={`${INV_INPUT_CLS} cursor-pointer appearance-none`}
                    >
                      {INVOICE_TAX_OPTIONS.map((opt) => (
                        <option key={opt.label} value={opt.label}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-slate-800">
                    {formatMoney(calc.amount, { decimals: 2 })}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        title="Copy row"
                        onClick={() => copyItem(item.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Delete row"
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="px-3 py-2 border-t border-slate-100 bg-white">
          <button type="button" onClick={addRow} className={INV_ADD_ROW_CLS}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Another Item
          </button>
        </div>
      </div>

      {error ? <p className="mt-2 text-[10px] font-semibold text-rose-600">{error}</p> : null}
    </div>
  );
}
