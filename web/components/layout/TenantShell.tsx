'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppToastHost } from '@/components/shared/AppToastHost';
import { AppConfirmDialog } from '@/components/shared/AppConfirmDialog';
import { BengaliFontLoader } from '@/components/shared/BengaliFontLoader';
import { NavScrollReset } from '@/components/layout/NavScrollReset';
import { ToysLoader } from '@/components/shared/ToysLoader';
import { ModuleActionsProvider } from '@/components/layout/ModuleActionsContext';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { useAppStore } from '@/lib/state/app-store';
import { useEffect } from 'react';
import { loadIcons } from '@iconify/react';
import { getAllPageIcons } from '@/lib/ui/page-icons';

export function TenantShell({ children }: { children: React.ReactNode }) {
  const hydrated = useAppStore((s) => s.hydrated);
  const ready = useAppStore((s) => s.ready);
  const showBootLoader = !hydrated || !ready;

  useEffect(() => {
    loadIcons(getAllPageIcons());
  }, []);

  return (
    <>
      <BengaliFontLoader />
      <NavScrollReset />
      <AppToastHost />
      <AppConfirmDialog />
      {showBootLoader ? <ToysLoader label="Loading Workspace..." /> : null}
      <div id="screen-workspace" className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <Header title="Enterprise Workspace" />
          <AuthGuard>
            <ModuleActionsProvider>
              <ModuleShell>{children}</ModuleShell>
            </ModuleActionsProvider>
          </AuthGuard>
        </main>
      </div>
    </>
  );
}
