'use client';

import { usePathname } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { useModuleActionsContext } from '@/components/layout/ModuleActionsContext';
import { useAppStore } from '@/lib/state/app-store';
import { getPageMeta } from '@/lib/navigation/page-meta';
import {
  MODULE_LIST_SHELL,
  MODULE_SCROLL_ID,
  MODULE_SHELL_SUPPRESSED,
} from '@/lib/ui/module-layout';

function normalizePath(pathname: string): string {
  const path = pathname.split('?')[0].split('#')[0].replace(/\/$/, '');
  return path || '/dashboard';
}

export function ModuleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useAppStore((s) => s.t);
  const { actions, chromeSuppressed } = useModuleActionsContext();

  const path = normalizePath(pathname);
  const isDashboard = path === '/dashboard';
  const showChrome = !chromeSuppressed && !isDashboard;
  const meta = getPageMeta(pathname, t);

  const shellClass = showChrome ? MODULE_LIST_SHELL : MODULE_SHELL_SUPPRESSED;

  return (
    <div id={MODULE_SCROLL_ID} className={shellClass}>
      {showChrome ? (
        <PageHeader
          title={meta.title}
          subtitle={meta.subtitle}
          icon={meta.icon}
          actions={actions}
          size="compact"
        />
      ) : null}
      {children}
    </div>
  );
}
