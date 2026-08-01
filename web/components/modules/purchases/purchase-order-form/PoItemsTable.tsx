'use client';

import { Copy, Plus, Search, Trash2 } from 'lucide-react';
import { PO_TAX_OPTIONS } from '@/components/modules/purchases/purchase-order-form/po-form-options';
import {
  PO_ADD_ROW_CLS,
  PO_CELL_INPUT_CLS,
  PO_CELL_SELECT_CLS,
  PO_TABLE_HEAD_CLS,
} from '@/components/modules/purchases/purchase-order-form/po-form-styles';
import {
  createEmptyPoLineItem,
  type PoLineItem,
} from '@/components/modules/purchases/purchase-order-form/po-form-types';
import { recalcPoLineItem } from '@/lib/services/purchases-service';
import { formatMoney } from '@/lib/services/purchases-service';

const UNITS = ['pcs', 'kg', 'liter', 'box', 'meter', 'set'];

export function PoItemsTable({
  items,
  productOptions,
  onChange,
  onAddItem,
  error,
}: {
  items: PoLineItem[];
  productOptions: Array<{ id: string; name: string; sku?: string; price?: number; unit?: string }>;
  onChange: (items: PoLineItem[]) => void;
  onAddItem?: () => void;
  error?: string;
}) {
  const updateItem = (id: string, patch: Partial<PoLineItem>) => {
    onChange(items.map((item) => (item.id === id ? recalcPoLineItem({ ...item, ...patch }) : item)));
  };

  const removeItem = (id: string) => {
    const next = items.filter((i) => i.id !== id);
    onChange(next.length ? next : [createEmptyPoLineItem()]);
  };

  const copyItem = (id: string) => {
    const source = items.find((i) => i.id === id);
    if (!source) return;
    const copy = recalcPoLineItem({
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
    onChange([...items, createEmptyPoLineItem()]);
  };

  const pickProduct = (id: string, productId: string) => {
    const product = productOptions.find((p) => p.id === productId);
    if (!product) return;
    updateItem(id, {
      productId: product.id,
      description: product.name,
      rate: Number(product.price ?? 0),
      unit: product.unit ?? 'pcs',
    });
  };

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full table-fixed text-xs min-w-[880px]">
          <colgroup>
            <col style={{ width: '36px' }} />
            <col style={{ width: '30%' }} />
            <col style={{ width: '72px' }} />
            <col style={{ width: '72px' }} />
            <col style={{ width: '88px' }} />
            <col style={{ width: '80px' }} />
            <col style={{ width: '100px' }} />
            <col style={{ width: '88px' }} />
            <col style={{ width: '64px' }} />
          </colgroup>
          <thead>
            <tr className={PO_TABLE_HEAD_CLS}>
              <th className="px-2 py-2.5 text-left">#</th>
              <th className="px-2 py-2.5 text-left">Item / Description</th>
              <th className="px-2 py-2.5 text-left">Qty</th>
              <th className="px-2 py-2.5 text-left">Unit</th>
              <th className="px-2 py-2.5 text-left">Rate (৳)</th>
              <th className="px-2 py-2.5 text-left">Discount</th>
              <th className="px-2 py-2.5 text-left">Tax</th>
              <th className="px-2 py-2.5 text-right">Amount (৳)</th>
              <th className="px-2 py-2.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const filteredProducts = productOptions.filter((p) => {
                const q = item.description.toLowerCase();
                if (!q) return true;
                return `${p.name} ${p.sku}`.toLowerCase().includes(q);
              });
              const selectedProduct = item.productId
                ? productOptions.find((p) => p.id === item.productId)
                : null;
              const calc = recalcPoLineItem(item);
              return (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-2 py-2 text-slate-500 font-semibold align-top">{index + 1}</td>
                  <td className="px-2 py-2 align-top">
                    <div className="max-w-[280px]">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          list={`po-products-${item.id}`}
                          value={item.description}
                          onChange={(e) => updateItem(item.id, { description: e.target.value, productId: '' })}
                          placeholder="Search or type item"
                          className={`${PO_CELL_INPUT_CLS} pl-7 text-xs`}
                        />
                        <datalist id={`po-products-${item.id}`}>
                          {filteredProducts.slice(0, 30).map((p) => (
                            <option key={p.id} value={p.name} />
                          ))}
                        </datalist>
                      </div>
                      {selectedProduct?.sku ? (
                        <p className="mt-1 text-[10px] text-slate-400 font-medium truncate">
                          SKU: {selectedProduct.sku}
                        </p>
                      ) : null}
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
                    </div>
                  </td>
                  <td className="px-2 py-2 align-top">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={item.qty || ''}
                      onChange={(e) =>
                        updateItem(item.id, { qty: e.target.value === '' ? 0 : Number(e.target.value) })
                      }
                      className={PO_CELL_INPUT_CLS}
                    />
                  </td>
                  <td className="px-2 py-2 align-top">
                    <select
                      value={item.unit}
                      onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                      className={PO_CELL_SELECT_CLS}
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2 align-top">
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.rate || ''}
                      onChange={(e) =>
                        updateItem(item.id, { rate: e.target.value === '' ? 0 : Number(e.target.value) })
                      }
                      className={PO_CELL_INPUT_CLS}
                    />
                  </td>
                  <td className="px-2 py-2 align-top">
                    <div className="flex items-center gap-1 min-w-0">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        value={item.discountPct || ''}
                        onChange={(e) =>
                          updateItem(item.id, {
                            discountPct: e.target.value === '' ? 0 : Number(e.target.value),
                          })
                        }
                        className={`${PO_CELL_INPUT_CLS} flex-1 min-w-0`}
                      />
                      <span className="text-[11px] text-slate-400 font-bold shrink-0">%</span>
                    </div>
                  </td>
                  <td className="px-2 py-2 align-top">
                    <select
                      value={item.taxLabel}
                      onChange={(e) => updateItem(item.id, { taxLabel: e.target.value })}
                      className={PO_CELL_SELECT_CLS}
                    >
                      {PO_TAX_OPTIONS.map((opt) => (
                        <option key={opt.label} value={opt.label}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2 text-right font-bold text-slate-800 align-top whitespace-nowrap">
                    {formatMoney(calc.amount)}
                  </td>
                  <td className="px-2 py-2 align-top">
                    <div className="flex items-center justify-center gap-0.5">
                      <button type="button" title="Copy row" onClick={() => copyItem(item.id)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" title="Delete row" onClick={() => removeItem(item.id)} className="p-1 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer">
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
          <button type="button" onClick={addRow} className={PO_ADD_ROW_CLS}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Another Item
          </button>
        </div>
      </div>
      {error ? <p className="mt-2 text-[10px] font-semibold text-rose-600">{error}</p> : null}
    </div>
  );
}
