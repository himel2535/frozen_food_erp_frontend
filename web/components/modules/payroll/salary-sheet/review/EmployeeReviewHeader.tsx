'use client';

import Link from 'next/link';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { employeeAvatarClass, employeeInitials } from '@/lib/services/hrm-service';
import {
  RP_BREADCRUMB_CLS,
  RP_NAV_CARD_CLS,
  RP_PAGE_SUBTITLE_CLS,
  RP_PAGE_TITLE_CLS,
  RP_PERIOD_PILL_CLS,
  RP_STATUS_PAID_CLS,
  RP_STATUS_PENDING_CLS,
} from '@/components/modules/payroll/salary-sheet/review/review-pay-styles';

function formatPeriodLabel(period: string) {
  const [y, m] = period.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function EmployeeReviewHeader({
  employee,
  prevId,
  nextId,
  reviewUrl,
  listUrl,
  period,
  locked,
}: {
  employee: Record<string, unknown>;
  prevId: string | null;
  nextId: string | null;
  reviewUrl: (id: string) => string;
  listUrl: string;
  period: string;
  locked: boolean;
}) {
  const name = String(employee.name ?? 'Employee');
  const meta = [
    String(employee.employeeCode ?? employee.id),
    String(employee.designation ?? '—'),
    String(employee.department ?? '—'),
  ].join(' · ');

  return (
    <div className="space-y-3">
      <nav className={RP_BREADCRUMB_CLS}>
        <Link href="/payroll/salary-sheet" className="hover:text-blue-600 cursor-pointer">Payroll</Link>
        <span>/</span>
        <Link href={listUrl} className="hover:text-blue-600 cursor-pointer">Salary Processing</Link>
        <span>/</span>
        <span className="text-slate-700">Employee Review &amp; Pay</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className={RP_PAGE_TITLE_CLS}>Payroll Processing</h1>
          <p className={RP_PAGE_SUBTITLE_CLS}>Review salary breakdown and approve payment for this employee.</p>
        </div>
        <span className={RP_PERIOD_PILL_CLS}>
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          {formatPeriodLabel(period)}
        </span>
      </div>

      <div className={`${RP_NAV_CARD_CLS} relative`}>
        <div className="absolute top-4 right-4 hidden sm:block">
          {locked ? (
            <div className={RP_STATUS_PAID_CLS}>
              <span className="text-xs font-extrabold text-emerald-700 capitalize">Paid</span>
              <span className="text-[10px] font-medium text-emerald-600">Salary has been approved</span>
            </div>
          ) : (
            <div className={RP_STATUS_PENDING_CLS}>
              <span className="text-xs font-extrabold text-amber-700">Pending</span>
              <span className="text-[10px] font-medium text-amber-600">This employee salary is not paid yet</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="md:justify-self-start">
            {prevId ? (
              <Link
                href={reviewUrl(prevId)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Previous Employee
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <ChevronLeft className="w-4 h-4" /> Previous Employee
              </span>
            )}
          </div>

          <div className="text-center px-2">
            <span className={`inline-flex w-14 h-14 rounded-full items-center justify-center text-base font-bold ${employeeAvatarClass(name)}`}>
              {employeeInitials(name)}
            </span>
            <h2 className="text-lg font-extrabold text-slate-900 mt-2">{name}</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{meta}</p>
            <div className="sm:hidden mt-3">
              {locked ? (
                <div className={`${RP_STATUS_PAID_CLS} items-center text-center`}>
                  <span className="text-xs font-extrabold text-emerald-700">Paid</span>
                </div>
              ) : (
                <div className={`${RP_STATUS_PENDING_CLS} items-center text-center`}>
                  <span className="text-xs font-extrabold text-amber-700">Pending</span>
                </div>
              )}
            </div>
          </div>

          <div className="md:justify-self-end md:text-right">
            {nextId ? (
              <Link
                href={reviewUrl(nextId)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                Next Employee <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300">
                Next Employee <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
