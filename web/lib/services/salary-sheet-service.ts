import type { AppState } from '@/lib/state/types';
import {
  listFromState,
  createInState,
  updateInState,
  formatCurrency,
} from '@/lib/services/domain-service';
import { listEmployees } from '@/lib/services/hrm-service';
import {
  computePerDaySalary,
  computeTotalFixed,
  getBasicSalaryAmount,
  getSalaryStructureById,
  listSalaryStructures,
  type SalaryComponentRow,
} from '@/lib/services/payroll-service';

type Row = Record<string, unknown>;

export type SalarySheetStatus = 'pending' | 'partial' | 'paid';

export interface SalarySheetEntry {
  id: string;
  period: string;
  employeeId: string;
  structureId: string;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  lateDays: number;
  advanceBalance: number;
  advanceDeduct: number;
  otHours: number;
  bonusPercent: number;
  otherAllowance: number;
  otherDeduction: number;
  status: SalarySheetStatus;
  paidAmount: number;
  payments: Array<{ id: string; amount: number; method: string; date: string; note: string }>;
}

export interface ComputedSheetRow {
  basic: number;
  allowances: number;
  perDay: number;
  absentDeduction: number;
  lateDeduction: number;
  otRate: number;
  otAmount: number;
  bonusAmount: number;
  otherAllowance: number;
  otherDeduction: number;
  advanceDeduct: number;
  totalEarnings: number;
  totalDeductions: number;
  netPayable: number;
  dueAmount: number;
  extraPayType: 'Overtime' | 'Production' | 'Both' | 'None';
}

export function listSalarySheetEntries(state: AppState, period?: string) {
  const rows = listFromState(state, 'salarySheetEntries');
  if (!period) return rows;
  return rows.filter((r) => String(r.period) === period);
}

export function getSheetEntryByEmployee(state: AppState, period: string, employeeId: string) {
  return listSalarySheetEntries(state, period).find((r) => String(r.employeeId) === employeeId) ?? null;
}

export function resolveStructureForEmployee(state: AppState, employeeId: string) {
  const structures = listSalaryStructures(state).filter((s) => String(s.status).toLowerCase() === 'active');
  const assigned = structures.find((s) =>
    Array.isArray(s.assignedEmployeeIds) && (s.assignedEmployeeIds as string[]).includes(employeeId),
  );
  if (assigned) return assigned;

  const employee = listEmployees(state).find((e) => String(e.id) === employeeId);
  const employeeType = String(employee?.employeeType ?? '');
  if (employeeType) {
    const byType = structures.find((s) => String(s.employeeType) === employeeType);
    if (byType) return byType;
  }

  return structures[0] ?? null;
}

export function computeSheetRow(entry: Row, structure: Row): ComputedSheetRow {
  const components = (structure.components as SalaryComponentRow[]) ?? [];
  const basic = getBasicSalaryAmount(components) || Number(structure.base ?? 0);
  const totalFixed = computeTotalFixed(components) || Number(structure.totalFixed ?? basic);
  const allowances = Math.max(0, totalFixed - basic);
  const workingDays = Number(structure.workingDays ?? 26);
  const perDay = computePerDaySalary(basic, workingDays);

  const absentDays = Number(entry.absentDays ?? 0);
  const lateDays = Number(entry.lateDays ?? 0);
  const otHours = Number(entry.otHours ?? 0);
  const bonusPercent = Number(entry.bonusPercent ?? structure.bonusPercent ?? 0);
  const otherAllowance = Number(entry.otherAllowance ?? 0);
  const otherDeduction = Number(entry.otherDeduction ?? 0);
  const advanceDeduct = Number(entry.advanceDeduct ?? 0);

  const absentRule = String(structure.absentDeduction ?? '');
  const absentDeduction = absentRule === 'Per Day Salary' ? absentDays * perDay : 0;

  const lateRule = String(structure.lateDeduction ?? '');
  const lateAmount = Number(structure.lateDeductionAmount ?? 0);
  const lateDeduction = lateRule === 'Per Late (Fixed)' ? lateDays * lateAmount : 0;

  const otEnabled = Boolean(structure.overtimeEnabled);
  const otRate = otEnabled ? Number(structure.otRate ?? 0) : 0;
  const otAmount = otEnabled ? otHours * otRate : 0;

  const bonusEnabled = Boolean(structure.bonusEnabled);
  const bonusAmount = bonusEnabled ? (basic * bonusPercent) / 100 : 0;

  const totalEarnings = basic + otAmount + bonusAmount + otherAllowance;
  const totalDeductions = absentDeduction + lateDeduction + advanceDeduct + otherDeduction;
  const netPayable = Math.max(0, totalEarnings - totalDeductions);
  const paidAmount = Number(entry.paidAmount ?? 0);
  const dueAmount = Math.max(0, netPayable - paidAmount);

  const hasOt = otEnabled && otAmount > 0;
  const hasBonus = bonusEnabled && bonusAmount > 0;
  let extraPayType: ComputedSheetRow['extraPayType'] = 'None';
  if (hasOt && hasBonus) extraPayType = 'Both';
  else if (hasOt) extraPayType = 'Overtime';
  else if (hasBonus) extraPayType = 'Production';

  return {
    basic,
    allowances,
    perDay,
    absentDeduction,
    lateDeduction,
    otRate,
    otAmount,
    bonusAmount,
    otherAllowance,
    otherDeduction,
    advanceDeduct,
    totalEarnings,
    totalDeductions,
    netPayable,
    dueAmount,
    extraPayType,
  };
}

