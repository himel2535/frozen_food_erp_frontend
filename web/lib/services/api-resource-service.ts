import { apiRequest } from '@/lib/services/api-client';

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

/** Fetch every page from a paginated CRUD list endpoint. */
export async function fetchResourceList(path: string): Promise<Record<string, unknown>[]> {
  const base = path.startsWith('/') ? path : `/${path}`;
  let page = 1;
  let totalPages = 1;
  const all: Record<string, unknown>[] = [];

  while (page <= totalPages) {
    const { data, meta } = await apiRequest<Record<string, unknown>[]>(
      `${base}?limit=${LIST_PAGE_SIZE}&page=${page}`,
    );
    const batch = Array.isArray(data) ? data : [];
    all.push(...batch);
    totalPages = Math.max(1, Number(meta?.totalPages ?? 1));
    if (batch.length === 0) break;
    page += 1;
  }

  return all;
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
