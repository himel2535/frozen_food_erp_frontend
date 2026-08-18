import { dataSourceConfig } from '@/lib/config/data-source';
import { isPerfTraceEnabled, perfMark, recordMutationTrace } from '@/lib/utils/perf-trace';

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

const inflightGetRequests = new Map<string, Promise<any>>();

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ data: T; meta?: Record<string, unknown> }> {
  const method = (options.method ?? 'GET').toUpperCase();

  if (method === 'GET') {
    const url = `${dataSourceConfig.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    let promise = inflightGetRequests.get(url);
    if (!promise) {
      promise = (async () => {
        try {
          return await apiRequestInternal<T>(path, options);
        } finally {
          inflightGetRequests.delete(url);
        }
      })();
      inflightGetRequests.set(url, promise);
    }
    return promise;
  }

  return apiRequestInternal<T>(path, options);
}

async function apiRequestInternal<T>(
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
    credentials: 'include',
    ...(method === 'GET' ? { cache: 'no-store' as RequestCache } : {}),
  };

  const controller = new AbortController();
  const timeoutMs = 15000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const traceEnabled = isPerfTraceEnabled();
  const traceId = traceEnabled ? `api:${method}:${path}:${Date.now()}` : '';
  if (traceEnabled) perfMark(`${traceId}:start`);

  let res: Response;
  try {
    res = await fetch(url, { ...fetchOptions, signal: controller.signal });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError(408, 'Request timed out — server is slow or unreachable');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    body = null;
  }

  if (!res.ok || body?.success === false) {
    throw new ApiError(res.status, formatApiError(res.status, body));
  }

  if (traceEnabled) {
    perfMark(`${traceId}:end`);
    const perfHeader = res.headers.get('X-Perf-Trace') ?? undefined;
    if (method !== 'GET') {
      recordMutationTrace({
        operation: `${method} ${path}`,
        marks: { api: Math.round(performance.now()) },
        perfTraceHeader: perfHeader,
      });
    }
  }

  return { data: body?.data as T, meta: body?.meta };
}