export function buildDefaultSheetEntry(
  state: AppState,
  period: string,
  employeeId: string,
): SalarySheetEntry | null {
  const structure = resolveStructureForEmployee(state, employeeId);
  if (!structure) return null;
  return {
    id: '',
    period,
    employeeId,
    structureId: String(structure.id),
    presentDays: Number(structure.workingDays ?? 26),
    absentDays: 0,
    leaveDays: 0,
    lateDays: 0,
    advanceBalance: 0,
    advanceDeduct: 0,
    otHours: 0,
    bonusPercent: Number(structure.bonusPercent ?? 0),
    otherAllowance: 0,
    otherDeduction: 0,
    status: 'pending',
    paidAmount: 0,
    payments: [],
  };
}

export function getOrCreateSheetEntry(state: AppState, period: string, employeeId: string) {
  const existing = getSheetEntryByEmployee(state, period, employeeId);
  if (existing) return existing;

  const draft = buildDefaultSheetEntry(state, period, employeeId);
  if (!draft) return null;

  const result = createInState(state, 'salarySheetEntries', draft as unknown as Row, 'SSE');
  if (!result.ok) return null;
  return getSheetEntryByEmployee(state, period, employeeId);
}

export function updateSheetEntry(state: AppState, id: string, patch: Partial<SalarySheetEntry>) {
  if (patch.status !== 'paid' && patch.status !== 'partial') {
    const existing = listSalarySheetEntries(state).find((r) => String(r.id) === id);
    if (existing && String(existing.status) === 'paid') {
      return { ok: false as const, error: 'Paid salary sheet rows cannot be edited.' };
    }
  }
  return updateInState(state, 'salarySheetEntries', id, patch as unknown as Row);
}

export function getSheetMetrics(computedRows: ComputedSheetRow[]) {
  return {
    totalEmployees: computedRows.length,
    presentManDays: computedRows.reduce((s, _r, i) => s, 0),
    absentManDays: 0,
    otHours: computedRows.reduce((s, r) => s + 0, 0),
    otAmount: computedRows.reduce((s, r) => s + r.otAmount, 0),
    productionBonus: computedRows.reduce((s, r) => s + r.bonusAmount, 0),
    netPayable: computedRows.reduce((s, r) => s + r.netPayable, 0),
  };
}

