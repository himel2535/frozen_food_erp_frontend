/** MongoDB API modules — these never read/write Firebase local state for entity CRUD. */

import {
  EXTENDED_API_MODULE_KEYS,
  EXTENDED_API_PATHS,
  EXTENDED_API_LABELS,
  type ExtendedApiModule,
} from '@/lib/config/extended-api-modules';

export type DataBackend = 'firebase' | 'mongodb';

export type CoreApiModule =
  | 'customers'
  | 'products'
  | 'suppliers'
  | 'employees'
  | 'salesOrders'
  | 'invoices'
  | 'leads'
  | 'deals'
  | 'quotations'
  | 'deliveries'
  | 'dispatch'
  | 'payments'
  | 'returns'
  | 'complaints'
  | 'pos'
  | 'categories'
  | 'units'
  | 'warehouses'
  | 'rawMaterials'
  | 'semiFinishedProducts'
  | 'finishedGoods'
  | 'stockIn'
  | 'stockOut'
  | 'stockTransfers'
  | 'stockAdjustments';

export type ApiModule = CoreApiModule | ExtendedApiModule;



/** All modules with Express + MongoDB CRUD — always use API, ignore Firebase. */

export const MONGODB_READY_MODULES: readonly ApiModule[] = [
  'customers',
  'products',
  'suppliers',
  'employees',
  'salesOrders',
  'invoices',
  'leads',
  'deals',
  'quotations',
  'deliveries',
  'dispatch',
  'payments',
  'returns',
  'complaints',
  'pos',
  'categories',
  'units',
  'warehouses',
  'rawMaterials',
  'semiFinishedProducts',
  'finishedGoods',
  'stockIn',
  'stockOut',
  'stockTransfers',
  'stockAdjustments',
  ...EXTENDED_API_MODULE_KEYS,
] as const;

/** Dashboard deferred boot + legacy reference. Do not fetch globally on every route — use route-hydration-config. */
export const API_BOOT_MODULES: readonly ApiModule[] = [
  'customers',
  'products',
  'suppliers',
  'employees',
  'salesOrders',
  'invoices',
  'categories',
  'units',
  'warehouses',
] as const;

/** Dashboard charts + recent invoices: sales trend, revenue, customer names. */
export const DASHBOARD_CRITICAL_BOOT_MODULES: readonly ApiModule[] = [
  'customers',
  'salesOrders',
  'invoices',
] as const;

const DASHBOARD_CRITICAL_BOOT_SET = new Set<string>(DASHBOARD_CRITICAL_BOOT_MODULES);

/** Remaining boot lists — not needed for dashboard first paint. */
export const DASHBOARD_DEFERRED_BOOT_MODULES: readonly ApiModule[] = API_BOOT_MODULES.filter(
  (mod) => !DASHBOARD_CRITICAL_BOOT_SET.has(mod),
);

const BOOT_MODULE_SET = new Set<string>(API_BOOT_MODULES);

export function getApiBackgroundModules(): ApiModule[] {
  return MONGODB_READY_MODULES.filter((mod) => !BOOT_MODULE_SET.has(mod));
}

export const INVENTORY_API_MODULES: ApiModule[] = [
  'products',
  'categories',
  'units',
  'warehouses',
  'rawMaterials',
  'semiFinishedProducts',
  'finishedGoods',
  'stockIn',
  'stockOut',
  'stockTransfers',
  'stockAdjustments',
];

const globalBackend = process.env.NEXT_PUBLIC_DATA_BACKEND;



