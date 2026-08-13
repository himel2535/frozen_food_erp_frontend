'use client';

import Link from 'next/link';
import { Plus, Search, Trash2 } from 'lucide-react';
import {
  PJ_ADD_ITEM_BTN_CLS,
  PJ_CELL_INPUT_CLS,
  PJ_TABLE_HEAD_CLS,
} from '@/components/modules/projects/project-form/project-form-styles';
import type { ProjectLineItem } from '@/components/modules/projects/project-form/project-form-types';
import {
  createEmptyProjectLineItem,
  formatProjectMoney,
  recalcProjectLineItem,
} from '@/lib/services/projects-service';
import { listRecipes } from '@/lib/services/recipes-service';
import type { AppState } from '@/lib/state/types';

export function ProjectItemsTable({
  items,
  productOptions,
  appState,
  onChange,
  error,
}: {
  items: ProjectLineItem[];
  productOptions: Array<{ id: string; name: string; sku: string; price: number; unit: string }>;
  appState: AppState;
  onChange: (items: ProjectLineItem[]) => void;
  error?: string;
}) {
  const updateItem = (id: string, patch: Partial<ProjectLineItem>) => {
    onChange(items.map((item) => (item.id === id ? recalcProjectLineItem({ ...item, ...patch }) : item)));
  };

  const removeItem = (id: string) => {
    const next = items.filter((i) => i.id !== id);
    onChange(next.length ? next : [createEmptyProjectLineItem()]);
  };

  const addRow = () => onChange([...items, createEmptyProjectLineItem()]);

  const pickProduct = (id: string, productId: string) => {
    const product = productOptions.find((p) => p.id === productId);
    if (!product) return;
    updateItem(id, {
      productId: product.id,
      productName: product.name,
      unitPrice: Number(product.price ?? 0),
      recipeId: '',
    });
  };

  const totals = items.reduce(
    (acc, item) => {
      const calc = recalcProjectLineItem(item);
      return {
        qty: acc.qty + Number(calc.qty ?? 0),
        value: acc.value + Number(calc.lineTotal ?? 0),
      };
    },
    { qty: 0, value: 0 },
  );

  const allRecipes = listRecipes(appState);

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full table-fixed text-xs min-w-[760px]">
          <colgroup>
            <col style={{ width: '36px' }} />
            <col style={{ width: '25%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '65px' }} />
            <col style={{ width: '90px' }} />
            <col style={{ width: '90px' }} />
            <col style={{ width: '46px' }} />
          </colgroup>
          <thead>
            <tr className={PJ_TABLE_HEAD_CLS}>
              <th className="px-2 py-2.5 text-left">#</th>
              <th className="px-2 py-2.5 text-left">Product</th>
              <th className="px-2 py-2.5 text-left">Variant / Color</th>
              <th className="px-2 py-2.5 text-left">BOM / Recipe</th>
              <th className="px-2 py-2.5 text-left">Qty</th>
              <th className="px-2 py-2.5 text-left">Unit Price</th>
              <th className="px-2 py-2.5 text-right">Total</th>
              <th className="px-2 py-2.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const filteredProducts = productOptions.filter((p) => {
                const q = item.productName.toLowerCase();
                if (!q) return true;
                return `${p.name} ${p.sku}`.toLowerCase().includes(q);
              });
              const calc = recalcProjectLineItem(item);
              const selectedProduct = productOptions.find((p) => p.id === item.productId);
              
              const matchingRecipes = allRecipes.filter((r) => {
                if (!selectedProduct) return false;
                const model = r.model.toLowerCase().trim();
                const productSku = r.productSku.toLowerCase().trim();
                const recipeProduct = r.product.toLowerCase().trim();
                const sku = selectedProduct.sku.toLowerCase().trim();
                const name = selectedProduct.name.toLowerCase().trim();
                
                return (
                  model === sku || 
                  productSku === sku || 
                  model === selectedProduct.id.toLowerCase() || 
                  recipeProduct === name
                );
              });

              return (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-2 py-2 text-slate-500 font-semibold align-top">{index + 1}</td>
                  <td className="px-2 py-2 align-top">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        list={`pj-products-${item.id}`}
                        value={item.productName}
                        onChange={(e) => updateItem(item.id, { productName: e.target.value, productId: '', recipeId: '' })}
                        placeholder="Search product"
                        className={`${PJ_CELL_INPUT_CLS} pl-7`}
                      />
                      <datalist id={`pj-products-${item.id}`}>
                        {filteredProducts.slice(0, 30).map((p) => (
                          <option key={p.id} value={p.name} />
                        ))}
                      </datalist>
                    </div>
                    {filteredProducts.length > 0 && item.productName && !item.productId ? (
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
                  <td className="px-2 py-2 align-top">
                    <input
                      type="text"
                      value={item.variant}
                      onChange={(e) => updateItem(item.id, { variant: e.target.value })}
                      placeholder="e.g. Red / Large"
                      className={PJ_CELL_INPUT_CLS}
                    />
                  </td>
                  <td className="px-2 py-2 align-top">
                    {item.productId ? (
                      <div className="space-y-1">
                        <select
                          value={item.recipeId || ''}
                          onChange={(e) => updateItem(item.id, { recipeId: e.target.value })}
                          className={PJ_CELL_INPUT_CLS}
                        >
                          <option value="">Select BOM</option>
                          {[...allRecipes]
                            .filter((r) => String((r as any).variant ?? 'finished-goods') !== 'semi-finished')
                            .sort((a, b) => {
                              const aMatch = matchingRecipes.some((m) => m.id === a.id);
                              const bMatch = matchingRecipes.some((m) => m.id === b.id);
                              if (aMatch && !bMatch) return -1;
                              if (!aMatch && bMatch) return 1;
                              return 0;
                            })
                            .map((r) => {
                              const isMatch = matchingRecipes.some((m) => m.id === r.id);
                              return (
                                <option key={r.id} value={r.id}>
                                  {isMatch ? '★ ' : ''}{r.product} - {r.model} ({r.materials.length} mats)
                                </option>
                              );
                            })}
                        </select>
                        <a
                          href={`/purchases/recipes/finished-goods?product=${encodeURIComponent(item.productId)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block text-[10px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                        >
                          + Create BOM
                        </a>
                      </div>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400">Select product first</span>
                    )}
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
                      className={PJ_CELL_INPUT_CLS}
                    />
                  </td>
                  <td className="px-2 py-2 align-top">
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.unitPrice || ''}
                      onChange={(e) =>
                        updateItem(item.id, { unitPrice: e.target.value === '' ? 0 : Number(e.target.value) })
                      }
                      className={PJ_CELL_INPUT_CLS}
                    />
                  </td>
                  <td className="px-2 py-2 text-right font-bold text-slate-800 align-top whitespace-nowrap">
                    {formatProjectMoney(calc.lineTotal)}
                  </td>
                  <td className="px-2 py-2 align-top">
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        title="Delete row"
                        onClick={() => removeItem(item.id)}
                        className="p-1 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 bg-slate-50/60">
              <td colSpan={3} className="px-2 py-2.5 text-[11px] font-bold text-slate-600">
                Order Totals
              </td>
              <td className="px-2 py-2.5 text-[11px] font-extrabold text-slate-800">
                {totals.qty.toLocaleString()} pcs
              </td>
              <td className="px-2 py-2.5" />
              <td className="px-2 py-2.5 text-right text-[11px] font-extrabold text-blue-700">
                {formatProjectMoney(totals.value)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
        <div className="px-3 py-2 border-t border-slate-100 bg-white">
          <button type="button" onClick={addRow} className={PJ_ADD_ITEM_BTN_CLS}>
            <Plus className="w-3.5 h-3.5" /> Add Product
          </button>
        </div>
      </div>
      {error ? <p className="mt-2 text-[10px] font-semibold text-rose-600">{error}</p> : null}
    </div>
  );
}
