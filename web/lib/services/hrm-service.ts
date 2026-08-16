import type { AppState } from '@/lib/state/types';
import { formatAppDate } from '@/lib/i18n/locale-format';
import { listFromState, createInState, updateInState, deleteFromState, formatCurrency } from '@/lib/services/domain-service';
import { getSalaryStructureById } from '@/lib/services/payroll-service';

type Row = Record<string, unknown>;

export interface EmployeeDetailMetrics {
  tenureMonths: number;
  tenureLabel: string;
  attendancePresentRate: number;
  lastPayrollNet: number;
  lastPayrollDate: string;
  assignedProjects: number;
}

export interface EmployeeProfile {
  employee: Row;
  attendance: Row[];
  payrollSlips: Row[];
  projects: Row[];
  departmentInfo: Row | null;
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
];

export function listEmployees(state: AppState) {
  return listFromState(state, 'employees');
}

export function getEmployeeById(state: AppState, id: string) {
  return listEmployees(state).find((row) => String(row.id) === id) ?? null;
}

export function listDepartments(state: AppState) {
  return listFromState(state, 'departments');
}

export function listDesignations(state: AppState) {
  return listFromState(state, 'designations');
}

export function listAttendance(state: AppState) {
  return listFromState(state, 'attendance');
}

export function listLeaveRequests(state: AppState) {
  return listFromState(state, 'leaveRequests');
}

export function listSalaryStructures(state: AppState) {
  return listFromState(state, 'salaryStructures');
}

export function listPayrollRuns(state: AppState) {
  return listFromState(state, 'payrollRuns');
}

export function listPayrollSlips(state: AppState) {
  return listFromState(state, 'payroll');
}

