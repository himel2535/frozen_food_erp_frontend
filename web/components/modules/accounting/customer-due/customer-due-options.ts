export const CUSTOMER_DUE_STATUS_TABS = [
  { id: 'all_due', label: 'All Due' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'due_soon', label: 'Due Soon' },
  { id: 'paid', label: 'Paid' },
];

export const ADD_DUE_FIELDS = [
  { key: 'customer', label: 'Customer', type: 'select' as const, required: true, placeholder: 'Select customer…' },
  { key: 'amount', label: 'Amount Due', type: 'number' as const, required: true },
  { key: 'dueDate', label: 'Due Date', type: 'date' as const, required: true },
  { key: 'notes', label: 'Notes', type: 'textarea' as const, advanced: true },
];

export const RECEIVE_PAYMENT_FIELDS = [
  { key: 'amount', label: 'Receive Amount', type: 'number' as const, required: true },
  { key: 'date', label: 'Payment Date', type: 'date' as const, required: true },
  { key: 'method', label: 'Payment Method', type: 'select' as const, options: ['Cash', 'Bank', 'Mobile Banking', 'Cheque'] },
  { key: 'reference', label: 'Reference', advanced: true },
];
