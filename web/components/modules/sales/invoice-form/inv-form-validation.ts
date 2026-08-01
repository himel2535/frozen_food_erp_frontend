import type { InvoiceFormValues } from '@/components/modules/sales/invoice-form/inv-form-types';

export type InvoiceFieldError = Partial<Record<keyof InvoiceFormValues | 'items', string>>;

export function validateInvoiceForm(form: InvoiceFormValues): InvoiceFieldError {
  const errors: InvoiceFieldError = {};

  if (!form.customerId.trim()) {
    errors.customerId = 'Customer is required.';
  }
  if (!form.issueDate.trim()) {
    errors.issueDate = 'Invoice date is required.';
  }

  const activeItems = form.items.filter((item) => item.description.trim() || item.productId);
  if (!activeItems.length) {
    errors.items = 'Add at least one invoice line item.';
  } else if (!activeItems.some((item) => Number(item.qty) > 0)) {
    errors.items = 'Enter quantity for at least one line item.';
  }

  return errors;
}
