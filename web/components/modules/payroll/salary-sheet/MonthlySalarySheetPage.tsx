'use client';

import { toast } from '@/lib/ui/feedback';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Info, Upload } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { SalarySheetFilters } from '@/components/modules/payroll/salary-sheet/SalarySheetFilters';
import { SalarySheetKpiBar } from '@/components/modules/payroll/salary-sheet/SalarySheetKpiBar';
import { SalarySheetTable } from '@/components/modules/payroll/salary-sheet/SalarySheetTable';
import {
  SS_BTN_OUTLINE,
  SS_BTN_PRIMARY,
  SS_INFO_BOX_CLS,
} from '@/components/modules/payroll/salary-sheet/salary-sheet-styles';
import {
  defaultPeriod,
  type SheetFilterState,
  type SheetRowView,
} from '@/components/modules/payroll/salary-sheet/salary-sheet-types';
import { useAppStore } from '@/lib/state/app-store';
import { isModuleApiMode } from '@/lib/config/data-source';
import { useApiResourceStore } from '@/hooks/use-api-resource-store';
import { mapGenericApiRow, mapGenericPayloadToApi } from '@/lib/services/generic-api-mapper';
import { resolveApiRowId } from '@/lib/services/entity-api-mappers';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { enrichSalaryStructureRecord } from '@/lib/services/payroll-service';
import {
  buildDefaultSheetEntry,
  computeSheetRow,
  getSheetMetricsFromEntries,
  listSalarySheetEntries,
  listSheetEmployees,
  normalizeSheetEntry,
  updateSheetEntry,
} from '@/lib/services/salary-sheet-service';
import type { AppState } from '@/lib/state/types';

const DEFAULT_FILTERS: SheetFilterState = {
  period: defaultPeriod(),
  department: 'all',
  designation: 'all',
  search: '',
};

function isPendingEntryId(id: string) {
  return id.startsWith('pending-');
}

function cloneSheetState(state: AppState): AppState {
  return {
    ...state,
    salarySheetEntries: (state.salarySheetEntries ?? []).map((row) => ({ ...row })),
  } as AppState;
}

function pickLatestSheetEntry(entries: Record<string, unknown>[], employeeId: string) {
  const matches = entries.filter((entry) => String(entry.employeeId) === employeeId);
  if (!matches.length) return null;
  return [...matches].sort((a, b) => {
    const aTime = Date.parse(String(a.updatedAt ?? a.createdAt ?? '')) || 0;
    const bTime = Date.parse(String(b.updatedAt ?? b.createdAt ?? '')) || 0;
    return bTime - aTime;
  })[0] ?? null;
}

function empDraftKey(employeeId: string, period: string) {
  return `${employeeId}:${period}`;
}

