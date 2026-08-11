/** Global API mutation notifications — keeps ApiStateHydrator in sync after CRUD. */

import type { ApiModule } from '@/lib/config/data-source';

export const API_MUTATION_EVENT = 'hookerp:api-mutation';

export function notifyApiMutation(modules?: ApiModule[]) {
  if (typeof window === 'undefined') return;
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
