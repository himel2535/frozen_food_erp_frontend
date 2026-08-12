'use client';

import { useMemo } from 'react';
import { useCustomersApiStore } from '@/hooks/use-customers-module';
import { useApiResourceStore } from '@/hooks/use-api-resource-store';
import { isModuleApiMode } from '@/lib/config/data-source';
import { mapApiEmployeeRow } from '@/lib/services/entity-api-mappers';
import { mapGenericApiRow } from '@/lib/services/generic-api-mapper';
import { listDepartments, listDesignations, listEmployees } from '@/lib/services/hrm-service';
import type { AppState } from '@/lib/state/types';

export type FormOption = { id: string; name: string; company?: string };
export type DesignationOption = { value: string; label: string };

function isActiveMasterRow(row: Record<string, unknown>) {
  const status = String(row.status ?? 'active').trim().toLowerCase();
  return !status || status === 'active';
}

function departmentsMatch(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function useCustomersOptions(): FormOption[] {
  const customersStore = useCustomersApiStore();

  return useMemo(
    () => customersStore.rows.map((c) => ({
      id: String(c.id),
      name: String(c.name ?? ''),
      company: String(c.company ?? ''),
    })),
    [customersStore.rows],
  );
}

export function useSalesPersonOptions(): FormOption[] {
  const employeesStore = useApiResourceStore('employees', mapApiEmployeeRow, { pageOnly: true, lookupLimit: 200 });

  return useMemo(
    () => employeesStore.rows.map((e) => ({
      id: String(e.id),
      name: String(e.name ?? e.id),
    })),
    [employeesStore.rows],
  );
}

export function useHrmDepartmentOptions(appState: AppState): string[] {
  const apiMode = isModuleApiMode('departments');
  const deptStore = useApiResourceStore('departments', mapGenericApiRow, { pageOnly: true, lookupLimit: 200 });

  return useMemo(() => {
    const rows = apiMode && deptStore.initialized
      ? deptStore.rows
      : listDepartments(appState).map((row) => row as Record<string, unknown>);

    const names = rows
      .filter(isActiveMasterRow)
      .map((row) => String(row.name ?? row.title ?? '').trim())
      .filter(Boolean);

    if (names.length === 0) {
      listEmployees(appState).forEach((employee) => {
        const name = String(employee.department ?? '').trim();
        if (name) names.push(name);
      });
    }

    return [...new Set(names)].sort((a, b) => a.localeCompare(b));
  }, [apiMode, deptStore.initialized, deptStore.rows, appState]);
}

export function useHrmDesignationOptions(appState: AppState, department?: string): DesignationOption[] {
  const apiMode = isModuleApiMode('designations');
  const desStore = useApiResourceStore('designations', mapGenericApiRow, { pageOnly: true, lookupLimit: 200 });

  return useMemo(() => {
    const rows = apiMode && desStore.initialized
      ? desStore.rows
      : listDesignations(appState).map((row) => row as Record<string, unknown>);

    const active = rows.filter(isActiveMasterRow);
    const selectedDepartment = (department ?? '').trim();

    const toOption = (row: Record<string, unknown>): DesignationOption | null => {
      const title = String(row.title ?? row.name ?? '').trim();
      if (!title) return null;
      const rowDepartment = String(row.department ?? '').trim();
      const label = rowDepartment && selectedDepartment && !departmentsMatch(rowDepartment, selectedDepartment)
        ? `${title} (${rowDepartment})`
        : title;
      return { value: title, label };
    };

    let matched = active;
    if (selectedDepartment) {
      matched = active.filter((row) => {
        const rowDepartment = String(row.department ?? '').trim();
        return !rowDepartment || departmentsMatch(rowDepartment, selectedDepartment);
      });
      if (matched.length === 0) matched = active;
    }

    const seen = new Set<string>();
    return matched
      .map(toOption)
      .filter((option): option is DesignationOption => Boolean(option))
      .filter((option) => {
        if (seen.has(option.value)) return false;
        seen.add(option.value);
        return true;
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [apiMode, desStore.initialized, desStore.rows, appState, department]);
}
