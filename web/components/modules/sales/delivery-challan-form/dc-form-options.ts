export const DELIVERY_METHOD_OPTIONS = [
  'By Our Transport',
  'Customer Pickup',
  'Third Party Courier',
] as const;

export const CHALLAN_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', dotClass: 'bg-amber-400' },
  { value: 'dispatched', label: 'Dispatched', dotClass: 'bg-blue-500' },
  { value: 'delivered', label: 'Delivered', dotClass: 'bg-emerald-500' },
  { value: 'cancelled', label: 'Cancelled', dotClass: 'bg-rose-500' },
] as const;

export type CatalogProduct = {
  id: string;
  name: string;
  sku: string;
  unit: string;
  imageUrl: string;
};

export const CHALLAN_PRODUCT_CATALOG: CatalogProduct[] = [
  {
    id: 'TB-L-BRN',
    name: 'Teddy Bear Large (Brown)',
    sku: 'TB-L-BRN',
    unit: 'Pcs',
    imageUrl: '/images/logo-toys.png',
  },
  {
    id: 'TB-M-WHT',
    name: 'Teddy Bear Medium (White)',
    sku: 'TB-M-WHT',
    unit: 'Pcs',
    imageUrl: '/images/logo-toys.png',
  },
  {
    id: 'TB-S-PNK',
    name: 'Teddy Bear Small (Pink)',
    sku: 'TB-S-PNK',
    unit: 'Pcs',
    imageUrl: '/images/logo-toys.png',
  },
  {
    id: 'SKU-AF-SH01',
    name: 'Super Hero Action Figure',
    sku: 'SKU-AF-SH01',
    unit: 'Pcs',
    imageUrl: '/images/logo-toys.png',
  },
  {
    id: 'T101',
    name: 'Kids Toy Car',
    sku: 'T101',
    unit: 'Pcs',
    imageUrl: '/images/logo-toys.png',
  },
];

export function findCatalogProduct(productId: string): CatalogProduct | undefined {
  return CHALLAN_PRODUCT_CATALOG.find((p) => p.id === productId || p.sku === productId);
}
