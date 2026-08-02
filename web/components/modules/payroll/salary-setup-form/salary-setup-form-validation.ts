import type { SalarySetupFormValues } from '@/components/modules/payroll/salary-setup-form/salary-setup-form-types';

export type SalarySetupFieldError = Partial<Record<keyof SalarySetupFormValues | 'components', string>>;

export function validateSalarySetupForm(form: SalarySetupFormValues): SalarySetupFieldError {
  const errors: SalarySetupFieldError = {};
  if (!form.name.trim()) errors.name = 'Structure name is required';
  if (!form.code.trim()) errors.code = 'Structure code is required';
  if (!form.employeeType) errors.employeeType = 'Employee type is required';
  if (!form.effectiveFrom) errors.effectiveFrom = 'Effective date is required';
  if (!form.components.some((c) => c.name.trim())) errors.components = 'Add at least one salary component';
  return errors;
}
