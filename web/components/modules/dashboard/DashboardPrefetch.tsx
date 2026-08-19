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
  peekDashboardSummary,
} from '@/lib/services/api-resource-service';

export function DashboardPrefetch() {
  const pathname = usePathname();
  const authReady = useAppStore((s) => s.authReady);
  const authUser = useAppStore((s) => s.authUser);

  useEffect(() => {
    if (!isMongoDbBackend() || !authReady || !authUser || !isDashboardPath(pathname)) return;

    void fetchDashboardBusinessAlerts();
    void fetchDashboardSummary('extra');
    void fetchDashboardTopProducts(5);

    // Only fetch scope=kpi if not already cached/fetched
    if (!peekDashboardSummary('kpi')) {
      void fetchDashboardSummary('kpi');
    }
  }, [authReady, authUser, pathname]);

  return null;
}
