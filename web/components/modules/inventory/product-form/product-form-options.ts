import { INVOICE_TAX_OPTIONS } from '@/components/modules/sales/invoice-form/inv-form-options';

export const PRODUCT_TYPE_CARDS = [
  {
    id: 'finished',
    label: 'Finished Product',
    description: 'Ready to sell to customers',
    backendValue: 'Finished Goods',
    icon: 'package',
  },
  {
    id: 'raw',
    label: 'Raw Material',
    description: 'Used in production process',
    backendValue: 'Raw Materials',
    icon: 'flask',
  },
  {
    id: 'semi',
    label: 'Semi-Finished',
    description: 'Partially processed goods',
    backendValue: 'Semi-Finished Goods',
    icon: 'puzzle',
  },
] as const;

export type ProductTypeCardId = (typeof PRODUCT_TYPE_CARDS)[number]['id'];

export function backendToProductTypeCardId(productType: string): ProductTypeCardId {
  const match = PRODUCT_TYPE_CARDS.find((c) => c.backendValue === productType);
  return match?.id ?? 'finished';
}

export function productTypeCardIdToBackend(id: ProductTypeCardId): string {
  return PRODUCT_TYPE_CARDS.find((c) => c.id === id)?.backendValue ?? 'Finished Goods';
}

export const PRODUCT_TAX_OPTIONS = INVOICE_TAX_OPTIONS;

export function getProductTaxRateByLabel(label: string): number {
  const match = PRODUCT_TAX_OPTIONS.find((opt) => opt.label === label);
  return match?.rate ?? 0;
}

export function taxRateToLabel(rate: number): string {
  const pct = Number(rate || 0);
  if (pct <= 0) return 'No Tax';
  const asDecimal = pct > 1 ? pct / 100 : pct;
  const match = PRODUCT_TAX_OPTIONS.find((opt) => Math.abs(opt.rate - asDecimal) < 0.0001);
  if (match) return match.label;
  return `${Math.round(asDecimal * 100)}%`;
}
