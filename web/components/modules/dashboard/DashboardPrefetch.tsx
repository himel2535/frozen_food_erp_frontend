'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/state/app-store';
import { isMongoDbBackend } from '@/lib/config/data-source';
import { isDashboardPath } from '@/lib/ui/dashboard-kpi';
import {
  fetchDashboardBusinessAlerts,
  fetchDashboardSummary,
  fetchDashboardTopProducts,
  fetchResourcePage,
} from '@/lib/services/api-resource-service';

/** Start dashboard APIs as soon as auth is ready — do not wait for the ssr:false view chunk. */
export function DashboardPrefetch() {
  const pathname = usePathname();
  const authReady = useAppStore((s) => s.authReady);
  const authUser = useAppStore((s) => s.authUser);

  useEffect(() => {
    if (!isMongoDbBackend() || !authReady || !authUser || !isDashboardPath(pathname)) return;
    void fetchDashboardBusinessAlerts();
    void fetchDashboardSummary('kpi');
    void fetchDashboardSummary('extra');
    void fetchDashboardTopProducts(5);
    void fetchResourcePage('/audit-logs', { page: 1, limit: 5 });
  }, [authReady, authUser, pathname]);

  return null;
}
