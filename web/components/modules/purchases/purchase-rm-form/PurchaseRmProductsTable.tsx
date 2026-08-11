'use client';

import { useState } from 'react';
import { ChevronDown, Plus, Search, Trash2 } from 'lucide-react';
import { CF_BTN_PRIMARY, CF_INPUT_CLS } from '@/components/modules/crm/customer-form/customer-form-styles';
import {
  createEmptyLineItem,
  recalcLineItem,
  type PurchaseRmLineItem,
} from '@/components/modules/purchases/purchase-rm-form/prm-form-types';
import { formatPoMoney } from '@/lib/services/purchase-rm-service';

const UNITS = ['pcs', 'kg', 'liter', 'box', 'meter', 'set'];

export function PurchaseRmProductsTable({
  items,
  productOptions,
  onChange,
}: {
  items: PurchaseRmLineItem[];
  productOptions: Array<{ id: string; name: string; category?: string; unit?: string; standardCost?: number; availability?: number; code?: string; imageUrl?: string }>;
  onChange: (items: PurchaseRmLineItem[]) => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = productOptions.filter((p) =>
    `${p.name} ${p.code} ${p.category}`.toLowerCase().includes(search.toLowerCase()),
  );

  const updateItem = (id: string, patch: Partial<PurchaseRmLineItem>) => {
    onChange(items.map((item) => (item.id === id ? recalcLineItem({ ...item, ...patch }) : item)));
  };

  const removeItem = (id: string) => onChange(items.filter((i) => i.id !== id));

  const addProduct = (material: typeof productOptions[0]) => {
    if (items.some((i) => i.materialId === material.id)) return;
    onChange([...items, recalcLineItem({ ...createEmptyLineItem(material), qty: 1 })]);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className={`${CF_INPUT_CLS} pl-9 w-48`}
            />
          </div>
          <div className="relative inline-flex items-center">
            <Plus className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none z-10" />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none" />
            <select
              className={`${CF_BTN_PRIMARY} appearance-none pl-9 pr-9 min-w-[148px] cursor-pointer`}
              defaultValue=""
              onChange={(e) => {
                const mat = productOptions.find((p) => p.id === e.target.value);
                if (mat) addProduct(mat);
                e.target.value = '';
              }}
            >
              <option value="" className="bg-white text-slate-800">Add Product</option>
              {filtered.slice(0, 20).map((p) => (
                <option key={p.id} value={p.id} className="bg-white text-slate-800">{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-xs min-w-[900px]">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2 text-left w-8">#</th>
              <th className="px-3 py-2 text-left">Product</th>
              <th className="px-3 py-2 text-left">SKU</th>
              <th className="px-3 py-2 text-right">Current Stock</th>
              <th className="px-3 py-2 text-left">Unit</th>
              <th className="px-3 py-2 text-right">Qty</th>
              <th className="px-3 py-2 text-right">Unit Price</th>
              <th className="px-3 py-2 text-right">Discount %</th>
              <th className="px-3 py-2 text-right">Tax %</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-3 py-8 text-center text-slate-400 font-medium">
                  No products added. Search and add raw materials above.
                </td>
              </tr>
            ) : items.map((item, index) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-bold text-slate-400">{index + 1}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <img src={item.imageUrl} alt="" className="w-8 h-8 rounded-lg border border-slate-200 object-cover" />
                    <div>
                      <p className="font-semibold text-slate-800">{item.productName}</p>
                      <p className="text-[10px] text-slate-500">{item.category}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 font-semibold">{item.sku}</td>
                <td className={`px-3 py-2 text-right font-bold ${item.currentStock <= 100 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {item.currentStock.toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  <select
                    value={item.unit}
                    onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                    className={`${CF_INPUT_CLS} py-1.5 cursor-pointer`}
                  >
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input type="number" min={0} value={item.qty || ''} onChange={(e) => updateItem(item.id, { qty: Number(e.target.value) })} className={`${CF_INPUT_CLS} py-1.5 text-right w-20`} />
                </td>
                <td className="px-3 py-2">
                  <input type="number" min={0} step="0.01" value={item.unitPrice || ''} onChange={(e) => updateItem(item.id, { unitPrice: Number(e.target.value) })} className={`${CF_INPUT_CLS} py-1.5 text-right w-24`} />
                </td>
                <td className="px-3 py-2">
                  <input type="number" min={0} max={100} value={item.discountPct || ''} onChange={(e) => updateItem(item.id, { discountPct: Number(e.target.value) })} className={`${CF_INPUT_CLS} py-1.5 text-right w-16`} />
                </td>
                <td className="px-3 py-2">
                  <input type="number" min={0} max={100} value={item.taxPct || ''} onChange={(e) => updateItem(item.id, { taxPct: Number(e.target.value) })} className={`${CF_INPUT_CLS} py-1.5 text-right w-16`} />
                </td>
                <td className="px-3 py-2 text-right font-bold text-blue-700">{formatPoMoney(item.lineTotal)}</td>
                <td className="px-3 py-2">
                  <button type="button" onClick={() => removeItem(item.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
