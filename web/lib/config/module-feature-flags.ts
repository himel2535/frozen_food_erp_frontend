import type { SidebarSection } from '@/lib/navigation/tenant-sidebar';

/**
 * Optional module toggles — keep code in place; flip to `true` to re-enable.
 *
 * Stock In / Stock Out are disabled per current client scope. Other inventory
 * flows (transfers, adjustments, purchase RM, goods received) remain active.
 */
export const MODULE_FEATURE_FLAGS = {
  inventoryStockIn: false,
  inventoryStockOut: false,
} as const;

export type ModuleFeatureFlag = keyof typeof MODULE_FEATURE_FLAGS;

const FEATURE_FLAG_ROUTES: Partial<Record<ModuleFeatureFlag, string>> = {
  inventoryStockIn: '/inventory/stock-in',
  inventoryStockOut: '/inventory/stock-out',
};

function normalizePath(pathname: string): string {
  return pathname.split('?')[0].split('#')[0].replace(/\/$/, '') || '/';
}

export function isModuleFeatureEnabled(flag: ModuleFeatureFlag): boolean {
  return MODULE_FEATURE_FLAGS[flag];
}

/** Returns false when a route is turned off via MODULE_FEATURE_FLAGS. */
export function isRouteEnabledByFeatureFlags(pathname: string): boolean {
  const path = normalizePath(pathname);
  for (const [flag, routePrefix] of Object.entries(FEATURE_FLAG_ROUTES) as [ModuleFeatureFlag, string][]) {
    if (!MODULE_FEATURE_FLAGS[flag] && (path === routePrefix || path.startsWith(`${routePrefix}/`))) {
      return false;
    }
  }
  return true;
}

/** Hide disabled modules from sidebar navigation while keeping config entries. */
export function filterSidebarSectionsByFeatureFlags(sections: SidebarSection[]): SidebarSection[] {
  return sections.map((section) => ({
    ...section,
    items: section.items
      .filter((item) => isRouteEnabledByFeatureFlags(item.href))
      .map((item) =>
        item.children?.length
          ? {
              ...item,
              children: item.children.filter((child) => isRouteEnabledByFeatureFlags(child.href)),
            }
          : item,
      ),
  }));
}
