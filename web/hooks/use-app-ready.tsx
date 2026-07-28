'use client';

import { useEffect } from 'react';
import { bootstrapAppStore, useAppStore } from '@/lib/state/app-store';

export function AppReadyProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    bootstrapAppStore();
  }, []);

  return <>{children}</>;
}

export function useAppReady() {
  return useAppStore((s) => s.ready);
}
