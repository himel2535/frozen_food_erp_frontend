'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';
import { EmployeeReviewHeader } from '@/components/modules/payroll/salary-sheet/review/EmployeeReviewHeader';
import {
  EmployeeReviewFacts,
  SalaryBreakdownCard,
} from '@/components/modules/payroll/salary-sheet/review/SalaryBreakdownCard';
import {
  EmployeeReviewSummary,
  SalaryPaymentFormCard,
  SalaryPaymentSummaryCard,
} from '@/components/modules/payroll/salary-sheet/review/SalaryPaymentCards';
import { RP_BTN_GHOST, RP_BTN_OUTLINE } from '@/components/modules/payroll/salary-sheet/review/review-pay-styles';
import { buildReviewUrl, defaultPeriod, type SheetFilterState } from '@/components/modules/payroll/salary-sheet/salary-sheet-types';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { useAppStore } from '@/lib/state/app-store';
import { listEmployees } from '@/lib/services/hrm-service';
import { getSalaryStructureById } from '@/lib/services/payroll-service';
import {
  approveAndPay,
  computeSheetRow,
  getOrCreateSheetEntry,
  getSheetEntryByEmployee,
  listSheetEmployees,
} from '@/lib/services/salary-sheet-service';

export function EmployeeReviewPayPage({ employeeId }: { employeeId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [, bump] = useState(0);

  const filters: SheetFilterState = useMemo(() => ({
    period: searchParams.get('period') ?? defaultPeriod(),
    department: searchParams.get('dept') ?? 'all',
    designation: searchParams.get('designation') ?? 'all',
    search: searchParams.get('q') ?? '',
  }), [searchParams]);

  const listUrl = `/payroll/salary-sheet?period=${filters.period}`;

  const employee = useMemo(
    () => listEmployees(appState).find((e) => String(e.id) === employeeId) ?? null,
    [appState, employeeId],
  );

  const orderedIds = useMemo(() => {
    let list = listSheetEmployees(appState);
    if (filters.department !== 'all') list = list.filter((e) => String(e.department) === filters.department);
    if (filters.designation !== 'all') list = list.filter((e) => String(e.designation) === filters.designation);
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      list = list.filter((e) =>
        String(e.name ?? '').toLowerCase().includes(q)
        || String(e.id ?? '').toLowerCase().includes(q),
      );
    }
    return list.map((e) => String(e.id));
  }, [appState, filters]);

  const entry = useMemo(() => {
    getOrCreateSheetEntry(appState, filters.period, employeeId);
    return getSheetEntryByEmployee(appState, filters.period, employeeId);
  }, [appState, employeeId, filters.period]);

  const structure = useMemo(
    () => (entry ? getSalaryStructureById(appState, String(entry.structureId)) : null),
    [appState, entry],
  );

  const computed = useMemo(
    () => (entry && structure ? computeSheetRow(entry, structure) : null),
    [entry, structure],
  );

  const idx = orderedIds.indexOf(employeeId);
  const prevId = idx > 0 ? orderedIds[idx - 1] : null;
  const nextId = idx >= 0 && idx < orderedIds.length - 1 ? orderedIds[idx + 1] : null;
  const reviewUrl = (id: string) => buildReviewUrl(id, filters);

  if (!employee || !entry || !structure || !computed) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        Employee salary sheet not found.{' '}
        <Link href={listUrl} className="text-blue-600 font-bold cursor-pointer">Back to sheet</Link>
      </div>
    );
  }

  const locked = String(entry.status) === 'paid';
  const payments = Array.isArray(entry.payments) ? entry.payments as Array<Record<string, unknown>> : [];

  const handleApprove = (payment: { amount: number; method: string; date: string; note: string }) => {
    const result = approveAndPay(appState, String(entry.id), payment);
    if (!result.ok) {
      window.alert(result.error ?? 'Payment failed');
      return;
    }
    saveAppState();
    bump((n) => n + 1);
    router.refresh();
  };

  return (
    <div className={`${MODULE_LIST_SHELL} space-y-4`}>
      <EmployeeReviewHeader
        employee={employee}
        prevId={prevId}
        nextId={nextId}
        reviewUrl={reviewUrl}
        listUrl={listUrl}
        period={filters.period}
        locked={locked}
      />

      <EmployeeReviewFacts employee={employee} structure={structure} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 items-start">
        <SalaryBreakdownCard computed={computed} otHours={Number(entry.otHours ?? 0)} />
        <SalaryPaymentFormCard
          netPayable={computed.netPayable}
          dueAmount={computed.dueAmount}
          locked={locked}
          onApprove={handleApprove}
        />
        <SalaryPaymentSummaryCard
          netPayable={computed.netPayable}
          payAmount={Number(entry.paidAmount ?? 0)}
          dueAmount={computed.dueAmount}
          locked={locked}
          payments={payments}
        />
      </div>

      <EmployeeReviewSummary entry={entry} computed={computed} />

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <Link href={listUrl} className={RP_BTN_GHOST}>Back to Salary Sheet</Link>
        {nextId ? (
          <Link href={reviewUrl(nextId)} className={RP_BTN_OUTLINE}>Next Employee</Link>
        ) : null}
      </div>

      <Footer />
    </div>
  );
}
