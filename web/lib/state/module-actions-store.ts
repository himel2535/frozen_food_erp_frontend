import type { ReactNode } from 'react';

type Listener = () => void;

let actionsGetter: (() => ReactNode) | null = null;
let chromeSuppressed = false;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeModuleChrome(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function registerModuleActionsGetter(getter: (() => ReactNode) | null) {
  actionsGetter = getter;
  emit();
}

export function notifyModuleActionsUpdate() {
  emit();
}

export function setModuleChromeSuppressed(suppressed: boolean) {
  if (chromeSuppressed === suppressed) return;
  chromeSuppressed = suppressed;
  emit();
}

export function getModuleActionsSnapshot(): ReactNode {
  return actionsGetter?.() ?? null;
}

export function getChromeSuppressedSnapshot(): boolean {
  return chromeSuppressed;
}
