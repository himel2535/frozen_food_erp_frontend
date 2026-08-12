'use client';

import { useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { ModulePageHeader } from '@/components/layout/ModulePageHeader';
import {
  getChromeSuppressedSnapshot,
  setModuleChromeSuppressed,
  subscribeModuleChrome,
} from '@/lib/state/module-actions-store';
import { isHeaderlessModulePath } from '@/lib/navigation/page-meta';
import {
  MODULE_LIST_SHELL,
  MODULE_SCROLL_ID,
  MODULE_SETTINGS_OVERVIEW_SHELL,
  MODULE_SHELL_SUPPRESSED,
} from '@/lib/ui/module-layout';

export function ModuleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const topModuleRef = useRef('');
  const prevPathRef = useRef(pathname);

  useSyncExternalStore(subscribeModuleChrome, getChromeSuppressedSnapshot, getChromeSuppressedSnapshot);

  useLayoutEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      setModuleChromeSuppressed(false);
    }
    const topModule = pathname.split('/').filter(Boolean)[0] ?? 'dashboard';
    const scrollable = document.getElementById(MODULE_SCROLL_ID);
    if (scrollable && topModuleRef.current !== topModule) {
      scrollable.scrollTop = 0;
      topModuleRef.current = topModule;
    }
  }, [pathname]);

  const chromeSuppressed = getChromeSuppressedSnapshot();
  const isSettingsOverview = isHeaderlessModulePath(pathname);
  const path = pathname.split('?')[0].split('#')[0].replace(/\/$/, '') || '/dashboard';
  const showModuleHeader = !chromeSuppressed && path !== '/dashboard' && !isSettingsOverview;
  const shellClass = chromeSuppressed
    ? MODULE_SHELL_SUPPRESSED
    : isSettingsOverview
      ? MODULE_SETTINGS_OVERVIEW_SHELL
      : MODULE_LIST_SHELL;

  return (
    <div id={MODULE_SCROLL_ID} className={shellClass}>
      <div className={showModuleHeader ? 'module-page-header-anchor shrink-0' : undefined}>
        <ModulePageHeader />
      </div>
      {children}
    </div>
  );
}
