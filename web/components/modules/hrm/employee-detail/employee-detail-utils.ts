export const EMPLOYEE_DETAIL_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'payroll', label: 'Payroll' },
  { id: 'notes', label: 'Notes' },
] as const;

export type EmployeeDetailTabId = (typeof EMPLOYEE_DETAIL_TABS)[number]['id'];

export {
  employeeInitials,
  employeeAvatarClass,
  employeeStatusLabel,
  formatTenure,
  formatEmployeeDate,
} from '@/lib/services/hrm-service';
