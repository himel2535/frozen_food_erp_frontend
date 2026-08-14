/** Global API mutation notifications — keeps ApiStateHydrator in sync after CRUD. */

import type { ApiModule } from '@/lib/config/data-source';

export const API_MUTATION_EVENT = 'hookerp:api-mutation';

const mutatedModules = new Set<string>();

export function notifyApiMutation(modules?: ApiModule[]) {
  if (typeof window === 'undefined') return;
  if (modules) {
    modules.forEach((mod) => mutatedModules.add(mod));
  } else {
    mutatedModules.add('*');
  }
  window.dispatchEvent(new CustomEvent(API_MUTATION_EVENT, { detail: { modules } }));
}

export function onApiMutation(handler: (modules?: ApiModule[]) => void) {
  if (typeof window === 'undefined') return () => {};
  const listener = (e: Event) => {
    const detail = (e as CustomEvent<{ modules?: ApiModule[] }>).detail;
    handler(detail?.modules);
  };
  window.addEventListener(API_MUTATION_EVENT, listener);
  return () => window.removeEventListener(API_MUTATION_EVENT, listener);
}

export function consumeModuleMutation(module: string): boolean {
  if (mutatedModules.has('*')) {
    mutatedModules.delete('*');
    mutatedModules.delete(module);
    return true;
  }
  if (mutatedModules.has(module)) {
    mutatedModules.delete(module);
    return true;
  }
  return false;
}
