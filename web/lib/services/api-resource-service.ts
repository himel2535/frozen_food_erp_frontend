import { apiRequest } from '@/lib/services/api-client';
import { getApiListCache, hasApiListCache, setApiListCache } from '@/lib/services/api-list-cache';

export function apiDocId(doc: { id?: string; _id?: string; legacyId?: string }): string {
  return String(doc.id ?? doc._id ?? doc.legacyId ?? '');
}

/** Strip client ids on POST — backend assigns unique legacyId */
export function sanitizeApiCreateBody(body: Record<string, unknown>): Record<string, unknown> {
  const next = { ...body };
  for (const key of ['legacyId', 'id', '_id', '_mongoId']) {
    delete next[key];
  }
  for (const key of ['sku', 'employeeCode', 'ticketNo', 'receiptNo', 'code']) {
    if (next[key] != null && String(next[key]).trim() === '') delete next[key];
  }
  return next;
}

const LIST_PAGE_SIZE = 100;
const MAX_LIST_PAGES = 10;

/** Fetch every page from a paginated CRUD list endpoint. */
export async function fetchResourceList(path: string): Promise<Record<string, unknown>[]> {
  const base = normalizeListPath(path);

  const first = await apiRequest<Record<string, unknown>[]>(
    `${base}?limit=${LIST_PAGE_SIZE}&page=1`,
  );
  const firstBatch = Array.isArray(first.data) ? first.data : [];
  const totalPages = Math.min(
    Math.max(1, Number(first.meta?.totalPages ?? 1)),
    MAX_LIST_PAGES,
  );

  if (totalPages <= 1) {
    setApiListCache(base, firstBatch);
    return firstBatch;
  }

  const all = [...firstBatch];
  for (let page = 2; page <= totalPages; page += 1) {
    const { data } = await apiRequest<Record<string, unknown>[]>(
      `${base}?limit=${LIST_PAGE_SIZE}&page=${page}`,
    );
    const batch = Array.isArray(data) ? data : [];
    all.push(...batch);
    if (batch.length === 0) break;
  }

  setApiListCache(base, all);
  return all;
}

function normalizeListPath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

/** Return cached rows when available (no network). */
export function readCachedResourceList(path: string): Record<string, unknown>[] | null {
  return getApiListCache(normalizeListPath(path));
}

/** True once this list endpoint has completed at least one fetch. */
export function isCachedResourceList(path: string): boolean {
  return hasApiListCache(normalizeListPath(path));
}

export async function fetchResourceById(path: string, id: string): Promise<Record<string, unknown> | null> {
  try {
    const { data } = await apiRequest<Record<string, unknown>>(`${path}/${id}`);
    return data ?? null;
  } catch {
    return null;
  }
}

export async function createResource(
  path: string,
  body: Record<string, unknown>,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const { data } = await apiRequest<Record<string, unknown>>(path, {
      method: 'POST',
      body: JSON.stringify(sanitizeApiCreateBody(body)),
    });
    const id = apiDocId(data ?? {});
    if (!id) return { ok: false, error: 'Missing id from API response' };
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Create failed' };
  }
}

export async function updateResource(
  path: string,
  id: string,
  body: Record<string, unknown>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await apiRequest<Record<string, unknown>>(`${path}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Update failed' };
  }
}

export async function deleteResource(
  path: string,
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await apiRequest<null>(`${path}/${id}`, { method: 'DELETE' });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Delete failed' };
  }
}
