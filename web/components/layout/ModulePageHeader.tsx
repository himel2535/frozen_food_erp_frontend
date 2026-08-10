'use client';

import { useLayoutEffect, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { loadIcons } from '@iconify/react';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAppStore } from '@/lib/state/app-store';
import { getPageMeta, isHeaderlessModulePath } from '@/lib/navigation/page-meta';
import { getPageIcon } from '@/lib/ui/page-icons';
import {
  getChromeSuppressedSnapshot,
  getModuleActionsSnapshot,
  subscribeModuleChrome,
} from '@/lib/state/module-actions-store';

function normalizePath(pathname: string): string {
  const path = pathname.split('?')[0].split('#')[0].replace(/\/$/, '');
  return path || '/dashboard';
}

/** Persistent page header — subscribes to action store without re-rendering route pages. */
export function ModulePageHeader() {
  const pathname = usePathname();
  const t = useAppStore((s) => s.t);

  useSyncExternalStore(subscribeModuleChrome, getModuleActionsSnapshot, getModuleActionsSnapshot);
  useSyncExternalStore(subscribeModuleChrome, getChromeSuppressedSnapshot, getChromeSuppressedSnapshot);

  const path = normalizePath(pathname);
  const isDashboard = path === '/dashboard';
  const chromeSuppressed = getChromeSuppressedSnapshot();

  useLayoutEffect(() => {
    loadIcons([getPageIcon(pathname)]);
  }, [pathname]);

  if (chromeSuppressed || isDashboard || isHeaderlessModulePath(pathname)) return null;

  const meta = getPageMeta(pathname, t);
  const actions = getModuleActionsSnapshot();

  return (
    <PageHeader
      title={meta.title}
      subtitle={meta.subtitle}
      icon={meta.icon}
      actions={actions}
      size="compact"
      className="module-page-header-slot"
    />
  );
}
