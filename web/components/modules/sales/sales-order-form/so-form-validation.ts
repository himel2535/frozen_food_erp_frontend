import type { SoFormValues } from '@/components/modules/sales/sales-order-form/so-form-types';

export type SoFieldError = Partial<Record<keyof SoFormValues | 'items', string>>;

export function validateSoForm(values: SoFormValues): SoFieldError {
  const errors: SoFieldError = {};
  if (!values.customerId) errors.customerId = 'Customer is required';
  if (!values.date) errors.date = 'Order date is required';
  const activeItems = values.items.filter((i) => i.description.trim() || i.productId);
  if (!activeItems.length) errors.items = 'Add at least one order item';
  return errors;
}
