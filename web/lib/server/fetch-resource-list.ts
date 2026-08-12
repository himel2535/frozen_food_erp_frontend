import { serverApiRequest } from '@/lib/server/api-fetch';

const LIST_PAGE_SIZE = 100;
const MAX_LIST_PAGES = 10;

function normalizeListPath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

/** Paginated list fetch for Server Components — uses Next.js revalidate caching. */
export async function fetchServerResourceList(
  path: string,
  revalidateSeconds = 30,
): Promise<Record<string, unknown>[]> {
  const base = normalizeListPath(path);

  const first = await serverApiRequest<Record<string, unknown>[]>(
    `${base}?limit=${LIST_PAGE_SIZE}&page=1`,
    revalidateSeconds,
  );
  if (!first) return [];

  const firstBatch = Array.isArray(first.data) ? first.data : [];
  const totalPages = Math.min(
    Math.max(1, Number(first.meta?.totalPages ?? 1)),
    MAX_LIST_PAGES,
  );

  if (totalPages <= 1) {
    return firstBatch;
  }

  const all = [...firstBatch];
  for (let page = 2; page <= totalPages; page += 1) {
    const next = await serverApiRequest<Record<string, unknown>[]>(
      `${base}?limit=${LIST_PAGE_SIZE}&page=${page}`,
      revalidateSeconds,
    );
    const batch = Array.isArray(next?.data) ? next.data : [];
    all.push(...batch);
    if (batch.length === 0) break;
  }

  return all;
}
