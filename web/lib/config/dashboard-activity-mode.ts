/** Compile-time flag — webpack dead-code eliminates local-only branches in Mongo production builds. */
export const IS_MONGO_BUILD = (process.env.NEXT_PUBLIC_DATA_BACKEND ?? 'mongodb') === 'mongodb';

export type DashboardActivityMode = 'a' | 'b' | 'c';

/** Activity Feed LCP experiment mode (runtime via ?activityMode= or sessionStorage). */
export function readActivityMode(): DashboardActivityMode {
  if (typeof window === 'undefined') return 'b';
  try {
    const fromSession = sessionStorage.getItem('dashboard:activityMode');
    if (fromSession === 'a' || fromSession === 'b' || fromSession === 'c') return fromSession;
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('activityMode');
    if (fromQuery === 'a' || fromQuery === 'b' || fromQuery === 'c') return fromQuery;
  } catch {
    // ignore
  }
  return 'b';
}
