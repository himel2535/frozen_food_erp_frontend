export type ApiPaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ApiListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  section?: string;
  department?: string;
  period?: string;
  productType?: string;
  type?: string;
  posCategory?: string;
};

export const DEFAULT_LIST_PAGE_SIZE = 25;
export const LOOKUP_LIST_PAGE_SIZE = 100;
export const MAX_FULL_LIST_PAGES = 10;

const FILTER_KEYS: (keyof ApiListQuery)[] = [
  'category',
  'section',
  'department',
  'period',
  'productType',
  'type',
  'posCategory',
];

export function buildListQueryString(query: ApiListQuery): string {
  const params = new URLSearchParams();
  params.set('page', String(query.page ?? 1));
  params.set('limit', String(query.limit ?? DEFAULT_LIST_PAGE_SIZE));
  if (query.search?.trim()) params.set('search', query.search.trim());
  if (query.status && query.status !== 'all') params.set('status', query.status);
  for (const key of FILTER_KEYS) {
    const val = query[key];
    if (val && val !== 'all') params.set(key, String(val));
  }
  return params.toString();
}

export function parseApiPaginationMeta(meta?: Record<string, unknown>): ApiPaginationMeta {
  const total = Number(meta?.total ?? 0);
  const page = Math.max(1, Number(meta?.page ?? 1));
  const limit = Math.max(1, Number(meta?.limit ?? DEFAULT_LIST_PAGE_SIZE));
  const totalPages = Math.max(1, Number(meta?.totalPages ?? (Math.ceil(total / limit) || 1)));
  return { total, page, limit, totalPages };
}

export function listCacheKey(path: string, query: ApiListQuery): string {
  return `${path}?${buildListQueryString(query)}`;
}

function hasActiveFilters(query: ApiListQuery): boolean {
  return FILTER_KEYS.some((key) => {
    const val = query[key];
    return Boolean(val && val !== 'all');
  });
}

export function isDefaultListQuery(query: ApiListQuery): boolean {
  return !query.search?.trim()
    && (!query.status || query.status === 'all')
    && !hasActiveFilters(query);
}
