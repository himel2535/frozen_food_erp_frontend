import type { SalaryComponentRow } from '@/lib/services/payroll-service';

export type SalarySetupFormValues = {
  name: string;
  code: string;
  employeeType: string;
  status: string;
  effectiveFrom: string;
  payFrequency: string;
  description: string;
  components: SalaryComponentRow[];
  workingDays: string;
  absentDeduction: string;
  halfDayDeduction: string;
  lateDeduction: string;
  lateDeductionAmount: string;
  overtimeEnabled: boolean;
  otRateType: string;
  otRate: string;
  holidayOtRate: string;
  weeklyOffOtRate: string;
  bonusEnabled: boolean;
  bonusType: string;
  bonusOn: string;
  bonusPercent: string;
  assignedEmployeeIds: string[];
};

export type SalarySetupFormPayload = SalarySetupFormValues & {
  id?: string;
  previewId?: string;
};

export const EMPTY_SALARY_COMPONENT: SalaryComponentRow = {
  id: '',
  name: '',
  type: 'Fixed Amount',
  calculation: 'Fixed',
  amount: '0',
};

export const DEFAULT_SALARY_COMPONENTS: SalaryComponentRow[] = [
  { id: 'c1', name: 'Basic Salary', type: 'Fixed Amount', calculation: 'Fixed', amount: '18000' },
  { id: 'c2', name: 'House Rent Allowance', type: 'Percentage (%)', calculation: '% of Basic', amount: '15' },
  { id: 'c3', name: 'Medical Allowance', type: 'Fixed Amount', calculation: 'Fixed', amount: '1000' },
  { id: 'c4', name: 'Transport Allowance', type: 'Fixed Amount', calculation: 'Fixed', amount: '1200' },
  { id: 'c5', name: 'Food Allowance', type: 'Fixed Amount', calculation: 'Fixed', amount: '1500' },
  { id: 'c6', name: 'Other Allowance', type: 'Fixed Amount', calculation: 'Fixed', amount: '0' },
];

export const EMPTY_SALARY_SETUP_FORM: SalarySetupFormValues = {
  name: 'Factory Worker',
  code: 'FW-001',
  employeeType: 'Worker',
  status: 'active',
  effectiveFrom: new Date().toISOString().split('T')[0],
  payFrequency: 'Monthly',
  description: '',
  components: DEFAULT_SALARY_COMPONENTS.map((c) => ({ ...c })),
  workingDays: '26',
  absentDeduction: 'Per Day Salary',
  halfDayDeduction: '50% of Per Day',
  lateDeduction: 'Per Late (Fixed)',
  lateDeductionAmount: '50',
  overtimeEnabled: true,
  otRateType: 'Per Hour',
  otRate: '100',
  holidayOtRate: '150',
  weeklyOffOtRate: '120',
  bonusEnabled: true,
  bonusType: 'Percentage (%)',
  bonusOn: 'Basic Salary',
  bonusPercent: '10',
  assignedEmployeeIds: [],
};

export function recordToSalarySetupFormValues(record: Record<string, unknown>): SalarySetupFormValues {
  const components = Array.isArray(record.components)
    ? (record.components as SalaryComponentRow[]).map((c, i) => ({
        id: String(c.id ?? `c${i + 1}`),
        name: String(c.name ?? ''),
        type: String(c.type ?? 'Fixed Amount'),
        calculation: String(c.calculation ?? 'Fixed'),
        amount: String(c.amount ?? '0'),
      }))
    : DEFAULT_SALARY_COMPONENTS.map((c) => ({ ...c }));

  return {
    name: String(record.name ?? ''),
    code: String(record.code ?? ''),
    employeeType: String(record.employeeType ?? 'Worker'),
    status: String(record.status ?? 'active'),
    effectiveFrom: String(record.effectiveFrom ?? '').split('T')[0],
    payFrequency: String(record.payFrequency ?? 'Monthly'),
    description: String(record.description ?? ''),
    components,
    workingDays: String(record.workingDays ?? '26'),
    absentDeduction: String(record.absentDeduction ?? 'Per Day Salary'),
    halfDayDeduction: String(record.halfDayDeduction ?? '50% of Per Day'),
    lateDeduction: String(record.lateDeduction ?? 'Per Late (Fixed)'),
    lateDeductionAmount: String(record.lateDeductionAmount ?? '50'),
    overtimeEnabled: Boolean(record.overtimeEnabled ?? true),
    otRateType: String(record.otRateType ?? 'Per Hour'),
    otRate: String(record.otRate ?? '100'),
    holidayOtRate: String(record.holidayOtRate ?? '150'),
    weeklyOffOtRate: String(record.weeklyOffOtRate ?? '120'),
    bonusEnabled: Boolean(record.bonusEnabled ?? true),
    bonusType: String(record.bonusType ?? 'Percentage (%)'),
    bonusOn: String(record.bonusOn ?? 'Basic Salary'),
    bonusPercent: String(record.bonusPercent ?? '10'),
    assignedEmployeeIds: Array.isArray(record.assignedEmployeeIds)
      ? record.assignedEmployeeIds.map(String)
      : [],
  };
}

export function payloadToRecord(payload: SalarySetupFormPayload) {
  return {
    id: payload.id ?? payload.previewId,
    code: payload.code,
    name: payload.name,
    employeeType: payload.employeeType,
    status: payload.status,
    effectiveFrom: payload.effectiveFrom,
    payFrequency: payload.payFrequency,
    description: payload.description,
    components: payload.components,
    workingDays: Number(payload.workingDays || 26),
    absentDeduction: payload.absentDeduction,
    halfDayDeduction: payload.halfDayDeduction,
    lateDeduction: payload.lateDeduction,
    lateDeductionAmount: Number(payload.lateDeductionAmount || 0),
    overtimeEnabled: payload.overtimeEnabled,
    otRateType: payload.otRateType,
    otRate: Number(payload.otRate || 0),
    holidayOtRate: Number(payload.holidayOtRate || 0),
    weeklyOffOtRate: Number(payload.weeklyOffOtRate || 0),
    bonusEnabled: payload.bonusEnabled,
    bonusType: payload.bonusType,
    bonusOn: payload.bonusOn,
    bonusPercent: Number(payload.bonusPercent || 0),
    assignedEmployeeIds: payload.assignedEmployeeIds,
  };
}

export function createComponentId() {
  return `c${Date.now().toString(36)}`;
}
