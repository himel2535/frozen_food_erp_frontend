'use client';

import { toast } from '@/lib/ui/feedback';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';
import { ChildPageShell } from '@/components/layout/ChildPageShell';
import { useChromeSuppressed } from '@/components/layout/ModuleActionsContext';
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
import { RP_BTN_OUTLINE } from '@/components/modules/payroll/salary-sheet/review/review-pay-styles';
import { buildReviewUrl, defaultPeriod, type SheetFilterState } from '@/components/modules/payroll/salary-sheet/salary-sheet-types';
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

  useChromeSuppressed(true);

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
      <>
        <ChildPageShell
          title="Employee salary sheet not found"
          subtitle="This employee may not be on the salary sheet for the selected period."
          onBack={() => router.push(listUrl)}
          backLabel="Back to Salary Sheet"
        >
          <div className="premium-card premium-shadow p-8 text-center" />
        </ChildPageShell>
        <Footer />
      </>
    );
  }

  const locked = String(entry.status) === 'paid';
  const payments = Array.isArray(entry.payments) ? entry.payments as Array<Record<string, unknown>> : [];

  const handleApprove = (payment: { amount: number; method: string; date: string; note: string }) => {
    const result = approveAndPay(appState, String(entry.id), payment);
    if (!result.ok) {
      toast.error('Operation failed', { module: 'Salary Sheet', description: String(result.error ?? 'Payment failed') });
      return;
    }
    saveAppState();
    bump((n) => n + 1);
    router.refresh();
  };

  return (
    <>
      <ChildPageShell
        title="Payroll Processing"
        subtitle={`Review salary breakdown and approve payment for ${String(employee.name ?? 'employee')}.`}
        onBack={() => router.push(listUrl)}
        backLabel="Back to Salary Sheet"
      >
        <EmployeeReviewHeader
          employee={employee}
          prevId={prevId}
          nextId={nextId}
          reviewUrl={reviewUrl}
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

        {nextId ? (
          <div className="flex justify-end pt-1">
            <Link href={reviewUrl(nextId)} className={RP_BTN_OUTLINE}>Next Employee</Link>
          </div>
        ) : null}
      </ChildPageShell>
      <Footer />
    </>
  );
}
