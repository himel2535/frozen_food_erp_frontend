import type { PoFormValues } from '@/components/modules/purchases/purchase-order-form/po-form-types';

export type PoFieldError = Partial<Record<keyof PoFormValues | 'items', string>>;

export function validatePoForm(values: PoFormValues): PoFieldError {
  const errors: PoFieldError = {};
  if (!values.supplierId) errors.supplierId = 'Supplier is required';
  if (!values.date) errors.date = 'Order date is required';
  const activeItems = values.items.filter((i) => i.description.trim() || i.productId);
  if (!activeItems.length) errors.items = 'Add at least one order item';
  return errors;
}
