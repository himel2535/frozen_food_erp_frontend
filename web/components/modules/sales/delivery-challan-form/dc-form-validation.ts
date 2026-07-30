import type { DeliveryChallanFormValues } from '@/components/modules/sales/delivery-challan-form/dc-form-types';

export type DeliveryChallanFieldError = Partial<Record<keyof DeliveryChallanFormValues | 'items', string>>;

export function validateDeliveryChallanForm(form: DeliveryChallanFormValues): DeliveryChallanFieldError {
  const errors: DeliveryChallanFieldError = {};

  if (!form.date.trim()) {
    errors.date = 'Date is required.';
  }
  if (!form.customerId.trim()) {
    errors.customerId = 'Customer is required.';
  }
  if (!form.orderId.trim()) {
    errors.orderId = 'Sales order is required.';
  }
  if (!form.deliveryAddress.trim()) {
    errors.deliveryAddress = 'Delivery address is required.';
  }

  const activeItems = form.items.filter((item) => item.productName.trim());
  if (!activeItems.length) {
    errors.items = 'Add at least one product line.';
  } else if (!activeItems.some((item) => Number(item.deliverNow) > 0)) {
    errors.items = 'Enter deliver quantity for at least one product.';
  }

  return errors;
}
