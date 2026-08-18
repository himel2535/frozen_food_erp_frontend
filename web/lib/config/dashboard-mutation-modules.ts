/**
 * Client 15s dashboard caches (summary / alerts / activity) must drop on these
 * mutations. Do not raise TTL — only widen this set when a mutation type is stale.
 */
export const DASHBOARD_DATA_MUTATION_MODULES = [
  'invoices',
  'salesOrders',
  'payments',
  'purchaseOrders',
  'productionOrders',
  'customers',
  'products',
  'rawMaterials',
  'semiFinishedProducts',
  'finishedGoods',
  'dues',
  'leads',
] as const;

export const DASHBOARD_TOP_PRODUCTS_MUTATION_MODULES = [
  'salesOrders',
  'invoices',
  'products',
] as const;
