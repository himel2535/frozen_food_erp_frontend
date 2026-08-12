'use client';

import { toast } from '@/lib/ui/feedback';

import { useMemo, useState, useEffect } from 'react';
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
import { isModuleApiMode } from '@/lib/config/data-source';
import { useApiResourceStore } from '@/hooks/use-api-resource-store';
import { usePaginatedApiResource } from '@/hooks/use-paginated-api-resource';
import { mapApiEmployeeRow } from '@/lib/services/entity-api-mappers';
import { mapGenericApiRow, mapGenericPayloadToApi } from '@/lib/services/generic-api-mapper';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { listEmployees } from '@/lib/services/hrm-service';
import { enrichSalaryStructureRecord } from '@/lib/services/payroll-service';
import {
  approveAndPay,
  computeSheetRow,
  getOrCreateSheetEntry,
  getSheetEntryByEmployee,
  listSheetEmployees,
  normalizeSheetEntry,
} from '@/lib/services/salary-sheet-service';

export function EmployeeReviewPayPage({ employeeId }: { employeeId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const apiMode = isModuleApiMode('salarySheet');
  const apiStore = usePaginatedApiResource('salarySheet', mapGenericApiRow, { pageSize: 50 });
  const structureStore = useApiResourceStore('salaryStructures', (doc) =>
    enrichSalaryStructureRecord(mapGenericApiRow(doc)),
  { pageOnly: true, lookupLimit: 200 });
  const employeeStore = useApiResourceStore('employees', mapApiEmployeeRow, { pageOnly: true, lookupLimit: 200 });
  const [, bump] = useState(0);

  useChromeSuppressed(true);

  const filters: SheetFilterState = useMemo(() => ({
    period: searchParams.get('period') ?? defaultPeriod(),
    department: searchParams.get('dept') ?? 'all',
    designation: searchParams.get('designation') ?? 'all',
    search: searchParams.get('q') ?? '',
  }), [searchParams]);

  const listUrl = `/payroll/salary-sheet?period=${filters.period}`;

  useEffect(() => {
    if (!apiMode) return;
    apiStore.setQueryFilter('period', filters.period);
  }, [apiMode, filters.period, apiStore.setQueryFilter]);

  const sheetState = useMemo(() => {
    if (!apiMode) return appState;
    const salaryStructures = structureStore.initialized
      ? structureStore.rows.map((row) => enrichSalaryStructureRecord(row))
      : (appState.salaryStructures ?? []);
    const employees = employeeStore.initialized ? employeeStore.rows : (appState.employees ?? []);
    const salarySheetEntries = apiStore.initialized ? apiStore.rows : [];
    return { ...appState, employees, salaryStructures, salarySheetEntries } as typeof appState;
  }, [apiMode, apiStore.initialized, apiStore.rows, structureStore.initialized, structureStore.rows, employeeStore.initialized, employeeStore.rows, appState]);

  const employee = useMemo(
    () => listEmployees(sheetState).find((e) => String(e.id) === employeeId) ?? null,
    [sheetState, employeeId],
  );

  const orderedIds = useMemo(() => {
    let list = listSheetEmployees(sheetState);
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
  }, [sheetState, filters]);

  const entry = useMemo(() => {
    getOrCreateSheetEntry(sheetState, filters.period, employeeId);
    return getSheetEntryByEmployee(sheetState, filters.period, employeeId);
  }, [sheetState, employeeId, filters.period]);

  const { entry: normalizedEntry, structure } = useMemo(() => {
    if (!entry || !employee) {
      return { entry: null, structure: {} as Record<string, unknown> };
    }
    return normalizeSheetEntry(sheetState, entry, employee as Record<string, unknown>);
  }, [sheetState, entry, employee]);

  const computed = useMemo(
    () => (normalizedEntry && structure ? computeSheetRow(normalizedEntry, structure, employee) : null),
    [normalizedEntry, structure, employee],
  );

  const idx = orderedIds.indexOf(employeeId);
  const prevId = idx > 0 ? orderedIds[idx - 1] : null;
  const nextId = idx >= 0 && idx < orderedIds.length - 1 ? orderedIds[idx + 1] : null;
  const reviewUrl = (id: string) => buildReviewUrl(id, filters);

  if (!employee || !normalizedEntry || !structure || !computed) {
    return (
      <>
        {apiStore.error ? <ApiModeBanner module="salarySheet" error={apiStore.error} /> : null}
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

  const locked = String(normalizedEntry.status) === 'paid';
  const payments = Array.isArray(normalizedEntry.payments) ? normalizedEntry.payments as Array<Record<string, unknown>> : [];

  const handleApprove = async (payment: { amount: number; method: string; date: string; note: string }) => {
    if (apiMode) {
      const pseudo = { ...sheetState, salarySheetEntries: apiStore.rows.map((r) => ({ ...r })) } as typeof appState;
      const result = approveAndPay(pseudo, String(normalizedEntry.id), payment);
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Salary Sheet', description: String(result.error ?? 'Payment failed') });
        return;
      }
      const updated = getSheetEntryByEmployee(pseudo, filters.period, employeeId);
      if (updated) {
        const sync = await apiStore.update(String(normalizedEntry.id), mapGenericPayloadToApi(updated as unknown as Record<string, unknown>));
        if (!sync.ok) {
          toast.error('Operation failed', { module: 'Salary Sheet', description: 'error' in sync ? String(sync.error) : 'Sync failed' });
          return;
        }
      }
      bump((n) => n + 1);
      router.refresh();
      return;
    }
    const result = approveAndPay(appState, String(normalizedEntry.id), payment);
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
          <SalaryBreakdownCard computed={computed} otHours={Number(normalizedEntry.otHours ?? 0)} />
          <SalaryPaymentFormCard
            netPayable={computed.netPayable}
            dueAmount={computed.dueAmount}
            locked={locked}
            onApprove={handleApprove}
          />
          <SalaryPaymentSummaryCard
            netPayable={computed.netPayable}
            payAmount={Number(normalizedEntry.paidAmount ?? 0)}
            dueAmount={computed.dueAmount}
            locked={locked}
            payments={payments}
          />
        </div>

        <EmployeeReviewSummary entry={normalizedEntry} computed={computed} />

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