function moduleEnv(module: ApiModule): string | undefined {

  switch (module) {

    case 'customers':

      return process.env.NEXT_PUBLIC_CUSTOMERS_DATA_SOURCE;

    case 'products':

      return process.env.NEXT_PUBLIC_PRODUCTS_DATA_SOURCE;

    case 'suppliers':

      return process.env.NEXT_PUBLIC_SUPPLIERS_DATA_SOURCE;

    case 'employees':

      return process.env.NEXT_PUBLIC_EMPLOYEES_DATA_SOURCE;

    case 'salesOrders':

      return process.env.NEXT_PUBLIC_SALES_ORDERS_DATA_SOURCE;

    case 'invoices':

      return process.env.NEXT_PUBLIC_INVOICES_DATA_SOURCE;

    case 'leads':

      return process.env.NEXT_PUBLIC_LEADS_DATA_SOURCE;

    case 'deals':

      return process.env.NEXT_PUBLIC_DEALS_DATA_SOURCE;

    case 'quotations':

      return process.env.NEXT_PUBLIC_QUOTATIONS_DATA_SOURCE;

    case 'deliveries':

      return process.env.NEXT_PUBLIC_DELIVERIES_DATA_SOURCE;

    case 'dispatch':

      return process.env.NEXT_PUBLIC_DISPATCH_DATA_SOURCE;

    case 'payments':

      return process.env.NEXT_PUBLIC_PAYMENTS_DATA_SOURCE;

    case 'returns':

      return process.env.NEXT_PUBLIC_RETURNS_DATA_SOURCE;

    case 'complaints':

      return process.env.NEXT_PUBLIC_COMPLAINTS_DATA_SOURCE;

    case 'pos':

      return process.env.NEXT_PUBLIC_POS_DATA_SOURCE;

    case 'categories':

      return process.env.NEXT_PUBLIC_CATEGORIES_DATA_SOURCE;

    case 'units':

      return process.env.NEXT_PUBLIC_UNITS_DATA_SOURCE;

    case 'warehouses':

      return process.env.NEXT_PUBLIC_WAREHOUSES_DATA_SOURCE;

    case 'rawMaterials':

      return process.env.NEXT_PUBLIC_RAW_MATERIALS_DATA_SOURCE;

    case 'semiFinishedProducts':

      return process.env.NEXT_PUBLIC_SEMI_FINISHED_DATA_SOURCE;

    case 'finishedGoods':

      return process.env.NEXT_PUBLIC_FINISHED_GOODS_DATA_SOURCE;

    case 'stockIn':

      return process.env.NEXT_PUBLIC_STOCK_IN_DATA_SOURCE;

    case 'stockOut':

      return process.env.NEXT_PUBLIC_STOCK_OUT_DATA_SOURCE;

    case 'stockTransfers':

      return process.env.NEXT_PUBLIC_STOCK_TRANSFERS_DATA_SOURCE;

    case 'stockAdjustments':
      return process.env.NEXT_PUBLIC_STOCK_ADJUSTMENTS_DATA_SOURCE;
    default:
      return undefined;
  }
}



function resolveBackend(module: ApiModule): DataBackend {

  if ((MONGODB_READY_MODULES as readonly string[]).includes(module)) {

    return 'mongodb';

  }

  const raw = moduleEnv(module) ?? globalBackend ?? 'mongodb';

  return raw === 'firebase' ? 'firebase' : 'mongodb';

}



