'use client';

import {
  useLayoutEffect,
  useRef,
  type DependencyList,
  type ReactNode,
} from 'react';
import {
  notifyModuleActionsUpdate,
  registerModuleActionsGetter,
  setModuleChromeSuppressed,
} from '@/lib/state/module-actions-store';

/** Passthrough wrapper — action state lives in module-actions-store to avoid provider re-render loops. */
export function ModuleActionsProvider({ children }: { children: ReactNode }) {
  return children;
}

/** Register header action buttons; cleared automatically on unmount. */
export function useRegisterModuleActions(actions: ReactNode, deps: DependencyList = []) {
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  useLayoutEffect(() => {
    registerModuleActionsGetter(() => actionsRef.current);
    return () => registerModuleActionsGetter(null);
  }, []);

  useLayoutEffect(() => {
    notifyModuleActionsUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Hide persistent PageHeader (inline forms, detail views). Restored on unmount. */
export function useChromeSuppressed(suppressed: boolean) {
  useLayoutEffect(() => {
    setModuleChromeSuppressed(suppressed);
    return () => setModuleChromeSuppressed(false);
  }, [suppressed]);
}
