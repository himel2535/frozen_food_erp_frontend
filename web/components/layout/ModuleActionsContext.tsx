'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type DependencyList,
  type ReactNode,
} from 'react';
import { useEffect } from 'react';

interface ModuleActionsContextValue {
  actions: ReactNode;
  chromeSuppressed: boolean;
  setModuleActions: (actions: ReactNode) => void;
  setChromeSuppressed: (suppressed: boolean) => void;
}

const ModuleActionsContext = createContext<ModuleActionsContextValue | null>(null);

export function ModuleActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActionsState] = useState<ReactNode>(null);
  const [chromeSuppressed, setChromeSuppressedState] = useState(false);

  const setModuleActions = useCallback((next: ReactNode) => {
    setActionsState(next);
  }, []);

  const setChromeSuppressed = useCallback((suppressed: boolean) => {
    setChromeSuppressedState(suppressed);
  }, []);

  const value = useMemo(
    () => ({
      actions,
      chromeSuppressed,
      setModuleActions,
      setChromeSuppressed,
    }),
    [actions, chromeSuppressed, setModuleActions, setChromeSuppressed],
  );

  return <ModuleActionsContext.Provider value={value}>{children}</ModuleActionsContext.Provider>;
}

export function useModuleActionsContext() {
  const ctx = useContext(ModuleActionsContext);
  if (!ctx) {
    throw new Error('useModuleActionsContext must be used within ModuleActionsProvider');
  }
  return ctx;
}

/** Register header action buttons; cleared automatically on unmount. */
export function useRegisterModuleActions(actions: ReactNode, deps: DependencyList) {
  const { setModuleActions } = useModuleActionsContext();
  useEffect(() => {
    setModuleActions(actions);
    return () => setModuleActions(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Hide persistent PageHeader (inline forms, detail views). Restored on unmount. */
export function useChromeSuppressed(suppressed: boolean) {
  const { setChromeSuppressed } = useModuleActionsContext();
  useEffect(() => {
    setChromeSuppressed(suppressed);
    return () => setChromeSuppressed(false);
  }, [suppressed, setChromeSuppressed]);
}
