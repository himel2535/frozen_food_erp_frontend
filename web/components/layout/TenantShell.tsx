'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { BengaliFontLoader } from '@/components/shared/BengaliFontLoader';
import { ToysLoader } from '@/components/shared/ToysLoader';
import { ModuleActionsProvider } from '@/components/layout/ModuleActionsContext';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { useAppStore } from '@/lib/state/app-store';
import { useEffect } from 'react';
import { loadIcons } from '@iconify/react';

export function TenantShell({ children }: { children: React.ReactNode }) {
  const hydrated = useAppStore((s) => s.hydrated);
  const ready = useAppStore((s) => s.ready);
  const showBootLoader = !hydrated || !ready;

  useEffect(() => {
    const preloadCurrentPageIcon = () => {
      void import('@/lib/ui/page-icons').then(({ getPageIcon }) => {
        loadIcons([getPageIcon(window.location.pathname)]);
      });
    };

    preloadCurrentPageIcon();

    const preloadRemainingPageIcons = () => {
      void import('@/lib/ui/page-icons').then(({ getAllPageIcons }) => {
        loadIcons(getAllPageIcons());
      });
    };

    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number })
      .requestIdleCallback;
    if (idle) {
      idle(preloadRemainingPageIcons, { timeout: 5000 });
    } else {
      setTimeout(preloadRemainingPageIcons, 2000);
    }
  }, []);

  return (
    <>
      <BengaliFontLoader />
      {showBootLoader ? <ToysLoader label="Loading Workspace..." /> : null}
      <div id="screen-workspace" className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <Header title="Enterprise Workspace" />
          <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
            <AuthGuard>
              <ModuleActionsProvider>
                <ModuleShell>{children}</ModuleShell>
              </ModuleActionsProvider>
            </AuthGuard>
          </div>
        </main>
      </div>
    </>
  );
}
