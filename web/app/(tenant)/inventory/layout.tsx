'use client';

import { useLayoutEffect } from 'react';
import { loadIcons } from '@iconify/react';
import { getInventoryKpiPreloadIcons } from '@/lib/ui/kpi-icons';
import { getPageIcon } from '@/lib/ui/page-icons';

const INVENTORY_ROUTES = [
  '/inventory/products',
  '/inventory/raw-materials',
  '/inventory/semi-finished-products',
  '/inventory/finished-goods',
  '/inventory/stock-in',
  '/inventory/stock-out',
  '/inventory/transfers',
  '/inventory/adjustments',
  '/inventory/warehouses',
  '/inventory/categories',
  '/inventory/units',
] as const;

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  useLayoutEffect(() => {
    loadIcons([
      ...INVENTORY_ROUTES.map((route) => getPageIcon(route)),
      ...getInventoryKpiPreloadIcons(),
    ]);
  }, []);

  return children;
}
