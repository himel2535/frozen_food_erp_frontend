import type { SalarySetupFormValues } from '@/components/modules/payroll/salary-setup-form/salary-setup-form-types';
import { parseSalaryAmount } from '@/lib/services/payroll-service';

export type SalarySetupFieldError = Partial<Record<keyof SalarySetupFormValues | 'components', string>>;

export function validateSalarySetupForm(form: SalarySetupFormValues): SalarySetupFieldError {
  const errors: SalarySetupFieldError = {};
  if (!form.name.trim()) errors.name = 'Structure name is required';
  if (!form.code.trim()) errors.code = 'Structure code is required';
  if (!form.employeeType) errors.employeeType = 'Employee type is required';
  if (!form.effectiveFrom) errors.effectiveFrom = 'Effective date is required';
  const workingDays = Number(form.workingDays);
  if (!workingDays || workingDays < 1 || workingDays > 31) {
    errors.workingDays = 'Working days must be between 1 and 31';
  }
  if (!form.components.some((c) => c.name.trim())) {
    errors.components = 'Add at least one salary component';
  } else {
    const hasBasic = form.components.some((c) => {
      const name = c.name.trim().toLowerCase();
      return name.includes('basic') && parseSalaryAmount(c.amount) > 0;
    });
    if (!hasBasic) {
      errors.components = 'Basic Salary must have a valid numeric amount';
    }
    const invalidAmount = form.components.some((c) => c.name.trim() && parseSalaryAmount(c.amount) < 0);
    if (invalidAmount) {
      errors.components = 'Component amounts must be valid numbers';
    }
  }
  return errors;
}
