/** KPI / module cards should skeleton until the first API fetch completes (avoid flashing 0). */
export function isKpiBootLoading(apiEnabled: boolean, initialized: boolean): boolean {
  return apiEnabled && !initialized;
}

/** Alias used by list modules (same boot gate as KPI cards). */
export const isModuleBootLoading = isKpiBootLoading;

/** Prefer live API rows; never show stale local rows while API is still booting. */
export function pickApiReportRows<T>(
  apiMode: boolean,
  initialized: boolean,
  apiRows: T[],
  localRows: T[],
): T[] {
  if (!apiMode) return localRows;
  return initialized ? apiRows : [];
}

/** List pages — same empty-row guard as reports. */
export const pickApiListRows = pickApiReportRows;

/** Standard table skeleton flag for AppTable on API-backed list pages. */
export function moduleTableLoading(apiEnabled: boolean, initialized: boolean): boolean {
  return isModuleBootLoading(apiEnabled, initialized);
}

/** KPI section should render during boot even when computed items are still empty. */
export function shouldShowModuleKpis(loading: boolean, itemCount: number): boolean {
  return loading || itemCount > 0;
}
