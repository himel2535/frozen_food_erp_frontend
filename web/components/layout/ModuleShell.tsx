'use client';

import { useSyncExternalStore } from 'react';
import { ModulePageHeader } from '@/components/layout/ModulePageHeader';
import {
  getChromeSuppressedSnapshot,
  subscribeModuleChrome,
} from '@/lib/state/module-actions-store';
import {
  MODULE_LIST_SHELL,
  MODULE_SCROLL_ID,
  MODULE_SHELL_SUPPRESSED,
} from '@/lib/ui/module-layout';

export function ModuleShell({ children }: { children: React.ReactNode }) {
  useSyncExternalStore(subscribeModuleChrome, getChromeSuppressedSnapshot, getChromeSuppressedSnapshot);

  const chromeSuppressed = getChromeSuppressedSnapshot();
  const shellClass = chromeSuppressed ? MODULE_SHELL_SUPPRESSED : MODULE_LIST_SHELL;

  return (
    <div id={MODULE_SCROLL_ID} className={shellClass}>
      <ModulePageHeader />
      {children}
    </div>
  );
}
