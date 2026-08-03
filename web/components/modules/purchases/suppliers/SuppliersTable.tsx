'use client';

import { useMemo } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { TableIconAction } from '@/components/shared/TableIconAction';
import {
  formatDueDate,
  formatDueMoney,
  type EnrichedSupplier,
} from '@/lib/services/suppliers-service';
import { getPartyInitials } from '@/lib/services/due-management-service';
import {
  SUPPLIER_AVATAR_CLS,
  SUPPLIER_STATUS_BADGE,
  SUPPLIER_STATUS_DOT,
  supplierAvatarColor,
} from './suppliers-styles';

function StatusBadge({ supplier }: { supplier: EnrichedSupplier }) {
  const cls = SUPPLIER_STATUS_BADGE[supplier.listStatus] ?? SUPPLIER_STATUS_BADGE.clear;
  const dot = SUPPLIER_STATUS_DOT[supplier.listStatus] ?? SUPPLIER_STATUS_DOT.clear;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {supplier.statusLabel}
    </span>
  );
}

export function SuppliersTable({
  rows,
  page,
  pageSize,
  onPageChange,
  onView,
  onEdit,
  onDeactivate,
}: {
  rows: EnrichedSupplier[];
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onView: (supplier: EnrichedSupplier) => void;
  onEdit: (supplier: EnrichedSupplier) => void;
  onDeactivate: (supplier: EnrichedSupplier) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const columns = useMemo<AppTableColumn<EnrichedSupplier>[]>(() => [
    {
      key: 'supplier',
      label: 'Supplier',
      render: (row) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`${SUPPLIER_AVATAR_CLS} ${supplierAvatarColor(row.name)}`}>
            {getPartyInitials(row.name).slice(0, 1)}
          </span>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 truncate">{row.name}</div>
            <div className="text-[11px] text-slate-500 truncate">{row.code} • {row.category}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (row) => (
        <div>
          <div className="text-xs font-semibold text-slate-800">{row.contactName}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{row.phone}</div>
        </div>
      ),
    },
    {
      key: 'purchase',
      label: 'Purchase Activity',
      render: (row) => (
        <div>
          <div className="text-xs font-bold text-slate-900">{formatDueMoney(row.totalPurchase)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {row.lastPurchaseDate ? `Last: ${formatDueDate(row.lastPurchaseDate)}` : 'No purchases yet'}
          </div>
        </div>
      ),
    },
    {
      key: 'terms',
      label: 'Payment Terms',
      render: (row) => (
        <div>
          <div className="text-xs font-semibold text-slate-800">{row.paymentTerms}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{row.termsSubLabel}</div>
        </div>
      ),
    },
    {
      key: 'payable',
      label: 'Payable',
      render: (row) => {
        const tone = row.listStatus === 'overdue'
          ? 'text-rose-600'
          : row.listStatus === 'payment_due'
            ? 'text-amber-600'
            : row.payable <= 0
              ? 'text-emerald-600'
              : 'text-slate-800';
        return (
          <div>
            <div className={`text-xs font-bold ${tone}`}>{formatDueMoney(row.payable)}</div>
            <div className={`text-[11px] mt-0.5 flex items-center gap-1 ${row.payableSubLabel === 'Clear' ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
              {row.payableSubLabel === 'Clear' && <CheckCircle2 className="w-3 h-3" />}
              {row.payableSubLabel}
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge supplier={row} />,
    },
  ], []);

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    Math.max(0, safePage - 3),
    Math.max(0, safePage - 3) + 5,
  );

  return (
    <div>
      <AppTable
        columns={columns}
        rows={pagedRows}
        emptyMessage="No suppliers found."
        renderActions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <TableIconAction
              variant="view"
              onClick={(e) => {
                e.stopPropagation();
                onView(row);
              }}
            />
            <TableIconAction
              variant="edit"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row);
              }}
            />
            {row.recordStatus === 'active' && (
              <TableIconAction
                variant="discontinue"
                label="Deactivate"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeactivate(row);
                }}
              />
            )}
          </div>
        )}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
        <span>
          Showing {rows.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, rows.length)} of {rows.length} suppliers
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg cursor-pointer disabled:opacity-50"
          >
            Previous
          </button>
          {pageNumbers.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onPageChange(n)}
              className={`min-w-[32px] px-2 py-1.5 rounded-lg font-bold cursor-pointer ${
                n === safePage ? 'bg-blue-600 text-white' : 'border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg cursor-pointer disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
