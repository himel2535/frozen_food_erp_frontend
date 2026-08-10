import type { EmployeeFormKey } from './employee-form-types';

export type EmployeeFieldError = Partial<Record<EmployeeFormKey, string>>;

export function validateEmployeeForm(form: Record<string, string>): EmployeeFieldError {
  const errors: EmployeeFieldError = {};
  if (!String(form.name ?? '').trim()) errors.name = 'Full name is required';
  if (!String(form.phone ?? '').trim()) errors.phone = 'Phone is required';
  if (!String(form.department ?? '').trim()) errors.department = 'Department is required';
  if (!String(form.designation ?? '').trim()) errors.designation = 'Designation is required';
  if (!String(form.joiningDate ?? '').trim()) errors.joiningDate = 'Joining date is required';
  if (!String(form.employeeType ?? '').trim()) errors.employeeType = 'Employment type is required';
  if (!String(form.salaryStructureId ?? '').trim()) errors.salaryStructureId = 'Salary setup is required';
  return errors;
}
