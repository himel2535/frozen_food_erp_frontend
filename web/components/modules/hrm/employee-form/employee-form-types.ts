export const EMPLOYEE_TYPE_OPTIONS = ['Worker', 'Staff', 'Contract'] as const;

export const EMPLOYEE_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'on-leave', label: 'On Leave' },
] as const;

export const PAYMENT_METHOD_OPTIONS = ['Cash', 'Bank', 'bKash', 'Nagad'] as const;

export const PAYMENT_METHOD_INFO: Record<string, string> = {
  Cash: 'Salary will be paid in cash. You can change this later from employee profile.',
  Bank: 'Salary will be deposited to bank account. You can update bank details later from employee profile.',
  bKash: 'Salary will be sent via bKash. You can update mobile wallet details later from employee profile.',
  Nagad: 'Salary will be sent via Nagad. You can update mobile wallet details later from employee profile.',
};

export const EMPLOYEE_FORM_KEYS = [
  'name',
  'phone',
  'email',
  'nid',
  'imageUrl',
  'department',
  'designation',
  'joiningDate',
  'employeeType',
  'status',
  'employeeCode',
  'salaryStructureId',
  'paymentMethod',
  'emergencyPhone',
  'address',
  'notes',
] as const;

export type EmployeeFormKey = (typeof EMPLOYEE_FORM_KEYS)[number];

export const ADDRESS_MAX_LENGTH = 200;
