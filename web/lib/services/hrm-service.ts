import type { AppState } from '@/lib/state/types';
import { listFromState, createInState, updateInState, deleteFromState, formatCurrency } from '@/lib/services/domain-service';

type Row = Record<string, unknown>;

export function listEmployees(state: AppState) {
  return listFromState(state, 'employees');
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

export function createEmployee(state: AppState, payload: Row) {
  return createInState(state, 'employees', {
    ...payload,
    status: payload.status ?? 'active',
    joiningDate: payload.joiningDate ?? new Date().toISOString().split('T')[0],
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
  return { total: rows.length, active, onLeave };
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
