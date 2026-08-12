'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { AppState } from '@/lib/state/types';

export const DashboardStateContext = createContext<AppState | null>(null);

export function DashboardStateProvider({
  value,
  children,
}: {
  value: AppState;
  children: ReactNode;
}) {
  return (
    <DashboardStateContext.Provider value={value}>
      {children}
    </DashboardStateContext.Provider>
  );
}

export function useDashboardStateOverride(): AppState | null {
  return useContext(DashboardStateContext);
}
