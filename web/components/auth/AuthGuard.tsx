'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/state/app-store';
import {
  canAccessPath,
  getFirstAllowedHref,
  isMainAdmin,
} from '@/lib/services/access-control-service';
import { toast } from '@/lib/ui/feedback';
import { DashboardLoadingSkeleton } from '@/components/skeletons/DashboardLoadingSkeleton';
import { DASHBOARD_KPI_CARDS } from '@/lib/ui/dashboard-kpi';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoggedIn = useAppStore((s) => s.appState.isLoggedIn);
  const authUser = useAppStore((s) => s.authUser);
  const authReady = useAppStore((s) => s.authReady);
  const hydrated = useAppStore((s) => s.hydrated);
  const ready = useAppStore((s) => s.ready);
  const t = useAppStore((s) => s.t);
  const deniedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hydrated || !authReady) return;
    if (!isLoggedIn && pathname !== '/login') {
      router.replace('/login');
    }
  }, [hydrated, authReady, isLoggedIn, pathname, router]);

  useEffect(() => {
    if (!hydrated || !authReady || !isLoggedIn || !authUser) return;

    const path = pathname.split('?')[0].split('#')[0];
    const adminOnly =
      path === '/settings/users' || path.startsWith('/settings/users/')
      || path === '/settings/roles' || path.startsWith('/settings/roles/');

    if (adminOnly && !isMainAdmin(authUser)) {
      if (deniedRef.current !== path) {
        deniedRef.current = path;
        toast.error('Access denied', {
          description: path.includes('/roles')
            ? 'Only main admin can manage roles.'
            : 'Only main admin can manage users.',
        });
      }
      router.replace(getFirstAllowedHref(authUser));
      return;
    }

    if (!canAccessPath(authUser, pathname)) {
      if (deniedRef.current !== path) {
        deniedRef.current = path;
        toast.error('Access denied', { description: 'You do not have access to this section.' });
      }
      router.replace(getFirstAllowedHref(authUser));
      return;
    }

    deniedRef.current = null;
  }, [hydrated, authReady, isLoggedIn, authUser, pathname, router]);

  if (!hydrated || !ready) {
    return null;
  }

  if (!authReady) {
    const path = pathname.split('?')[0].split('#')[0].replace(/\/$/, '') || '/dashboard';
    if (path === '/dashboard') {
      return (
        <DashboardLoadingSkeleton
          label="Loading workspace"
          kpiLabels={DASHBOARD_KPI_CARDS.map((card) => t(card.labelKey))}
        />
      );
    }
    return null;
  }

  if (!isLoggedIn) {
    return null;
  }

  return <>{children}</>;
}

export function LoginGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useAppStore((s) => s.hydrated);
  const authReady = useAppStore((s) => s.authReady);
  const isLoggedIn = useAppStore((s) => s.appState.isLoggedIn);
  const authUser = useAppStore((s) => s.authUser);

  useEffect(() => {
    if (hydrated && authReady && isLoggedIn) {
      router.replace(getFirstAllowedHref(authUser));
    }
  }, [hydrated, authReady, isLoggedIn, authUser, router]);

  return <>{children}</>;
}