export function getSheetMetricsFromEntries(
  entries: Row[],
  structures: Record<string, Row>,
) {
  let presentManDays = 0;
  let absentManDays = 0;
  let otHours = 0;
  let otAmount = 0;
  let productionBonus = 0;
  let netPayable = 0;

  entries.forEach((entry) => {
    const structure = structures[String(entry.structureId)] ?? {};
    const computed = computeSheetRow(entry, structure);
    presentManDays += Number(entry.presentDays ?? 0);
    absentManDays += Number(entry.absentDays ?? 0);
    otHours += Number(entry.otHours ?? 0);
    otAmount += computed.otAmount;
    productionBonus += computed.bonusAmount;
    netPayable += computed.netPayable;
  });

  return {
    totalEmployees: entries.length,
    presentManDays,
    absentManDays,
    otHours,
    otAmount,
    productionBonus,
    netPayable,
  };
}

export function approveAndPay(
  state: AppState,
  entryId: string,
  payment: { amount: number; method: string; date: string; note?: string },
) {
  const entry = listSalarySheetEntries(state).find((r) => String(r.id) === entryId);
  if (!entry) return { ok: false as const, error: 'Salary sheet entry not found.' };
  if (String(entry.status) === 'paid') return { ok: false as const, error: 'Salary already paid.' };

  const structure = getSalaryStructureById(state, String(entry.structureId)) ?? {};
  const computed = computeSheetRow(entry, structure);
  const payAmount = Math.min(Math.max(0, payment.amount), computed.dueAmount || computed.netPayable);
  if (payAmount <= 0) return { ok: false as const, error: 'Pay amount must be greater than zero.' };

  const paymentRecord = {
    id: `PAYM-${Date.now().toString(36)}`,
    amount: payAmount,
    method: payment.method,
    date: payment.date,
    note: payment.note ?? '',
  };

  const paidAmount = Number(entry.paidAmount ?? 0) + payAmount;
  const dueAfter = Math.max(0, computed.netPayable - paidAmount);
  const status: SalarySheetStatus = dueAfter <= 0 ? 'paid' : 'partial';

  const payments = Array.isArray(entry.payments) ? [...entry.payments, paymentRecord] : [paymentRecord];
  const updateResult = updateInState(state, 'salarySheetEntries', entryId, {
    paidAmount,
    payments,
    status,
  });
  if (!updateResult.ok) return updateResult;

  const employee = listEmployees(state).find((e) => String(e.id) === String(entry.employeeId));
  createInState(state, 'payroll', {
    employeeId: entry.employeeId,
    name: String(employee?.name ?? 'Employee'),
    period: entry.period,
    base: computed.basic,
    allowances: computed.otAmount + computed.bonusAmount + computed.otherAllowance,
    deductions: computed.totalDeductions,
    net: payAmount,
    date: payment.date,
    status: status === 'paid' ? 'Disbursed' : 'Partial',
    sheetEntryId: entryId,
  }, 'PAY');

  return { ok: true as const, status, paidAmount, dueAmount: dueAfter };
}

export function listSheetEmployees(state: AppState) {
  return listEmployees(state).filter((e) => {
    const status = String(e.status ?? '').toLowerCase();
    return status === 'active' || status === 'on-leave';
  });
}

export function amountInWords(amount: number): string {
  const n = Math.round(amount);
  if (n === 0) return 'Zero Taka Only';
  return `${n.toLocaleString('en-US')} Taka Only`;
}

export type PaymentRecord = { id: string; amount: number; method: string; date: string; note: string };

export type PaymentsDueRow = {
  entry: Row;
  employee: Row;
  structure: Row;
  computed: ComputedSheetRow;
  lastPayment: PaymentRecord | null;
  displayStatus: 'paid' | 'partial' | 'unpaid' | 'notProcessed';
};

function getLastPayment(entry: Row): PaymentRecord | null {
  const payments = Array.isArray(entry.payments) ? entry.payments as PaymentRecord[] : [];
  if (!payments.length) return null;
  return [...payments].sort((a, b) => String(b.date).localeCompare(String(a.date)))[0] ?? null;
}

function resolveDisplayStatus(entry: Row, computed: ComputedSheetRow): PaymentsDueRow['displayStatus'] {
  const status = String(entry.status ?? 'pending') as SalarySheetStatus;
  if (computed.netPayable <= 0) return 'notProcessed';
  if (status === 'paid') return 'paid';
  if (status === 'partial') return 'partial';
  return 'unpaid';
}