export function employeeInitials(name: string) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function employeeAvatarClass(name: string) {
  const code = String(name).split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

export function employeeStatusLabel(status: unknown) {
  const value = String(status ?? 'active').toLowerCase();
  if (value === 'on-leave') return 'On Leave';
  if (value === 'inactive') return 'Inactive';
  return 'Active';
}

export function formatTenure(joiningDate: unknown) {
  if (!joiningDate) return '—';
  const start = new Date(String(joiningDate));
  if (Number.isNaN(start.getTime())) return '—';
  const now = new Date();
  const months = Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()));
  if (months < 12) return `${months} month${months === 1 ? '' : 's'}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (!rem) return `${years} year${years === 1 ? '' : 's'}`;
  return `${years}y ${rem}m`;
}

export function monthsSinceJoining(joiningDate: unknown) {
  if (!joiningDate) return 0;
  const start = new Date(String(joiningDate));
  if (Number.isNaN(start.getTime())) return 0;
  const now = new Date();
  return Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()));
}

export function formatEmployeeDate(value: unknown) {
  if (!value) return '—';
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return formatAppDate(d, { day: '2-digit', month: 'short', year: 'numeric' });
}

function getEmployeePayrollSlips(state: AppState, employee: Row) {
  const id = String(employee.id ?? '');
  const name = String(employee.name ?? '');
  return listPayrollSlips(state)
    .filter((row) => String(row.employeeId ?? '') === id || String(row.name ?? '') === name)
    .sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')));
}

export function getEmployeeProfile(state: AppState, id: string): EmployeeProfile | null {
  const employee = getEmployeeById(state, id);
  if (!employee) return null;

  const attendance = listAttendance(state)
    .filter((row) => String(row.employeeId) === id)
    .sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')));

  const payrollSlips = getEmployeePayrollSlips(state, employee);

  const projects = listFromState(state, 'projects')
    .filter((row) => String(row.lead ?? '') === String(employee.name ?? ''));

  const departmentInfo = listDepartments(state)
    .find((row) => String(row.name ?? '') === String(employee.department ?? '')) ?? null;

  return { employee, attendance, payrollSlips, projects, departmentInfo };
}

export function getEmployeeDetailMetrics(state: AppState, id: string): EmployeeDetailMetrics | null {
  const profile = getEmployeeProfile(state, id);
  if (!profile) return null;

  const { employee, attendance, payrollSlips, projects } = profile;
  const tenureMonths = monthsSinceJoining(employee.joiningDate);
  const presentCount = attendance.filter((row) =>
    ['present', 'late'].includes(String(row.status ?? '').toLowerCase()),
  ).length;
  const attendancePresentRate = attendance.length
    ? Math.round((presentCount / attendance.length) * 100)
    : 0;
  const lastPayroll = payrollSlips[0];

  return {
    tenureMonths,
    tenureLabel: formatTenure(employee.joiningDate),
    attendancePresentRate,
    lastPayrollNet: Number(lastPayroll?.net ?? employee.salary ?? 0),
    lastPayrollDate: String(lastPayroll?.date ?? '—'),
    assignedProjects: projects.length,
  };
}

export function getNextEmployeeCode(state: AppState) {
  const employees = listEmployees(state);
  let max = 0;
  employees.forEach((row) => {
    const raw = String(row.employeeCode ?? row.id ?? '');
    const match = raw.match(/EMP-(\d+)/i);
    if (match) max = Math.max(max, Number(match[1]));
  });
  return `EMP-${String(max + 1).padStart(3, '0')}`;
}

export function getEmployeeInitialForm(state: AppState) {
  const structures = listSalaryStructures(state).filter(
    (s) => String(s.status ?? '').toLowerCase() === 'active',
  );
  const defaultStructure = structures[0];
  return {
    name: '',
    phone: '',
    email: '',
    nid: '',
    imageUrl: '',
    imagePublicId: '',
    department: '',
    designation: '',
    joiningDate: new Date().toISOString().split('T')[0],
    employeeType: 'Worker',
    status: 'active',
    employeeCode: getNextEmployeeCode(state),
    salaryStructureId: defaultStructure ? String(defaultStructure.id) : '',
    paymentMethod: 'Cash',
    emergencyPhone: '',
    address: '',
    notes: '',
  };
}

export function mapEmployeeRowToForm(row: Row) {
  return {
    name: String(row.name ?? ''),
    phone: String(row.phone ?? ''),
    email: String(row.email ?? ''),
    nid: String(row.nid ?? ''),
    imageUrl: String(row.imageUrl ?? ''),
    imagePublicId: String(row.imagePublicId ?? ''),
    department: String(row.department ?? ''),
    designation: String(row.designation ?? ''),
    joiningDate: String(row.joiningDate ?? '').split('T')[0],
    employeeType: String(row.employeeType ?? 'Worker'),
    status: String(row.status ?? 'active'),
    employeeCode: String(row.employeeCode ?? row.id ?? ''),
    salaryStructureId: String(row.salaryStructureId ?? ''),
    paymentMethod: String(row.paymentMethod ?? 'Cash'),
    emergencyPhone: String(row.emergencyPhone ?? ''),
    address: String(row.address ?? ''),
    notes: String(row.notes ?? ''),
  };
}

export function createEmployee(state: AppState, payload: Row) {
  const code = String(payload.employeeCode ?? getNextEmployeeCode(state));
  const salaryStructureId = String(payload.salaryStructureId ?? '');
  let salary = Number(payload.salary ?? 0);
  if (!salary && salaryStructureId) {
    const structure = getSalaryStructureById(state, salaryStructureId);
    if (structure) salary = Number(structure.base ?? 0);
  }
  return createInState(state, 'employees', {
    ...payload,
    id: code,
    employeeCode: code,
    status: payload.status ?? 'active',
    joiningDate: payload.joiningDate ?? new Date().toISOString().split('T')[0],
    salary,
  }, 'EMP');
}

export function updateEmployee(state: AppState, id: string, payload: Row) {
  return updateInState(state, 'employees', id, payload);
}

export function deleteEmployee(state: AppState, id: string) {
  return deleteFromState(state, 'employees', id);
}

export function getEmployeeMetrics(rows: Row[]) {
  const active = rows.filter((r) => String(r.status).toLowerCase() === 'active').length;
  const onLeave = rows.filter((r) => String(r.status).toLowerCase() === 'on-leave').length;
  const inactive = rows.filter((r) => String(r.status).toLowerCase() === 'inactive').length;
  const monthlyPayroll = rows
    .filter((r) => String(r.status).toLowerCase() === 'active')
    .reduce((sum, r) => sum + Number(r.salary ?? 0), 0);
  return { total: rows.length, active, onLeave, inactive, monthlyPayroll };
}

export function crudHrm(stateKey: string, prefix: string) {
  return {
    list: (state: AppState) => listFromState(state, stateKey),
    create: (state: AppState, payload: Row) => createInState(state, stateKey, payload, prefix),
    update: (state: AppState, id: string, payload: Row) => updateInState(state, stateKey, id, payload),
    delete: (state: AppState, id: string) => deleteFromState(state, stateKey, id),
  };
}

export { formatCurrency as formatMoney };
