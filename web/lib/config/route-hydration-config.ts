import type { ApiModule } from '@/lib/config/data-source';
import { ROUTE_PREFETCH_MODULES } from '@/lib/server/route-prefetch-config';
import { DEFAULT_LIST_PAGE_SIZE, LOOKUP_LIST_PAGE_SIZE, type ApiListQuery } from '@/lib/services/api-pagination-types';
import { LOOKUP_CACHE_QUERY } from '@/lib/services/api-list-cache';
import { isMasterDataModule } from '@/lib/config/cache-policy';
import { getRouteModuleQuery } from '@/lib/config/route-table-config';

/** Client-side hydration TTL — aligned with table cache. */
export const HYDRATION_CACHE_TTL_MS = 15_000;

/**
 * @deprecated Use ROUTE_MODULE_QUERIES in route-table-config.ts
 * Kept for scripts that still reference this export.
 */
export const ROUTE_TABLE_PAGE_SIZES: Partial<Record<string, number>> = {};

/** Routes that use dedicated admin APIs — no Mongo list hydration. */
const ADMIN_API_ROUTES = new Set(['/settings/users', '/settings/roles']);

/**
 * Extra lookup modules beyond the primary route module(s).
 * List pages: keep empty — lookups load on form open or via cacheOnly hooks.
 */
export const ROUTE_HYDRATION_LOOKUPS: Partial<Record<string, ApiModule[]>> = {
  '/inventory/products': ['categories', 'units', 'warehouses'],
  '/inventory/categories': ['products'],
  '/inventory/units': ['products'],
  '/inventory/warehouses': ['products'],
  '/inventory/stock-in': ['products'],
  '/inventory/stock-out': ['products'],
  '/inventory/transfers': ['products'],
  '/inventory/adjustments': ['products'],
  '/crm/leads': ['employees'],
  '/crm/deals': ['employees'],
  '/projects': ['employees'],
  '/workflow-approvals': ['purchaseRm', 'purchaseOrders', 'leaveRequests'],
};

/** Additional modules for form/edit sub-routes (e.g. /sales/orders/new). */
export const FORM_ROUTE_HYDRATION_LOOKUPS: Partial<Record<string, ApiModule[]>> = {
  '/sales/orders': ['customers', 'employees', 'products'],
  '/sales/invoices': ['customers', 'products'],
  '/purchases/orders': ['suppliers', 'products'],
  '/inventory/raw-materials': ['products', 'categories', 'units', 'warehouses'],
  '/inventory/semi-finished-products': ['products', 'categories', 'units', 'warehouses'],
  '/inventory/finished-goods': ['products', 'categories', 'units', 'warehouses'],
  '/accounting/receivables': ['customers', 'payments', 'cashbox'],
  '/accounting/payables': ['suppliers', 'purchasePayments', 'cashbox'],
};

const ROUTE_KEYS_BY_LENGTH = Object.keys(ROUTE_PREFETCH_MODULES).sort(
  (a, b) => b.length - a.length,
);

export function normalizeRoutePath(pathname: string): string {
  return pathname.split('?')[0].split('#')[0].replace(/\/$/, '') || '/dashboard';
}

function isFormSubRoute(path: string): boolean {
  return path.endsWith('/new') || path.includes('/edit');
}

function resolveRouteKey(path: string): string | null {
  if (path in ROUTE_PREFETCH_MODULES) return path;
  for (const key of ROUTE_KEYS_BY_LENGTH) {
    if (key === '/dashboard') continue;
    if (path === key || path.startsWith(`${key}/`)) return key;
  }
  return null;
}

function toModuleArray(value: ApiModule | ApiModule[] | undefined): ApiModule[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function dedupeModules(mods: ApiModule[]): ApiModule[] {
  return [...new Set(mods)];
}

/**
 * Resolve API modules required for the current route.
 * Returns [] for dashboard (handled separately), admin routes, and unknown routes.
 */
export function resolveHydrationModules(pathname: string): ApiModule[] {
  const path = normalizeRoutePath(pathname);
  if (path === '/dashboard') return [];
  if (ADMIN_API_ROUTES.has(path)) return [];

  const routeKey = resolveRouteKey(path);
  if (!routeKey) return [];

  const primary = toModuleArray(ROUTE_PREFETCH_MODULES[routeKey]);
  const lookups = ROUTE_HYDRATION_LOOKUPS[routeKey] ?? [];
  const formLookups = isFormSubRoute(path) ? (FORM_ROUTE_HYDRATION_LOOKUPS[routeKey] ?? []) : [];

  return dedupeModules([...primary, ...lookups, ...formLookups]);
}

function primaryModulesForRoute(pathname: string): ApiModule[] {
  const path = normalizeRoutePath(pathname);
  const routeKey = resolveRouteKey(path);
  if (!routeKey) return [];
  return toModuleArray(ROUTE_PREFETCH_MODULES[routeKey]);
}

/** Query used when hydrating a module for the current route. */
export function resolveHydrationQuery(module: ApiModule, pathname: string): ApiListQuery {
  const path = normalizeRoutePath(pathname);
  const routeKey = resolveRouteKey(path);
  const primary = primaryModulesForRoute(pathname);

  if (routeKey && primary.includes(module)) {
    return getRouteModuleQuery(pathname, module);
  }

  if (isMasterDataModule(module)) {
    return LOOKUP_CACHE_QUERY;
  }

  const lookups = [
    ...(routeKey ? (ROUTE_HYDRATION_LOOKUPS[routeKey] ?? []) : []),
    ...(routeKey && isFormSubRoute(path) ? (FORM_ROUTE_HYDRATION_LOOKUPS[routeKey] ?? []) : []),
  ];
  if (lookups.includes(module)) {
    return LOOKUP_CACHE_QUERY;
  }

  return { page: 1, limit: DEFAULT_LIST_PAGE_SIZE };
}

export function isLookupHydrationModule(module: ApiModule, pathname: string): boolean {
  const query = resolveHydrationQuery(module, pathname);
  return query.limit === LOOKUP_LIST_PAGE_SIZE;
}
