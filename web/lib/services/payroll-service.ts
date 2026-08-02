import type { AppState } from '@/lib/state/types';
import {
  listFromState,
  createInState,
  updateInState,
  deleteFromState,
  formatCurrency,
} from '@/lib/services/domain-service';
import { listEmployees } from '@/lib/services/hrm-service';

type Row = Record<string, unknown>;

export interface SalaryComponentRow {
  id: string;
  name: string;
  type: string;
  calculation: string;
  amount: string;
}

export function listSalaryStructures(state: AppState) {
  return listFromState(state, 'salaryStructures');
}

export function getSalaryStructureById(state: AppState, id: string) {
  return listSalaryStructures(state).find((row) => String(row.id) === id) ?? null;
}

export function getAssignedEmployees(state: AppState, ids: string[]) {
  const employees = listEmployees(state);
  return ids
    .map((id) => employees.find((e) => String(e.id) === id))
    .filter(Boolean) as Row[];
}

export function getBasicSalaryAmount(components: SalaryComponentRow[]) {
  const basic = components.find((c) => c.name.toLowerCase().includes('basic'));
  return Number(basic?.amount ?? 0);
}

export function computePerDaySalary(basicAmount: number, workingDays: number) {
  if (!workingDays || !basicAmount) return 0;
  return basicAmount / workingDays;
}

export function computeTotalFixed(components: SalaryComponentRow[]) {
  const basic = getBasicSalaryAmount(components);
  return components.reduce((sum, row) => {
    const amount = Number(row.amount || 0);
    if (row.calculation === '% of Basic' || row.type === 'Percentage (%)') {
      return sum + (basic * amount) / 100;
    }
    return sum + amount;
  }, 0);
}

export function createSalaryStructure(state: AppState, payload: Row) {
  const totalFixed = computeTotalFixed((payload.components as SalaryComponentRow[]) ?? []);
  return createInState(state, 'salaryStructures', {
    ...payload,
    base: getBasicSalaryAmount((payload.components as SalaryComponentRow[]) ?? []),
    allowances: Math.max(0, totalFixed - getBasicSalaryAmount((payload.components as SalaryComponentRow[]) ?? [])),
    totalFixed,
  }, 'SS');
}

export function updateSalaryStructure(state: AppState, id: string, payload: Row) {
  const totalFixed = computeTotalFixed((payload.components as SalaryComponentRow[]) ?? []);
  return updateInState(state, 'salaryStructures', id, {
    ...payload,
    base: getBasicSalaryAmount((payload.components as SalaryComponentRow[]) ?? []),
    allowances: Math.max(0, totalFixed - getBasicSalaryAmount((payload.components as SalaryComponentRow[]) ?? [])),
    totalFixed,
  });
}

export function deleteSalaryStructure(state: AppState, id: string) {
  return deleteFromState(state, 'salaryStructures', id);
}

export function previewSalaryStructureId(state: AppState) {
  const rows = listSalaryStructures(state);
  const nums = rows
    .map((r) => Number(String(r.id).replace(/\D/g, '')))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `SS-${String(next).padStart(3, '0')}`;
}

function structureTotalFixed(row: Row) {
  const total = Number(row.totalFixed ?? 0);
  if (total) return total;
  return Number(row.base ?? 0) + Number(row.allowances ?? 0);
}

function assignedCount(row: Row) {
  return Array.isArray(row.assignedEmployeeIds) ? row.assignedEmployeeIds.length : 0;
}

export function getSalaryStructureMetrics(rows: Row[]) {
  const activeRows = rows.filter((r) => String(r.status).toLowerCase() === 'active');
  const inactive = rows.filter((r) => String(r.status).toLowerCase() === 'inactive').length;
  const assignedEmployees = activeRows.reduce((sum, r) => sum + assignedCount(r), 0);
  const monthlyPayroll = activeRows.reduce((sum, r) => sum + structureTotalFixed(r), 0);
  const avgBase = activeRows.length
    ? activeRows.reduce((sum, r) => sum + Number(r.base ?? 0), 0) / activeRows.length
    : 0;
  const withOvertime = activeRows.filter((r) => Boolean(r.overtimeEnabled)).length;
  return {
    total: rows.length,
    active: activeRows.length,
    inactive,
    assignedEmployees,
    monthlyPayroll,
    avgBase,
    withOvertime,
  };
}

export { formatCurrency as formatMoney };
