'use client';

import { useMemo } from 'react';
import { Icon } from '@iconify/react';
import { Download } from 'lucide-react';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { TableIconAction } from '@/components/shared/TableIconAction';
import {
  formatCashboxDateTime,
  formatCashboxMoney,
  type CashboxEntry,
} from '@/lib/services/cashbox-service';
import { CB_FILTER_INPUT } from './cashbox-styles';
import { CASHBOX_CATEGORY_FILTER_OPTIONS, CASHBOX_TYPE_OPTIONS, getCategoryIcon } from './cashbox-options';
import { CashboxTypeArrow } from './CashboxActionBar';

export function CashboxTransactionsTable({
  rows,
  dateFrom,
  dateTo,
  typeFilter,
  categoryFilter,
  page,
  pageSize,
  onDateFromChange,
  onDateToChange,
  onTypeFilterChange,
  onCategoryFilterChange,
  onPageChange,
  onExport,
  onEdit,
  onDelete,
}: {
  rows: CashboxEntry[];
  dateFrom: string;
  dateTo: string;
  typeFilter: string;
  categoryFilter: string;
  page: number;
  pageSize: number;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onTypeFilterChange: (v: string) => void;
  onCategoryFilterChange: (v: string) => void;
  onPageChange: (v: number) => void;
  onExport: () => void;
  onEdit: (entry: CashboxEntry) => void;
  onDelete: (entry: CashboxEntry) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const from = rows.length ? (safePage - 1) * pageSize + 1 : 0;
  const to = Math.min(safePage * pageSize, rows.length);

  const columns = useMemo<AppTableColumn<CashboxEntry>[]>(() => [
    {
      key: 'datetime',
      label: 'Date & Time',
      render: (row) => <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">{formatCashboxDateTime(row.datetime)}</span>,
    },
    {
      key: 'description',
      label: 'Description',
      render: (row) => (
        <div className="min-w-0">
          <div className="font-semibold text-slate-900 truncate">{row.description}</div>
          {row.note ? <div className="text-[11px] text-slate-500 truncate">{row.note}</div> : null}
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Icon icon={getCategoryIcon(row.category)} width={16} height={16} />
          {row.category}
        </span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => <CashboxTypeArrow type={row.type} />,
    },
    {
      key: 'cashIn',
      label: 'Cash In',
      align: 'right',
      render: (row) => (
        row.cashIn > 0
          ? <span className="font-bold text-emerald-600">{formatCashboxMoney(row.cashIn)}</span>
          : <span className="text-slate-300">—</span>
      ),
    },
    {
      key: 'cashOut',
      label: 'Cash Out',
      align: 'right',
      render: (row) => (
        row.cashOut > 0
          ? <span className="font-bold text-rose-600">{formatCashboxMoney(row.cashOut)}</span>
          : <span className="text-slate-300">—</span>
      ),
    },
    {
      key: 'balance',
      label: 'Balance',
      align: 'right',
      render: (row) => <span className="font-bold text-slate-900">{formatCashboxMoney(row.balance)}</span>,
    },
  ], []);

  return (
    <div className="premium-card premium-shadow overflow-hidden">
      <div className="p-3 border-b border-slate-100 flex flex-wrap items-end gap-2 justify-between">
        <div className="flex flex-wrap items-end gap-2 flex-1 min-w-0">
          <div className="min-w-[130px]">
            <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">From</label>
            <input type="date" className={CB_FILTER_INPUT} value={dateFrom} onChange={(e) => onDateFromChange(e.target.value)} />
          </div>
          <div className="min-w-[130px]">
            <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">To</label>
            <input type="date" className={CB_FILTER_INPUT} value={dateTo} onChange={(e) => onDateToChange(e.target.value)} />
          </div>
          <div className="min-w-[130px]">
            <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Type</label>
            <select className={CB_FILTER_INPUT} value={typeFilter} onChange={(e) => onTypeFilterChange(e.target.value)}>
              {CASHBOX_TYPE_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[140px]">
            <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Category</label>
            <select className={CB_FILTER_INPUT} value={categoryFilter} onChange={(e) => onCategoryFilterChange(e.target.value)}>
              {CASHBOX_CATEGORY_FILTER_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
          title="Export CSV"
          onClick={onExport}
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      <AppTable
        columns={columns}
        rows={pagedRows}
        rowKey={(row) => row.id}
        emptyMessage="No cashbox transactions found."
        renderActions={(row) => (
          <div className="flex items-center justify-center gap-1">
            <TableIconAction variant="edit" onClick={() => onEdit(row)} />
            <TableIconAction variant="delete" onClick={() => onDelete(row)} />
          </div>
        )}
      />

      <div className="px-3 py-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          Showing {from} to {to} of {rows.length} entr{rows.length === 1 ? 'y' : 'ies'}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={safePage <= 1}
            className="px-2 py-1 rounded border border-slate-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            onClick={() => onPageChange(safePage - 1)}
          >
            Prev
          </button>
          <span className="px-2 font-semibold text-slate-700">{safePage} / {totalPages}</span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            className="px-2 py-1 rounded border border-slate-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            onClick={() => onPageChange(safePage + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
