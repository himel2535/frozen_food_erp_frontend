'use client';

import { toast } from '@/lib/ui/feedback';

import { ArrowRight } from 'lucide-react';
import { employeeAvatarClass, employeeInitials } from '@/lib/services/hrm-service';
import { formatMoney } from '@/lib/services/salary-sheet-service';
import { PaymentStatusDonut } from '@/components/modules/payroll/payments-due/PaymentStatusDonut';
import { PD_SIDEBAR_CARD_CLS } from '@/components/modules/payroll/payments-due/payments-due-styles';

export function PaymentsDueSidebar({
  statusSummary,
  dueBreakdown,
  recentPayments,
}: {
  statusSummary: { paid: number; partial: number; unpaid: number; notProcessed: number; total: number };
  dueBreakdown: { totalDue: number; dueWithin7: number; due8to15: number; dueOver15: number };
  recentPayments: Array<{ id: string; amount: number; method: string; date: string; employeeName: string }>;
}) {
  return (
    <div className="space-y-2 h-full">
      <section className={PD_SIDEBAR_CARD_CLS}>
        <h3 className="text-sm font-extrabold text-slate-900">Status Summary</h3>
        <PaymentStatusDonut summary={statusSummary} />
      </section>

      <section className={PD_SIDEBAR_CARD_CLS}>
        <h3 className="text-sm font-extrabold text-slate-900">Due Breakdown</h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
            <span className="font-semibold text-slate-600">Total Due Amount</span>
            <span className="font-extrabold text-rose-600 tabular-nums">{formatMoney(dueBreakdown.totalDue)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Due ≤ 7 Days</span>
            <span className="font-bold text-orange-600 tabular-nums">{formatMoney(dueBreakdown.dueWithin7)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Due 8 – 15 Days</span>
            <span className="font-bold text-orange-500 tabular-nums">{formatMoney(dueBreakdown.due8to15)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Due &gt; 15 Days</span>
            <span className="font-bold text-rose-600 tabular-nums">{formatMoney(dueBreakdown.dueOver15)}</span>
          </div>
        </div>
      </section>

      <section className={PD_SIDEBAR_CARD_CLS}>
        <h3 className="text-sm font-extrabold text-slate-900">Recent Payments</h3>
        {recentPayments.length ? (
          <ul className="space-y-2">
            {recentPayments.map((p) => (
              <li key={p.id} className="flex items-center gap-2 text-xs">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${employeeAvatarClass(p.employeeName)}`}>
                  {employeeInitials(p.employeeName)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-slate-800 truncate">{p.employeeName}</span>
                  <span className="block text-slate-500">{p.date} · {p.method}</span>
                </span>
                <span className="font-extrabold text-slate-900 tabular-nums shrink-0">{formatMoney(p.amount)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-400 font-medium">No recent payments.</p>
        )}
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer mt-2"
          onClick={() => toast.info('Feature coming soon', { module: 'Payments Due', description: "View all payments coming soon." })}
        >
          View All Payments <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </section>
    </div>
  );
}
