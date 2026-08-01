'use client';

import { useMemo } from 'react';
import { Eye, MoreVertical } from 'lucide-react';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import {
  formatDueDate,
  formatDueMoney,
  formatRelativeDueDate,
  getCustomerStatusLabel,
  getPartyInitials,
  type CustomerReceivable,
} from '@/lib/services/customer-receivables-service';
import { CUSTOMER_DUE_AGING_BADGE, CUSTOMER_DUE_STATUS_BADGE, DUE_AVATAR_CLS, DUE_BTN_RECEIVE } from './customer-due-styles';

export function CustomerDueTable({
  rows,
  page,
  pageSize,
  selectedCustomerId,
  onPageChange,
  onRowClick,
  onReceive,
}: {
  rows: CustomerReceivable[];
  page: number;
  pageSize: number;
  selectedCustomerId: string | null;
  onPageChange: (v: number) => void;
  onRowClick: (entry: CustomerReceivable) => void;
  onReceive: (entry: CustomerReceivable) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const columns = useMemo<AppTableColumn<CustomerReceivable>[]>(() => [
    {
      key: 'contact',
      label: 'Customer Contact',
      render: (row) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={DUE_AVATAR_CLS}>{getPartyInitials(row.name)}</span>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 truncate">{row.name}</div>
            <div className="text-[11px] text-slate-500 truncate">{row.company}</div>
            <div className="text-[11px] text-slate-400 truncate">{row.phone}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'totalDue',
      label: 'Total Due (৳)',
      align: 'right',
      render: (row) => (
        <span className={`font-bold ${row.totalDue <= 0 ? 'text-emerald-600' : row.status === 'overdue' ? 'text-rose-600' : 'text-slate-800'}`}>
          {formatDueMoney(row.totalDue)}
        </span>
      ),
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (row) => (
        <div>
          <div className="text-xs font-semibold text-slate-700">{row.dueDate ? formatDueDate(row.dueDate) : '—'}</div>
          {row.dueDate && (
            <div className="text-[10px] text-slate-500 mt-0.5">{formatRelativeDueDate(row.dueDate)}</div>
          )}
        </div>
      ),
    },
    {
      key: 'aging',
      label: 'Aging',
      render: (row) => (
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${CUSTOMER_DUE_AGING_BADGE[row.status] ?? CUSTOMER_DUE_AGING_BADGE.active}`}>
          {row.agingLabel}
        </span>
      ),
    },
    {
      key: 'lastPayment',
      label: 'Last Payment',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-800">{row.lastPaymentAmount > 0 ? formatDueMoney(row.lastPaymentAmount) : '—'}</div>
          {row.lastPaymentDate && (
            <div className="text-[11px] text-slate-500">{formatDueDate(row.lastPaymentDate)}</div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${CUSTOMER_DUE_STATUS_BADGE[row.status] ?? CUSTOMER_DUE_STATUS_BADGE.active}`}>
          {getCustomerStatusLabel(row.status)}
        </span>
      ),
    },
  ], []);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <AppTable
        columns={columns}
        rows={pagedRows}
        rowKey={(row) => row.id}
        emptyMessage="No customer receivables found."
        onRowClick={onRowClick}
        rowClassName={(row) => (
          selectedCustomerId === row.customerId ? 'bg-indigo-50/60 cursor-pointer' : 'cursor-pointer hover:bg-slate-50/80'
        )}
        renderActions={(row) => (
          <div className="flex items-center justify-center gap-1">
            {row.totalDue > 0 ? (
              <button type="button" className={DUE_BTN_RECEIVE} onClick={(e) => { e.stopPropagation(); onReceive(row); }}>
                Receive ৳
              </button>
            ) : (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onRowClick(row); }}
              >
                <Eye className="w-3.5 h-3.5" />
                View
              </button>
            )}
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              title="More actions"
              onClick={(e) => { e.stopPropagation(); window.alert('More actions coming soon.'); }}
            >
              <MoreVertical className="w-4 h-4" />
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
