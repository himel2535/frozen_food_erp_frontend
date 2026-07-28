'use client';

import { Plus, Trash2 } from 'lucide-react';

export interface LineItem {
  id: string;
  description: string;
  qty: number;
  rate: number;
}

interface LineItemsEditorProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  readOnly?: boolean;
}

function lineTotal(item: LineItem) {
  return (Number(item.qty) || 0) * (Number(item.rate) || 0);
}

export function LineItemsEditor({ items, onChange, readOnly }: LineItemsEditorProps) {
  const addRow = () => {
    onChange([
      ...items,
      { id: `li-${Date.now()}`, description: '', qty: 1, rate: 0 },
    ]);
  };

  const update = (id: string, patch: Partial<LineItem>) => {
    onChange(items.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const remove = (id: string) => {
    onChange(items.filter((row) => row.id !== id));
  };

  const grandTotal = items.reduce((sum, row) => sum + lineTotal(row), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Line items</h4>
        {!readOnly && (
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add line
          </button>
        )}
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="text-left px-4 py-2.5 font-semibold">Description</th>
              <th className="text-right px-4 py-2.5 font-semibold w-24">Qty</th>
              <th className="text-right px-4 py-2.5 font-semibold w-28">Rate</th>
              <th className="text-right px-4 py-2.5 font-semibold w-28">Amount</th>
              {!readOnly && <th className="w-10" />}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={readOnly ? 4 : 5} className="px-4 py-6 text-center text-slate-400">
                  No line items yet
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">
                    {readOnly ? (
                      row.description
                    ) : (
                      <input
                        value={row.description}
                        onChange={(e) => update(row.id, { description: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50"
                        placeholder="Item description"
                      />
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {readOnly ? (
                      row.qty
                    ) : (
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={row.qty}
                        onChange={(e) => update(row.id, { qty: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-right"
                      />
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {readOnly ? (
                      row.rate.toLocaleString()
                    ) : (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.rate}
                        onChange={(e) => update(row.id, { rate: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-right"
                      />
                    )}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold text-slate-700">
                    {lineTotal(row).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  {!readOnly && (
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => remove(row.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                        aria-label="Remove line"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
          {items.length > 0 && (
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50">
                <td colSpan={readOnly ? 3 : 3} className="px-4 py-2.5 text-right font-bold text-slate-600">
                  Total
                </td>
                <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                  {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                {!readOnly && <td />}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
