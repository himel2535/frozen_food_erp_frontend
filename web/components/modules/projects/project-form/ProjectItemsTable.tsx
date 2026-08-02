'use client';

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

export function ProjectItemsTable({
  items,
  productOptions,
  onChange,
  error,
}: {
  items: ProjectLineItem[];
  productOptions: Array<{ id: string; name: string; sku: string; price: number; unit: string }>;
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

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full table-fixed text-xs min-w-[720px]">
          <colgroup>
            <col style={{ width: '36px' }} />
            <col style={{ width: '28%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '80px' }} />
            <col style={{ width: '100px' }} />
            <col style={{ width: '100px' }} />
            <col style={{ width: '56px' }} />
          </colgroup>
          <thead>
            <tr className={PJ_TABLE_HEAD_CLS}>
              <th className="px-2 py-2.5 text-left">#</th>
              <th className="px-2 py-2.5 text-left">Product</th>
              <th className="px-2 py-2.5 text-left">Variant / Color</th>
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
                        onChange={(e) => updateItem(item.id, { productName: e.target.value, productId: '' })}
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
