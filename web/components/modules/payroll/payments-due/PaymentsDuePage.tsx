'use client';

import { toast } from '@/lib/ui/feedback';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Download, Filter, Info } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { PaymentsDueFilters } from '@/components/modules/payroll/payments-due/PaymentsDueFilters';
import { PaymentsDueKpiBar } from '@/components/modules/payroll/payments-due/PaymentsDueKpiBar';
import { PaymentsDueSidebar } from '@/components/modules/payroll/payments-due/PaymentsDueSidebar';
import { PaymentsDueTable } from '@/components/modules/payroll/payments-due/PaymentsDueTable';
import {
  PD_BTN_OUTLINE,
  PD_EXPORT_BTN_CLS,
  PD_INFO_BOX_CLS,
  PD_VIEW_ALL_BTN_CLS,
} from '@/components/modules/payroll/payments-due/payments-due-styles';
import {
  DEFAULT_PAYMENTS_DUE_FILTERS,
  type PaymentsDueFilterState,
} from '@/components/modules/payroll/payments-due/payments-due-types';
import { useAppStore } from '@/lib/state/app-store';
import {
  getDueAgingBreakdown,
  getPaymentStatusSummary,
  getPaymentsDueMetrics,
  listPaymentsDueRows,
  listRecentPayments,
  listSheetEmployees,
} from '@/lib/services/salary-sheet-service';

const COMPACT_ROW_LIMIT = 10;

export function PaymentsDuePage() {
  const appState = useAppStore((s) => s.appState);
  const [filters, setFilters] = useState<PaymentsDueFilterState>(DEFAULT_PAYMENTS_DUE_FILTERS);
  const [showAll, setShowAll] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  const employees = useMemo(() => listSheetEmployees(appState), [appState]);

  const allRows = useMemo(
    () => listPaymentsDueRows(appState, filters.period),
    [appState, filters.period],
  );

  const departments = useMemo(
    () => [...new Set(employees.map((e) => String(e.department ?? '')).filter(Boolean))].sort(),
    [employees],
  );
  const designations = useMemo(
    () => [...new Set(employees.map((e) => String(e.designation ?? '')).filter(Boolean))].sort(),
    [employees],
  );

  const filteredRows = useMemo(() => {
    let list = allRows;
    if (filters.department !== 'all') {
      list = list.filter((r) => String(r.employee.department) === filters.department);
    }
    if (filters.designation !== 'all') {
      list = list.filter((r) => String(r.employee.designation) === filters.designation);
    }
    if (filters.status !== 'all') {
      list = list.filter((r) => r.displayStatus === filters.status);
    }
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      list = list.filter((r) =>
        String(r.employee.name ?? '').toLowerCase().includes(q)
        || String(r.employee.id ?? '').toLowerCase().includes(q)
        || String(r.employee.employeeCode ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [allRows, filters]);

  useEffect(() => {
    setShowAll(false);
  }, [filters]);

  const visibleRows = useMemo(
    () => (showAll ? filteredRows : filteredRows.slice(0, COMPACT_ROW_LIMIT)),
    [filteredRows, showAll],
  );

  const metrics = useMemo(() => getPaymentsDueMetrics(filteredRows), [filteredRows]);
  const statusSummary = useMemo(() => getPaymentStatusSummary(filteredRows), [filteredRows]);
  const dueBreakdown = useMemo(() => getDueAgingBreakdown(filteredRows), [filteredRows]);
  const recentPayments = useMemo(
    () => listRecentPayments(appState, filters.period, 3),
    [appState, filters.period],
  );

  const hasMoreRows = filteredRows.length > COMPACT_ROW_LIMIT;

  useRegisterModuleActions(
    <>
      <button
        type="button"
        className={PD_BTN_OUTLINE}
        onClick={() => setShowFilters((v) => !v)}
      >
        <Filter className="w-3.5 h-3.5 inline mr-1" /> Filters
      </button>
      <button
        type="button"
        className={PD_EXPORT_BTN_CLS}
        onClick={() => toast.info('Feature coming soon', { module: 'Payments Due', description: "Export coming soon." })}
      >
        <Download className="w-3.5 h-3.5" /> Export
      </button>
    </>,
    [showFilters],
  );

  return (
    <>
      <PaymentsDueKpiBar metrics={metrics} />

      {showFilters ? (
        <PaymentsDueFilters
          filters={filters}
          departments={departments}
          designations={designations}
          onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
          onReset={() => setFilters(DEFAULT_PAYMENTS_DUE_FILTERS)}
        />
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-2 xl:items-stretch">
        <div className="flex flex-col min-w-0 h-full">
          <PaymentsDueTable
            rows={visibleRows}
            filters={filters}
            startIndex={0}
            fillHeight={!showAll}
            className="flex-1 flex flex-col min-h-0"
          />
          {hasMoreRows && !showAll ? (
            <div className="pt-2 px-1">
              <button
                type="button"
                className={PD_VIEW_ALL_BTN_CLS}
                onClick={() => setShowAll(true)}
              >
                View All ({filteredRows.length} employees) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : null}
          {showAll ? (
            <div className="pt-2 px-1">
              <button
                type="button"
                className={PD_VIEW_ALL_BTN_CLS}
                onClick={() => setShowAll(false)}
              >
                Show Less
              </button>
            </div>
          ) : null}
        </div>
        <PaymentsDueSidebar
          statusSummary={statusSummary}
          dueBreakdown={dueBreakdown}
          recentPayments={recentPayments}
        />
      </div>

      <div className={`${PD_INFO_BOX_CLS} flex gap-3 items-start`}>
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold mb-1.5">How it works</p>
          <ol className="list-decimal list-inside space-y-1 text-xs leading-relaxed">
            <li>Review employee salary in Monthly Salary Sheet.</li>
            <li>Approve &amp; make payment from Employee Review &amp; Pay.</li>
            <li>Track payment status here.</li>
            <li>View payslip anytime after payment.</li>
          </ol>
        </div>
      </div>

      <Footer />
    </>
  );
}