export function MonthlySalarySheetPage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const replaceAppState = useAppStore((s) => s.replaceAppState);
  const apiDataReady = useAppStore((s) => s.apiDataReady);
  const apiMode = isModuleApiMode('salarySheet');
  const apiStore = useApiResourceStore('salarySheet', mapGenericApiRow);
  const structureStore = useApiResourceStore('salaryStructures', (doc) =>
    enrichSalaryStructureRecord(mapGenericApiRow(doc)),
  );
  const [filters, setFilters] = useState<SheetFilterState>(DEFAULT_FILTERS);
  const [sheetBootstrapping, setSheetBootstrapping] = useState(apiMode);
  const [draftByEmployee, setDraftByEmployee] = useState<Record<string, Record<string, unknown>>>({});
  const bootstrapKeyRef = useRef('');

  useEffect(() => {
    setDraftByEmployee({});
  }, [filters.period]);

  const sheetState = useMemo(() => {
    if (!apiMode) return appState;
    const salaryStructures = structureStore.initialized
      ? structureStore.rows.map((row) => enrichSalaryStructureRecord(row))
      : (appState.salaryStructures ?? []);
    const salarySheetEntries = apiStore.initialized ? apiStore.rows : [];
    return { ...appState, salaryStructures, salarySheetEntries } as AppState;
  }, [apiMode, apiStore.initialized, apiStore.rows, structureStore.initialized, structureStore.rows, appState]);

  const employees = useMemo(() => listSheetEmployees(sheetState), [sheetState]);

  useEffect(() => {
    if (!apiMode || !apiDataReady || !apiStore.initialized) return;
    const bootstrapKey = `${filters.period}:${employees.map((e) => String(e.id)).join(',')}`;
    if (bootstrapKeyRef.current === bootstrapKey) {
      setSheetBootstrapping(false);
      return;
    }

    let cancelled = false;
    setSheetBootstrapping(true);

    void (async () => {
      for (const emp of employees) {
        if (cancelled) return;
        const employeeId = String(emp.id);
        const exists = pickLatestSheetEntry(
          apiStore.rows as Record<string, unknown>[],
          employeeId,
        );
        if (exists && String(exists.period) === filters.period) continue;

        const draft = buildDefaultSheetEntry(sheetState, filters.period, employeeId);
        if (!draft) continue;

        await apiStore.create(mapGenericPayloadToApi(draft as unknown as Record<string, unknown>));
      }

      if (!cancelled) {
        bootstrapKeyRef.current = bootstrapKey;
        setSheetBootstrapping(false);
      }
    })();

    return () => { cancelled = true; };
  }, [apiMode, apiDataReady, apiStore, employees, filters.period, sheetState]);

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
    const entries = listSalarySheetEntries(sheetState, filters.period);
    return filteredEmployees.map((employee) => {
      const employeeId = String(employee.id);
      const existing = pickLatestSheetEntry(entries as Record<string, unknown>[], employeeId);
      const draft = existing ?? buildDefaultSheetEntry(sheetState, filters.period, employeeId);
      if (!draft) return null;

      const localPatch = draftByEmployee[empDraftKey(employeeId, filters.period)] ?? {};
      const entry: Record<string, unknown> = {
        ...(draft as Record<string, unknown>),
        ...localPatch,
        id: String((draft as { id?: string }).id || `pending-${employeeId}-${filters.period}`),
      };

      const { entry: normalizedEntry, structure } = normalizeSheetEntry(
        sheetState,
        entry,
        employee as Record<string, unknown>,
      );

      return {
        entry: normalizedEntry,
        employee,
        structure,
        computed: computeSheetRow(normalizedEntry, structure, employee),
      };
    }).filter(Boolean) as SheetRowView[];
  }, [sheetState, filteredEmployees, filters.period, draftByEmployee]);

  const metrics = useMemo(() => {
    const structureMap: Record<string, Record<string, unknown>> = {};
    const employeesById: Record<string, Record<string, unknown>> = {};
    rows.forEach((r) => {
      structureMap[String(r.entry.structureId)] = r.structure;
      employeesById[String(r.employee.id)] = r.employee as Record<string, unknown>;
    });
    return getSheetMetricsFromEntries(rows.map((r) => r.entry), structureMap, employeesById);
  }, [rows]);

  const handleUpdate = useCallback(async (entryId: string, employeeId: string, patch: Record<string, unknown>) => {
    const draftKey = empDraftKey(employeeId, filters.period);
    setDraftByEmployee((prev) => ({
      ...prev,
      [draftKey]: { ...(prev[draftKey] ?? {}), ...patch },
    }));

    const clearDraft = () => {
      setDraftByEmployee((prev) => {
        if (!prev[draftKey]) return prev;
        const next = { ...prev };
        delete next[draftKey];
        return next;
      });
    };

    if (apiMode) {
      if (isPendingEntryId(entryId)) {
        const draft = buildDefaultSheetEntry(sheetState, filters.period, employeeId);
        if (!draft) {
          toast.error('Operation failed', { module: 'Salary Sheet', description: 'No salary structure assigned for this employee.' });
          return;
        }
        const createResult = await apiStore.create(mapGenericPayloadToApi({ ...draft, ...patch } as Record<string, unknown>));
        if (!createResult.ok) {
          toast.error('Operation failed', { module: 'Salary Sheet', description: 'error' in createResult ? String(createResult.error) : 'Create failed' });
          return;
        }
        clearDraft();
        return;
      }

      const pseudo = cloneSheetState(sheetState);
      let result = updateSheetEntry(pseudo, entryId, patch);
      if (!result.ok) {
        const fallback = pickLatestSheetEntry(
          pseudo.salarySheetEntries as Record<string, unknown>[],
          employeeId,
        );
        if (fallback) {
          result = updateSheetEntry(pseudo, String(fallback.id), patch);
        }
      }
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Salary Sheet', description: String(result.error ?? 'Update failed') });
        return;
      }

      const updated = pickLatestSheetEntry(
        listSalarySheetEntries(pseudo, filters.period) as Record<string, unknown>[],
        employeeId,
      );
      if (updated) {
        const row = apiStore.rows.find(
          (item) =>
            String(item.id) === String(updated.id)
            || String(item.legacyId) === String(updated.id)
            || String(item.employeeId) === employeeId,
        );
        const apiId = row ? resolveApiRowId(row) : String(updated.id);
        const sync = await apiStore.update(apiId, mapGenericPayloadToApi(updated as Record<string, unknown>));
        if (!sync.ok) {
          toast.error('Operation failed', { module: 'Salary Sheet', description: 'error' in sync ? String(sync.error) : 'Sync failed' });
          return;
        }
        clearDraft();
      }
      return;
    }
    const pseudo = cloneSheetState(appState);
    let result = updateSheetEntry(pseudo, entryId, patch);
    if (!result.ok) {
      const fallback = pickLatestSheetEntry(
        pseudo.salarySheetEntries as Record<string, unknown>[],
        employeeId,
      );
      if (fallback) {
        result = updateSheetEntry(pseudo, String(fallback.id), patch);
      }
    }
    if (!result.ok) {
      toast.error('Operation failed', { module: 'Salary Sheet', description: String(result.error ?? 'Update failed') });
      return;
    }
    replaceAppState({ salarySheetEntries: pseudo.salarySheetEntries });
    saveAppState({ immediate: true });
    clearDraft();
  }, [apiMode, sheetState, apiStore, appState, replaceAppState, saveAppState, filters.period]);

  useRegisterModuleActions(
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
    </>,
    [],
  );

  if (apiMode && (!apiDataReady || sheetBootstrapping || !apiStore.initialized || !structureStore.initialized)) {
    return <PageSkeleton variant="module-list" label="Loading salary sheet" />;
  }

  return (
    <div className="space-y-4">
      {apiStore.error ? <ApiModeBanner module="salarySheet" error={apiStore.error} /> : null}
      <SalarySheetKpiBar metrics={metrics} />

      <SalarySheetFilters
        filters={filters}
        departments={departments}
        designations={designations}
        onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

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
