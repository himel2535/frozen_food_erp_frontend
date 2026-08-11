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
  const trimmed = id.trim();
  if (!trimmed) return null;
  const row = listSalaryStructures(state).find(
    (item) =>
      String(item.id) === trimmed
      || String(item.legacyId ?? '') === trimmed
      || String(item.code ?? '') === trimmed,
  ) ?? null;
  return row ? enrichSalaryStructureRecord(row) : null;
}

export function enrichSalaryStructureRecord(payload: Row): Row {
  const components = (payload.components as SalaryComponentRow[]) ?? [];
  const base = getBasicSalaryAmount(components);
  const totalFixed = computeTotalFixed(components);
  return {
    ...payload,
    base,
    allowances: Math.max(0, totalFixed - base),
    totalFixed,
    assignedCount: Array.isArray(payload.assignedEmployeeIds) ? payload.assignedEmployeeIds.length : 0,
  };
}

export function getAssignedEmployees(state: AppState, ids: string[]) {
  const employees = listEmployees(state);
  return ids
    .map((id) => employees.find((e) => String(e.id) === id))
    .filter(Boolean) as Row[];
}

export function parseSalaryAmount(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const str = String(value ?? '').trim();
  if (!str) return 0;
  const match = str.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  if (!match) return 0;
  const num = Number(match[0]);
  return Number.isFinite(num) ? num : 0;
}

export function getBasicSalaryAmount(components: SalaryComponentRow[]) {
  const basic = components.find((c) => String(c.name ?? '').toLowerCase().includes('basic'));
  if (basic) {
    const amount = parseSalaryAmount(basic.amount);
    if (amount > 0) return amount;
  }
  for (const row of components) {
    const calc = String(row.calculation ?? '').toLowerCase();
    const type = String(row.type ?? '').toLowerCase();
    if (calc === 'fixed' || type.includes('fixed')) {
      const amount = parseSalaryAmount(row.amount);
      if (amount > 0) return amount;
    }
  }
  return 0;
}

export function resolveBasicSalary(structure: Row, employee?: Row | null): number {
  const components = (structure.components as SalaryComponentRow[]) ?? [];
  const fromComponents = getBasicSalaryAmount(components);
  if (fromComponents > 0) return fromComponents;
  const fromBase = parseSalaryAmount(structure.base);
  if (fromBase > 0) return fromBase;
  const fromTotal = parseSalaryAmount(structure.totalFixed);
  if (fromTotal > 0) return fromTotal;
  return parseSalaryAmount(employee?.salary);
}

export function computePerDaySalary(basicAmount: number, workingDays: number) {
  if (!workingDays || !basicAmount) return 0;
  return basicAmount / workingDays;
}

export function computeTotalFixed(components: SalaryComponentRow[]) {
  const basic = getBasicSalaryAmount(components);
  return components.reduce((sum, row) => {
    const amount = parseSalaryAmount(row.amount);
    if (row.calculation === '% of Basic' || row.type === 'Percentage (%)') {
      return sum + (basic * amount) / 100;
    }
    return sum + amount;
  }, 0);
}

export function createSalaryStructure(state: AppState, payload: Row) {
  return createInState(state, 'salaryStructures', enrichSalaryStructureRecord(payload), 'SS');
}

export function updateSalaryStructure(state: AppState, id: string, payload: Row) {
  return updateInState(state, 'salaryStructures', id, enrichSalaryStructureRecord(payload));
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
