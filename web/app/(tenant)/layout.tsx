'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div id="screen-workspace" className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <Header title="Enterprise Workspace" />
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
