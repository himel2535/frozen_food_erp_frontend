'use client';

import { toast } from '@/lib/ui/feedback';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, Info, Upload } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/shared/PageHeader';
import { SalarySheetFilters } from '@/components/modules/payroll/salary-sheet/SalarySheetFilters';
import { SalarySheetKpiBar } from '@/components/modules/payroll/salary-sheet/SalarySheetKpiBar';
import { SalarySheetTable } from '@/components/modules/payroll/salary-sheet/SalarySheetTable';
import {
  SS_BTN_OUTLINE,
  SS_BTN_PRIMARY,
  SS_CARD_CLS,
  SS_INFO_BOX_CLS,
} from '@/components/modules/payroll/salary-sheet/salary-sheet-styles';
import {
  defaultPeriod,
  type SheetFilterState,
  type SheetRowView,
} from '@/components/modules/payroll/salary-sheet/salary-sheet-types';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { useAppStore } from '@/lib/state/app-store';
import { getSalaryStructureById } from '@/lib/services/payroll-service';
import {
  computeSheetRow,
  getOrCreateSheetEntry,
  getSheetMetricsFromEntries,
  listSalarySheetEntries,
  listSheetEmployees,
  updateSheetEntry,
} from '@/lib/services/salary-sheet-service';

const DEFAULT_FILTERS: SheetFilterState = {
  period: defaultPeriod(),
  department: 'all',
  designation: 'all',
  search: '',
};

export function MonthlySalarySheetPage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [filters, setFilters] = useState<SheetFilterState>(DEFAULT_FILTERS);
  const [, bump] = useState(0);

  const employees = useMemo(() => listSheetEmployees(appState), [appState]);

  useEffect(() => {
    employees.forEach((emp) => {
      getOrCreateSheetEntry(appState, filters.period, String(emp.id));
    });
  }, [appState, employees, filters.period]);

  const departments = useMemo(
    () => [...new Set(employees.map((e) => String(e.department ?? '')).filter(Boolean))].sort(),
    [employees],
  );
  const designations = useMemo(
    () => [...new Set(employees.map((e) => String(e.designation ?? '')).filter(Boolean))].sort(),
    [employees],
  );

  const filteredEmployees = useMemo(() => {
    let list = employees;
    if (filters.department !== 'all') {
      list = list.filter((e) => String(e.department) === filters.department);
    }
    if (filters.designation !== 'all') {
      list = list.filter((e) => String(e.designation) === filters.designation);
    }
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      list = list.filter((e) =>
        String(e.name ?? '').toLowerCase().includes(q)
        || String(e.id ?? '').toLowerCase().includes(q)
        || String(e.employeeCode ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [employees, filters]);

  const rows: SheetRowView[] = useMemo(() => {
    const entries = listSalarySheetEntries(appState, filters.period);
    return filteredEmployees.map((employee) => {
      const employeeId = String(employee.id);
      const entry = entries.find((e) => String(e.employeeId) === employeeId)
        ?? getOrCreateSheetEntry(appState, filters.period, employeeId);
      if (!entry) return null;
      const structure = getSalaryStructureById(appState, String(entry.structureId)) ?? {};
      return {
        entry,
        employee,
        structure,
        computed: computeSheetRow(entry, structure),
      };
    }).filter(Boolean) as SheetRowView[];
  }, [appState, filteredEmployees, filters.period]);

  const metrics = useMemo(() => {
    const structureMap: Record<string, Record<string, unknown>> = {};
    rows.forEach((r) => { structureMap[String(r.entry.structureId)] = r.structure; });
    return getSheetMetricsFromEntries(rows.map((r) => r.entry), structureMap);
  }, [rows]);

  const handleUpdate = useCallback((entryId: string, patch: Record<string, unknown>) => {
    const result = updateSheetEntry(appState, entryId, patch);
    if (!result.ok) {
      toast.error('Operation failed', { module: 'Salary Sheet', description: String(result.error ?? 'Update failed') });
      return;
    }
    saveAppState();
    bump((n) => n + 1);
  }, [appState, saveAppState]);

  const periodLabel = useMemo(() => {
    const [y, m] = filters.period.split('-');
    const d = new Date(Number(y), Number(m) - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [filters.period]);

  return (
    <div className={`${MODULE_LIST_SHELL} space-y-4`}>
      <PageHeader
        title={`Monthly Salary Sheet — ${periodLabel}`}
        subtitle="Enter and manage attendance, overtime, bonus, deductions and other salary details."
        actions={
          <>
            <button type="button" className={SS_BTN_OUTLINE} onClick={() => toast.info('Feature coming soon', { module: 'Salary Sheet', description: "Import Excel coming soon." })}>
              <Upload className="w-3.5 h-3.5 inline mr-1" /> Import Excel
            </button>
            <button type="button" className={SS_BTN_OUTLINE} onClick={() => toast.info('Feature coming soon', { module: 'Salary Sheet', description: "More actions coming soon." })}>
              More Actions <ChevronDown className="w-3.5 h-3.5 inline ml-1" />
            </button>
            <button type="button" className={SS_BTN_PRIMARY} onClick={() => toast.info('Feature coming soon', { module: 'Salary Sheet', description: "Summary overview coming soon." })}>
              Summary Overview
            </button>
          </>
        }
      />

      <section className={SS_CARD_CLS}>
        <SalarySheetFilters
          filters={filters}
          departments={departments}
          designations={designations}
          onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
          onReset={() => setFilters(DEFAULT_FILTERS)}
        />
      </section>

      <SalarySheetKpiBar metrics={metrics} />
      <SalarySheetTable rows={rows} filters={filters} onUpdate={handleUpdate} />

      <div className={`${SS_INFO_BOX_CLS} flex gap-3 items-start`}>
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold mb-1.5">How it works</p>
          <ol className="list-decimal list-inside space-y-1 text-xs leading-relaxed">
            <li>Enter or edit all salary details in this sheet.</li>
            <li>Click &apos;Review &amp; Pay&apos; for each employee to verify and approve salary.</li>
            <li>After approval, payslip will be available.</li>
          </ol>
        </div>
      </div>

      <Footer />
    </div>
  );
}
