import { getKpiGridClassName } from '@/lib/ui/kpi-grid';

export type ModuleKpiLayout = {
  count: number;
  gridClassName: string;
  tableColumns: number;
};

const GRID_4 = getKpiGridClassName(4);
const GRID_5 = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2';
const GRID_3 = getKpiGridClassName(3);
const GRID_6 = 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2';

/** Per-route KPI skeleton layout — keeps route transition aligned with each page. */
const ROUTE_LAYOUTS: Record<string, ModuleKpiLayout> = {
  '/crm/customers': { count: 4, gridClassName: GRID_4, tableColumns: 6 },
  '/crm/leads': { count: 5, gridClassName: GRID_5, tableColumns: 6 },
  '/crm/deals': { count: 5, gridClassName: GRID_5, tableColumns: 6 },
  '/crm/complaints': { count: 5, gridClassName: GRID_5, tableColumns: 6 },
  '/sales/orders': { count: 4, gridClassName: GRID_4, tableColumns: 6 },
  '/sales/invoices': { count: 4, gridClassName: GRID_4, tableColumns: 7 },
  '/sales/deliveries': { count: 4, gridClassName: GRID_4, tableColumns: 6 },
  '/purchases/suppliers': { count: 4, gridClassName: 'grid grid-cols-2 md:grid-cols-4 gap-2', tableColumns: 6 },
  '/purchases/orders': { count: 6, gridClassName: GRID_6, tableColumns: 6 },
  '/purchases/purchase-rm': { count: 4, gridClassName: GRID_4, tableColumns: 6 },
  '/inventory/products': { count: 5, gridClassName: 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2', tableColumns: 6 },
  '/inventory/categories': { count: 3, gridClassName: GRID_3, tableColumns: 5 },
  '/inventory/units': { count: 3, gridClassName: GRID_3, tableColumns: 5 },
  '/inventory/warehouses': { count: 3, gridClassName: GRID_3, tableColumns: 5 },
  '/inventory/raw-materials': { count: 5, gridClassName: GRID_5, tableColumns: 6 },
  '/inventory/semi-finished-products': { count: 5, gridClassName: GRID_5, tableColumns: 6 },
  '/inventory/finished-goods': { count: 5, gridClassName: GRID_5, tableColumns: 6 },
  '/inventory/stock-in': { count: 4, gridClassName: GRID_4, tableColumns: 6 },
  '/inventory/stock-out': { count: 4, gridClassName: GRID_4, tableColumns: 6 },
  '/inventory/transfers': { count: 4, gridClassName: GRID_4, tableColumns: 6 },
  '/inventory/adjustments': { count: 4, gridClassName: GRID_4, tableColumns: 6 },
  '/hrm/employees': { count: 5, gridClassName: GRID_5, tableColumns: 6 },
  '/settings/users': { count: 4, gridClassName: GRID_4, tableColumns: 5 },
  '/settings/roles': { count: 4, gridClassName: GRID_4, tableColumns: 5 },
};

const DEFAULT_LAYOUT: ModuleKpiLayout = {
  count: 4,
  gridClassName: GRID_4,
  tableColumns: 5,
};

function normalizePath(pathname: string): string {
  return pathname.split('?')[0].split('#')[0].replace(/\/$/, '') || '/dashboard';
}

export function getModuleKpiLayout(pathname: string): ModuleKpiLayout {
  const path = normalizePath(pathname);
  if (ROUTE_LAYOUTS[path]) return ROUTE_LAYOUTS[path];
  if (path.startsWith('/reports/')) {
    return { count: 4, gridClassName: GRID_4, tableColumns: 7 };
  }
  return DEFAULT_LAYOUT;
}

export function resolveKpiGridClassName(
  count: number,
  gridClassName?: string,
): string {
  if (gridClassName) return gridClassName;
  if (count <= 0) return getKpiGridClassName(4);
  return getKpiGridClassName(count);
}

export function resolveKpiSlotCount(
  loading: boolean,
  itemsLength: number,
  kpiCount?: number,
): number {
  if (!loading) return itemsLength;
  if (itemsLength > 0) return itemsLength;
  if (kpiCount != null && kpiCount > 0) return kpiCount;
  return 4;
}