export function listPaymentsDueRows(state: AppState, period: string): PaymentsDueRow[] {
  return listSheetEmployees(state).map((employee) => {
    const employeeId = String(employee.id);
    const entry = getOrCreateSheetEntry(state, period, employeeId);
    if (!entry) {
      return {
        entry: { employeeId, period, status: 'pending', paidAmount: 0, payments: [] },
        employee,
        structure: {},
        computed: {
          basic: 0, allowances: 0, perDay: 0, absentDeduction: 0, lateDeduction: 0,
          otRate: 0, otAmount: 0, bonusAmount: 0, otherAllowance: 0, otherDeduction: 0,
          advanceDeduct: 0, totalEarnings: 0, totalDeductions: 0, netPayable: 0, dueAmount: 0,
          extraPayType: 'None',
        },
        lastPayment: null,
        displayStatus: 'notProcessed' as const,
      };
    }
    const structure = getSalaryStructureById(state, String(entry.structureId)) ?? {};
    const computed = computeSheetRow(entry, structure);
    return {
      entry,
      employee,
      structure,
      computed,
      lastPayment: getLastPayment(entry),
      displayStatus: resolveDisplayStatus(entry, computed),
    };
  });
}

export function getPaymentsDueMetrics(rows: PaymentsDueRow[]) {
  const totalPayable = rows.reduce((s, r) => s + r.computed.netPayable, 0);
  const paidAmount = rows.reduce((s, r) => s + Number(r.entry.paidAmount ?? 0), 0);
  const totalDue = rows.reduce((s, r) => s + r.computed.dueAmount, 0);
  const partialCount = rows.filter((r) => r.displayStatus === 'partial').length;
  const unpaidCount = rows.filter((r) => r.displayStatus === 'unpaid').length;
  const paidPercent = totalPayable > 0 ? (paidAmount / totalPayable) * 100 : 0;

  return {
    totalEmployees: rows.length,
    totalPayable,
    paidAmount,
    paidPercent,
    partialCount,
    unpaidCount,
    totalDue,
  };
}

export function getPaymentStatusSummary(rows: PaymentsDueRow[]) {
  return {
    paid: rows.filter((r) => r.displayStatus === 'paid').length,
    partial: rows.filter((r) => r.displayStatus === 'partial').length,
    unpaid: rows.filter((r) => r.displayStatus === 'unpaid').length,
    notProcessed: rows.filter((r) => r.displayStatus === 'notProcessed').length,
    total: rows.length,
  };
}

function periodEndDate(period: string) {
  const [y, m] = period.split('-').map(Number);
  return new Date(y, m, 0);
}

function daysBetween(a: Date, b: Date) {
  const ms = b.getTime() - a.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export function getDueAgingBreakdown(rows: PaymentsDueRow[], asOfDate = new Date()) {
  let dueWithin7 = 0;
  let due8to15 = 0;
  let dueOver15 = 0;

  rows.forEach((row) => {
    const due = row.computed.dueAmount;
    if (due <= 0) return;
    const period = String(row.entry.period ?? '');
    const end = periodEndDate(period);
    const daysOverdue = daysBetween(end, asOfDate);
    if (daysOverdue <= 7) dueWithin7 += due;
    else if (daysOverdue <= 15) due8to15 += due;
    else dueOver15 += due;
  });

  const totalDue = dueWithin7 + due8to15 + dueOver15;
  return { totalDue, dueWithin7, due8to15, dueOver15 };
}

export function listRecentPayments(state: AppState, period: string, limit = 3) {
  const entries = listSalarySheetEntries(state, period);
  const employees = listEmployees(state);
  const flat: Array<PaymentRecord & { employeeId: string; employeeName: string }> = [];

  entries.forEach((entry) => {
    const payments = Array.isArray(entry.payments) ? entry.payments as PaymentRecord[] : [];
    const emp = employees.find((e) => String(e.id) === String(entry.employeeId));
    payments.forEach((p) => {
      flat.push({
        ...p,
        employeeId: String(entry.employeeId),
        employeeName: String(emp?.name ?? 'Employee'),
      });
    });
  });

  return flat
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, limit);
}

export { formatCurrency as formatMoney };
