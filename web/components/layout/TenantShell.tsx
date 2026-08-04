'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppToastHost } from '@/components/shared/AppToastHost';
import { AppConfirmDialog } from '@/components/shared/AppConfirmDialog';
import { BengaliFontLoader } from '@/components/shared/BengaliFontLoader';
import { NavScrollReset } from '@/components/layout/NavScrollReset';

export function TenantShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BengaliFontLoader />
      <NavScrollReset />
      <AppToastHost />
      <AppConfirmDialog />
      <div id="screen-workspace" className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <Header title="Enterprise Workspace" />
          <AuthGuard>{children}</AuthGuard>
        </main>
      </div>
    </>
  );
}
