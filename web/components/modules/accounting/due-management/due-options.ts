export const DUE_STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'due_today', label: 'Due Today' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'partial', label: 'Partial' },
];

export const DUE_MAIN_TABS = [
  { id: 'customer', label: 'Customer Due' },
  { id: 'supplier', label: 'Supplier Due' },
] as const;

export const OPENING_DUE_FIELDS = [
  { key: 'party', label: 'Party Name', required: true },
  { key: 'type', label: 'Type', type: 'select' as const, options: ['customer', 'supplier'] },
  { key: 'amount', label: 'Amount Due', type: 'number' as const, required: true },
  { key: 'dueDate', label: 'Due Date', type: 'date' as const, required: true },
  { key: 'location', label: 'Location', advanced: true },
  { key: 'notes', label: 'Notes', type: 'textarea' as const, advanced: true },
];

export const RECEIVE_PAYMENT_FIELDS = [
  { key: 'amount', label: 'Receive Amount', type: 'number' as const, required: true },
  { key: 'date', label: 'Payment Date', type: 'date' as const, required: true },
  { key: 'method', label: 'Payment Method', type: 'select' as const, options: ['Cash', 'Bank', 'Mobile Banking', 'Cheque'] },
  { key: 'reference', label: 'Reference', advanced: true },
];
