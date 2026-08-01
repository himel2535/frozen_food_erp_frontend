import type { ProductFormValues } from '@/components/modules/inventory/product-form/product-form-types';

export type ProductFieldError = Partial<Record<keyof ProductFormValues | 'warehouseStock', string>>;

export function validateProductForm(values: ProductFormValues): ProductFieldError {
  const errors: ProductFieldError = {};
  if (!values.name.trim()) errors.name = 'Product name is required';
  if (!values.sku.trim()) errors.sku = 'SKU is required';
  if (!values.category) errors.category = 'Category is required';
  if (!values.uom) errors.uom = 'Unit of measure is required';
  if (values.cost === '' || Number.isNaN(Number(values.cost))) errors.cost = 'Cost price is required';
  if (values.price === '' || Number.isNaN(Number(values.price))) errors.price = 'Selling price is required';
  if (values.openingStock === '' || Number.isNaN(Number(values.openingStock))) {
    errors.openingStock = 'Opening stock is required';
  }
  return errors;
}
