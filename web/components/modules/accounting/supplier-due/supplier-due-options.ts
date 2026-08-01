export const SUPPLIER_DUE_STATUS_TABS = [
  { id: 'all_due', label: 'All Due' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'due_soon', label: 'Due Soon' },
  { id: 'paid', label: 'Paid' },
];

export const ADD_PAYABLE_FIELDS = [
  { key: 'supplier', label: 'Supplier', type: 'select' as const, required: true, placeholder: 'Select supplier…' },
  { key: 'amount', label: 'Amount Due', type: 'number' as const, required: true },
  { key: 'dueDate', label: 'Due Date', type: 'date' as const, required: true },
  { key: 'notes', label: 'Notes', type: 'textarea' as const, advanced: true },
];

export const MAKE_PAYMENT_FIELDS = [
  { key: 'amount', label: 'Payment Amount', type: 'number' as const, required: true },
  { key: 'date', label: 'Payment Date', type: 'date' as const, required: true },
  { key: 'method', label: 'Payment Method', type: 'select' as const, options: ['Bank Transfer', 'Cheque', 'Mobile Banking', 'Cash'] },
  { key: 'reference', label: 'Reference', advanced: true },
];
