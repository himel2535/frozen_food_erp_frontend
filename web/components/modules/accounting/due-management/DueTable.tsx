'use client';

import { useMemo } from 'react';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import {
  formatDueDate,
  formatDueMoney,
  getDueStatusLabel,
  getPartyInitials,
  type DueEntry,
} from '@/lib/services/due-management-service';
import { DUE_AVATAR_CLS, DUE_BTN_RECEIVE, DUE_STATUS_BADGE } from './due-styles';

export function DueTable({
  rows,
  page,
  pageSize,
  selectedPartyId,
  partyColumnLabel = 'Customer',
  onPageChange,
  onRowClick,
  onReceive,
}: {
  rows: DueEntry[];
  page: number;
  pageSize: number;
  selectedPartyId: string | null;
  partyColumnLabel?: string;
  onPageChange: (v: number) => void;
  onRowClick: (entry: DueEntry) => void;
  onReceive: (entry: DueEntry) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const columns = useMemo<AppTableColumn<DueEntry>[]>(() => [
    {
      key: 'party',
      label: partyColumnLabel,
      render: (row) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={DUE_AVATAR_CLS}>{getPartyInitials(row.partyName)}</span>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 truncate">{row.partyName}</div>
            <div className="text-[11px] text-slate-500 truncate">{row.partyLocation}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'invoice',
      label: 'Invoice',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-800">{row.invoiceId}</div>
          <div className="text-[11px] text-slate-500">{formatDueDate(row.invoiceDate)}</div>
        </div>
      ),
    },
    {
      key: 'total',
      label: 'Total (৳)',
      align: 'right',
      render: (row) => <span className="font-semibold text-slate-800">{formatDueMoney(row.total)}</span>,
    },
    {
      key: 'paid',
      label: 'Paid (৳)',
      align: 'right',
      render: (row) => <span className="font-bold text-emerald-600">{formatDueMoney(row.paid)}</span>,
    },
    {
      key: 'due',
      label: 'Due (৳)',
      align: 'right',
      render: (row) => <span className="font-bold text-rose-600">{formatDueMoney(row.due)}</span>,
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (row) => (
        <div>
          <div className="text-xs font-semibold text-slate-700">{formatDueDate(row.dueDate)}</div>
          <span className={`inline-flex mt-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${DUE_STATUS_BADGE[row.status] ?? DUE_STATUS_BADGE.upcoming}`}>
            {getDueStatusLabel(row)}
          </span>
        </div>
      ),
    },
  ], [partyColumnLabel]);

  return (
    <div>
      <AppTable
        columns={columns}
        rows={pagedRows}
        rowKey={(row) => row.id}
        emptyMessage="No due records found."
        onRowClick={onRowClick}
        rowClassName={(row) => (
          selectedPartyId === row.partyId ? 'bg-indigo-50/60 cursor-pointer' : 'cursor-pointer hover:bg-slate-50/80'
        )}
        renderActions={(row) => (
          <div className="flex items-center justify-center gap-1">
            <button type="button" className={DUE_BTN_RECEIVE} onClick={(e) => { e.stopPropagation(); onReceive(row); }}>
              Receive
            </button>
          </div>
        )}
      />
      <div className="px-3 py-2 border-t border-slate-100 flex items-center justify-end gap-1 text-xs text-slate-500">
        <button
          type="button"
          disabled={safePage <= 1}
          className="px-2 py-1 rounded border border-slate-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          onClick={() => onPageChange(safePage - 1)}
        >
          Previous
        </button>
        {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            className={`px-2.5 py-1 rounded border cursor-pointer ${n === safePage ? 'border-indigo-300 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-200'}`}
            onClick={() => onPageChange(n)}
          >
            {n}
          </button>
        ))}
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
  );
}
