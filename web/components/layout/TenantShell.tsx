'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { BengaliFontLoader } from '@/components/shared/BengaliFontLoader';
import { ToysLoader } from '@/components/shared/ToysLoader';
import { ModuleActionsProvider } from '@/components/layout/ModuleActionsContext';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { ApiStateHydrator } from '@/components/providers/ApiStateHydrator';
import { SocketProvider } from '@/components/providers/SocketProvider';
import { useAppStore } from '@/lib/state/app-store';
import { useEffect } from 'react';
import { loadIcons } from '@iconify/react';

export function TenantShell({ children }: { children: React.ReactNode }) {
  const hydrated = useAppStore((s) => s.hydrated);
  const ready = useAppStore((s) => s.ready);
  const showBootLoader = !hydrated || !ready;

  useEffect(() => {
    void import('@/lib/ui/page-icons').then(({ getPageIcon }) => {
      loadIcons([getPageIcon(window.location.pathname)]);
    });
  }, []);

  return (
    <SocketProvider>
      <ApiStateHydrator />
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
    </SocketProvider>
  );
}