export const dataSourceConfig = {

  get apiBaseUrl(): string {
    if (typeof window !== 'undefined') {
      return '/api/v1';
    }
    return (process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:5000/api/v1').replace(/\/$/, '');
  },

  customers: resolveBackend('customers'),

  products: resolveBackend('products'),

  suppliers: resolveBackend('suppliers'),

  employees: resolveBackend('employees'),

  salesOrders: resolveBackend('salesOrders'),

  invoices: resolveBackend('invoices'),

  leads: resolveBackend('leads'),

  deals: resolveBackend('deals'),

  quotations: resolveBackend('quotations'),

  deliveries: resolveBackend('deliveries'),

  dispatch: resolveBackend('dispatch'),

  payments: resolveBackend('payments'),

  returns: resolveBackend('returns'),

  complaints: resolveBackend('complaints'),

  pos: resolveBackend('pos'),

  categories: resolveBackend('categories'),

  units: resolveBackend('units'),

  warehouses: resolveBackend('warehouses'),

  rawMaterials: resolveBackend('rawMaterials'),

  semiFinishedProducts: resolveBackend('semiFinishedProducts'),

  finishedGoods: resolveBackend('finishedGoods'),

  stockIn: resolveBackend('stockIn'),

  stockOut: resolveBackend('stockOut'),

  stockTransfers: resolveBackend('stockTransfers'),

  stockAdjustments: resolveBackend('stockAdjustments'),

};



export function isModuleApiMode(module: ApiModule): boolean {

  return resolveBackend(module) === 'mongodb';

}



/** @deprecated use isModuleApiMode('customers') */

export function isCustomersApiMode(): boolean {

  return isModuleApiMode('customers');

}



export const API_RESOURCE_PATHS: Record<ApiModule, string> = {
  customers: '/customers',
  products: '/products',
  suppliers: '/suppliers',
  employees: '/employees',
  salesOrders: '/sales-orders',
  invoices: '/invoices',
  leads: '/leads',
  deals: '/deals',
  quotations: '/quotations',
  deliveries: '/deliveries',
  dispatch: '/dispatch',
  payments: '/payments',
  returns: '/returns',
  complaints: '/complaints',
  pos: '/pos-transactions',
  categories: '/categories',
  units: '/units',
  warehouses: '/warehouses',
  rawMaterials: '/raw-materials',
  semiFinishedProducts: '/semi-finished-products',
  finishedGoods: '/finished-goods',
  stockIn: '/stock-in',
  stockOut: '/stock-out',
  stockTransfers: '/stock-transfers',
  stockAdjustments: '/stock-adjustments',
  ...EXTENDED_API_PATHS,
};

const PATH_TO_API_MODULE = Object.fromEntries(
  (Object.entries(API_RESOURCE_PATHS) as [ApiModule, string][]).map(([mod, p]) => [p, mod]),
) as Record<string, ApiModule>;

/** Resolve an API path (e.g. `/leads`) to its module. Unknown paths return null. */
export function moduleFromApiPath(path: string): ApiModule | null {
  const trimmed = path.split('?')[0]?.replace(/\/+$/, '') || '/';
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return PATH_TO_API_MODULE[withSlash] ?? null;
}

export const API_MODULE_LABELS: Record<ApiModule, string> = {
  customers: 'Customers',
  products: 'Products',
  suppliers: 'Suppliers',
  employees: 'Employees',
  salesOrders: 'Sales Orders',
  invoices: 'Invoices',
  leads: 'Leads',
  deals: 'Deals',
  quotations: 'Quotations',
  deliveries: 'Delivery Challan',
  dispatch: 'Dispatch',
  payments: 'Payments',
  returns: 'Returns',
  complaints: 'Complaints',
  pos: 'POS',
  categories: 'Categories',
  units: 'Units',
  warehouses: 'Warehouses',
  rawMaterials: 'Raw Materials',
  semiFinishedProducts: 'Semi-Finished Products',
  finishedGoods: 'Finished Goods',
  stockIn: 'Stock In',
  stockOut: 'Stock Out',
  stockTransfers: 'Stock Transfers',
  stockAdjustments: 'Stock Correction',
  ...EXTENDED_API_LABELS,
};



export const SALES_CRM_API_MODULES: ApiModule[] = [

  'customers',

  'leads',

  'deals',

  'quotations',

  'salesOrders',

  'deliveries',

  'dispatch',

  'invoices',

  'payments',

  'returns',

  'pos',

  'complaints',

];



export function isInventoryApiMode(): boolean {

  return INVENTORY_API_MODULES.some(isModuleApiMode);

}

export function isMongoDbBackend(): boolean {
  return (process.env.NEXT_PUBLIC_DATA_BACKEND ?? 'mongodb') === 'mongodb';
}

