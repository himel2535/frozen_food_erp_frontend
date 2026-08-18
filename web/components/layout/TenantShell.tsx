'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { BengaliFontLoader } from '@/components/shared/BengaliFontLoader';
import { ToysLoader } from '@/components/shared/ToysLoader';
import { ModuleActionsProvider } from '@/components/layout/ModuleActionsContext';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { ApiStateHydrator } from '@/components/providers/ApiStateHydrator';
import { DashboardPrefetch } from '@/components/modules/dashboard/DashboardPrefetch';
import { SocketProvider } from '@/components/providers/SocketProvider';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/state/app-store';
import { registerChromeIcons } from '@/lib/ui/register-chrome-icons';
import { isDashboardPath } from '@/lib/ui/dashboard-kpi';

registerChromeIcons();

export function TenantShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hydrated = useAppStore((s) => s.hydrated);
  const ready = useAppStore((s) => s.ready);
  const showBootLoader = (!hydrated || !ready) && !isDashboardPath(pathname);

  return (
    <SocketProvider>
      <ApiStateHydrator />
      <DashboardPrefetch />
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
