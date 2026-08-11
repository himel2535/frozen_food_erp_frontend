import { dataSourceConfig } from '@/lib/config/data-source';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
  details?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

function formatApiError(status: number, body: ApiEnvelope<unknown> | null): string {
  const base = body?.message ?? `Request failed (${status})`;
  if (status === 409) {
    const key = body?.details ? JSON.stringify(body.details) : '';
    return key ? `${base} — record already exists ${key}` : `${base} — this record ID already exists in the database`;
  }
  return base;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ data: T; meta?: Record<string, unknown> }> {
  const url = `${dataSourceConfig.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const method = (options.method ?? 'GET').toUpperCase();
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    ...(method === 'GET' ? { cache: 'no-store' as RequestCache } : {}),
  };
  const res = await fetch(url, fetchOptions);
  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    body = null;
  }

  if (!res.ok || body?.success === false) {
    throw new ApiError(res.status, formatApiError(res.status, body));
  }

  return { data: body?.data as T, meta: body?.meta };
}
