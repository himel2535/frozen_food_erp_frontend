import { serverApiRequest } from '@/lib/server/api-fetch';
import {
  buildListQueryString,
  DEFAULT_LIST_PAGE_SIZE,
  parseApiPaginationMeta,
  type ApiListQuery,
} from '@/lib/services/api-pagination-types';
import type { DashboardSummary } from '@/lib/services/api-resource-service';

function normalizeListPath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

/** Single-page list fetch for Server Components — uses Next.js revalidate caching. */
export async function fetchServerResourcePage(
  path: string,
  query: ApiListQuery = {},
  revalidateSeconds = 30,
): Promise<{ rows: Record<string, unknown>[]; meta: ReturnType<typeof parseApiPaginationMeta> }> {
  const base = normalizeListPath(path);
  const qs = buildListQueryString({
    page: query.page ?? 1,
    limit: query.limit ?? DEFAULT_LIST_PAGE_SIZE,
    search: query.search,
    status: query.status,
  });

  const result = await serverApiRequest<Record<string, unknown>[]>(
    `${base}?${qs}`,
    revalidateSeconds,
  );
  if (!result) {
    return {
      rows: [],
      meta: parseApiPaginationMeta(),
    };
  }

  const rows = Array.isArray(result.data) ? result.data : [];
  return {
    rows,
    meta: parseApiPaginationMeta(result.meta),
  };
}

/** Route prefetch — first page only (fast SSR). */
export async function fetchServerResourceList(
  path: string,
  revalidateSeconds = 30,
  limit = DEFAULT_LIST_PAGE_SIZE,
): Promise<Record<string, unknown>[]> {
  const { rows } = await fetchServerResourcePage(path, { page: 1, limit }, revalidateSeconds);
  return rows;
}

export async function fetchServerDashboardSummary(options?: {
  scope?: 'kpi' | 'extra' | 'full';
  timeoutMs?: number;
}): Promise<DashboardSummary | null> {
  const scope = options?.scope ?? 'kpi';
  const result = await serverApiRequest<DashboardSummary>(
    `/dashboard/summary?scope=${scope}`,
    30,
    options?.timeoutMs != null ? { timeoutMs: options.timeoutMs } : undefined,
  );
  return result?.data ?? null;
}
