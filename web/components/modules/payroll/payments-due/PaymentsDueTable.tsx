'use client';

import Link from 'next/link';
import { Info, MoreHorizontal } from 'lucide-react';
import { employeeAvatarClass, employeeInitials } from '@/lib/services/hrm-service';
import { formatMoney, type PaymentsDueRow } from '@/lib/services/salary-sheet-service';
import {
  PD_STATUS_BADGE,
  PD_STATUS_LABEL,
  PD_TABLE_CARD_CLS,
  PD_TABLE_HEAD_CLS,
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
  return (
    <div className={`${PD_TABLE_CARD_CLS} ${fillHeight ? 'flex flex-col flex-1 h-full' : ''} ${className}`.trim()}>
      <div className={`overflow-x-auto ${fillHeight ? 'flex-1 min-h-[520px]' : ''}`}>
        <table className="w-full min-w-[900px] text-sm border-collapse">
          <thead>
            <tr className={PD_TABLE_HEAD_CLS}>
              <th className="px-3 py-2.5 text-left w-10">#</th>
              <th className="px-3 py-2.5 text-left min-w-[180px]">Employee</th>
              <th className="px-3 py-2.5 text-left">Department</th>
              <th className="px-3 py-2.5 text-left">Net Salary</th>
              <th className="px-3 py-2.5 text-left">Paid Amount</th>
              <th className="px-3 py-2.5 text-left">Due Amount</th>
              <th className="px-3 py-2.5 text-left">Last Payment</th>
              <th className="px-3 py-2.5 text-left">Status</th>
              <th className="px-3 py-2.5 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const name = String(row.employee.name ?? 'Employee');
              const status = row.displayStatus;
              const paid = Number(row.entry.paidAmount ?? 0);
              const reviewUrl = buildReviewUrl(String(row.employee.id), filters);

              return (
                <tr key={String(row.entry.id ?? row.employee.id)} className="border-t border-slate-100 hover:bg-slate-50/50">
                  <td className="px-3 py-2.5 font-bold text-slate-500">{startIndex + index + 1}</td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-2 min-w-0">
                      <span className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${employeeAvatarClass(name)}`}>
                        {employeeInitials(name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-bold text-slate-800 truncate">{name}</span>
                        <span className="block text-[11px] text-slate-500">{String(row.employee.employeeCode ?? row.employee.id)}</span>
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 font-medium">{String(row.employee.department ?? '—')}</td>
                  <td className="px-3 py-2.5 font-semibold text-slate-800 tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      {formatMoney(row.computed.netPayable)}
                      <Info className="w-3 h-3 text-slate-400" />
                    </span>
                  </td>
                  <td className={`px-3 py-2.5 font-semibold tabular-nums ${status === 'partial' ? 'text-orange-600' : status === 'paid' ? 'text-emerald-600' : 'text-slate-700'}`}>
                    {formatMoney(paid)}
                  </td>
                  <td className={`px-3 py-2.5 font-semibold tabular-nums ${row.computed.dueAmount > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                    {formatMoney(row.computed.dueAmount)}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-600">
                    {row.lastPayment ? (
                      <>
                        <span className="block font-semibold">{formatPaymentDate(row.lastPayment.date)}</span>
                        <span className="block text-slate-500">{row.lastPayment.method}</span>
                      </>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[10px] font-bold ${PD_STATUS_BADGE[status] ?? PD_STATUS_BADGE.unpaid}`}>
                      {PD_STATUS_LABEL[status] ?? status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length === 0 ? (
        <div className="p-10 text-center text-sm text-slate-500 font-medium">No employees match your filters.</div>
      ) : null}
    </div>
  );
}
