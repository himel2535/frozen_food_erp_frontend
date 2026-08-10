'use client';

import { useLayoutEffect, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { ModulePageHeader } from '@/components/layout/ModulePageHeader';
import {
  getChromeSuppressedSnapshot,
  registerModuleActionsGetter,
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

  useSyncExternalStore(subscribeModuleChrome, getChromeSuppressedSnapshot, getChromeSuppressedSnapshot);

  useLayoutEffect(() => {
    setModuleChromeSuppressed(false);
    registerModuleActionsGetter(null);
  }, [pathname]);

  const chromeSuppressed = getChromeSuppressedSnapshot();
  const isSettingsOverview = isHeaderlessModulePath(pathname);
  const shellClass = chromeSuppressed
    ? MODULE_SHELL_SUPPRESSED
    : isSettingsOverview
      ? MODULE_SETTINGS_OVERVIEW_SHELL
      : MODULE_LIST_SHELL;

  return (
    <div id={MODULE_SCROLL_ID} className={shellClass}>
      <ModulePageHeader />
      {children}
    </div>
  );
}
