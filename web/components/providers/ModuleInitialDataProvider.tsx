'use client';

import { createContext, useContext } from 'react';
import type { ApiModule } from '@/lib/config/data-source';

export type ModuleInitialRows = Partial<Record<ApiModule, Record<string, unknown>[]>>;

const ModuleInitialDataContext = createContext<ModuleInitialRows | null>(null);

export function ModuleInitialDataProvider({
  rows,
  children,
}: {
  rows?: ModuleInitialRows | null;
  children: React.ReactNode;
}) {
  return (
    <ModuleInitialDataContext.Provider value={rows ?? null}>
      {children}
    </ModuleInitialDataContext.Provider>
  );
}

export function useModuleInitialRows(module: ApiModule): Record<string, unknown>[] | undefined {
  const ctx = useContext(ModuleInitialDataContext);
  return ctx?.[module];
}

export function useModuleInitialSnapshot(): ModuleInitialRows | null {
  return useContext(ModuleInitialDataContext);
}
