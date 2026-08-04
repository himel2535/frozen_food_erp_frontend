'use client';

import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

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
  const { formatNumber } = useLocaleFormat();

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

  const columns = useMemo<AppTableColumn<LineItem>[]>(() => [
    {
      key: 'description',
      label: 'Description',
      render: (row) =>
        readOnly ? (
          row.description
        ) : (
          <input
            value={row.description}
            onChange={(e) => update(row.id, { description: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50"
            placeholder="Item description"
          />
        ),
    },
    {
      key: 'qty',
      label: 'Qty',
      className: 'w-24',
      headerClassName: 'w-24',
      render: (row) =>
        readOnly ? (
          formatNumber(row.qty)
        ) : (
          <input
            type="number"
            min="0"
            step="1"
            value={row.qty}
            onChange={(e) => update(row.id, { qty: Number(e.target.value) })}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50"
          />
        ),
    },
    {
      key: 'rate',
      label: 'Rate',
      className: 'w-28',
      headerClassName: 'w-28',
      render: (row) =>
        readOnly ? (
          formatNumber(row.rate, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        ) : (
          <input
            type="number"
            min="0"
            step="0.01"
            value={row.rate}
            onChange={(e) => update(row.id, { rate: Number(e.target.value) })}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50"
          />
        ),
    },
    {
      key: 'amount',
      label: 'Amount',
      className: 'w-28 font-semibold text-slate-700',
      headerClassName: 'w-28',
      render: (row) =>
        formatNumber(lineTotal(row), { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
  ], [readOnly, items, formatNumber]);

  const footer =
    items.length > 0 ? (
      <tr className="app-table-footer-row">
        <td colSpan={readOnly ? 3 : 3} className="app-table-td font-bold text-slate-600">
          Total
        </td>
        <td className="app-table-td font-bold text-slate-900">
          {formatNumber(grandTotal, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
        {!readOnly && <td className="app-table-td" />}
      </tr>
    ) : null;

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
      <AppTable<LineItem>
        className="app-table--compact"
        columns={columns}
        rows={items}
        rowKey={(row) => row.id}
        emptyMessage="No line items yet"
        footer={footer}
        renderActions={
          readOnly
            ? undefined
            : (row) => (
                <TableIconAction variant="delete" label="Remove line" onClick={() => remove(row.id)} />
              )
        }
      />
    </div>
  );
}
