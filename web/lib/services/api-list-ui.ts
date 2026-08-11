/** Table empty state — show loading text until first API fetch completes. */
export function apiListEmptyMessage(
  loading: boolean,
  initialized: boolean,
  label: string,
  options?: { totalCount?: number; filteredCount?: number },
): string {
  if (loading || !initialized) return `Loading ${label}…`;
  const total = options?.totalCount ?? 0;
  const filtered = options?.filteredCount ?? 0;
  if (filtered === 0 && total > 0) {
    return 'No records match your filters. Clear search or filters to see all.';
  }
  return `No ${label} found.`;
}
