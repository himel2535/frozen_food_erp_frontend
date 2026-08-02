'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Info, MoreHorizontal } from 'lucide-react';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { employeeAvatarClass, employeeInitials } from '@/lib/services/hrm-service';
import { formatMoney, type PaymentsDueRow } from '@/lib/services/salary-sheet-service';
import {
  PD_STATUS_BADGE,
  PD_STATUS_LABEL,
} from '@/components/modules/payroll/payments-due/payments-due-styles';
import { buildReviewUrl, type PaymentsDueFilterState } from '@/components/modules/payroll/payments-due/payments-due-types';

function formatPaymentDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function PaymentsDueTable({
  rows,
  filters,
  startIndex,
  className = '',
  fillHeight = false,
}: {
  rows: PaymentsDueRow[];
  filters: PaymentsDueFilterState;
  startIndex: number;
  className?: string;
  fillHeight?: boolean;
}) {
  const columns = useMemo<AppTableColumn<PaymentsDueRow>[]>(() => [
    {
      key: 'index',
      label: '#',
      align: 'center',
      render: (_row, index) => (
        <span className="font-bold text-slate-500">{startIndex + index + 1}</span>
      ),
    },
    {
      key: 'employee',
      label: 'Employee',
      render: (row) => {
        const name = String(row.employee.name ?? 'Employee');
        return (
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${employeeAvatarClass(name)}`}>
              {employeeInitials(name)}
            </span>
            <div className="min-w-0">
              <div className="font-bold text-slate-800 truncate">{name}</div>
              <div className="text-[11px] text-slate-500 truncate">{String(row.employee.employeeCode ?? row.employee.id)}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'department',
      label: 'Department',
      render: (row) => (
        <span className="text-slate-600 font-medium">{String(row.employee.department ?? '—')}</span>
      ),
    },
    {
      key: 'netSalary',
      label: 'Net Salary',
      render: (row) => (
        <span className="inline-flex items-center gap-1 font-semibold text-slate-800 tabular-nums">
          {formatMoney(row.computed.netPayable)}
          <Info className="w-3 h-3 text-slate-400" />
        </span>
      ),
    },
    {
      key: 'paidAmount',
      label: 'Paid Amount',
      render: (row) => {
        const status = row.displayStatus;
        const paid = Number(row.entry.paidAmount ?? 0);
        return (
          <span className={`font-semibold tabular-nums ${status === 'partial' ? 'text-orange-600' : status === 'paid' ? 'text-emerald-600' : 'text-slate-700'}`}>
            {formatMoney(paid)}
          </span>
        );
      },
    },
    {
      key: 'dueAmount',
      label: 'Due Amount',
      render: (row) => (
        <span className={`font-semibold tabular-nums ${row.computed.dueAmount > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
          {formatMoney(row.computed.dueAmount)}
        </span>
      ),
    },
    {
      key: 'lastPayment',
      label: 'Last Payment',
      render: (row) => (
        row.lastPayment ? (
          <div className="text-xs text-slate-600">
            <div className="font-semibold">{formatPaymentDate(row.lastPayment.date)}</div>
            <div className="text-slate-500">{row.lastPayment.method}</div>
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        )
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const status = row.displayStatus;
        return (
          <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[10px] font-bold ${PD_STATUS_BADGE[status] ?? PD_STATUS_BADGE.unpaid}`}>
            {PD_STATUS_LABEL[status] ?? status}
          </span>
        );
      },
    },
  ], [startIndex]);

  return (
    <div className={`${fillHeight ? 'flex flex-col flex-1 h-full min-h-0' : ''} ${className}`.trim()}>
      <AppTable
        className={fillHeight ? 'flex-1 min-h-[520px]' : ''}
        columns={columns}
        rows={rows}
        rowKey={(row) => String(row.entry.id ?? row.employee.id)}
        emptyMessage="No employees match your filters."
        actionsLabel="Action"
        renderActions={(row) => {
          const status = row.displayStatus;
          const reviewUrl = buildReviewUrl(String(row.employee.id), filters);

          return (
            <div className="flex items-center justify-center gap-1">
              {status === 'paid' ? (
                <button
                  type="button"
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer whitespace-nowrap"
                  onClick={() => window.alert('Payslip preview coming soon.')}
                >
                  View Payslip
                </button>
              ) : status === 'partial' ? (
                <Link href={reviewUrl} className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer whitespace-nowrap">
                  Pay Due
                </Link>
              ) : status === 'unpaid' ? (
                <Link href={reviewUrl} className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer whitespace-nowrap">
                  Pay Now
                </Link>
              ) : (
                <span className="text-[11px] text-slate-400">—</span>
              )}
              <button
                type="button"
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                onClick={() => window.alert('More actions coming soon.')}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          );
        }}
      />
    </div>
  );
}
