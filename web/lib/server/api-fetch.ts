import { cookies } from 'next/headers';
import { dataSourceConfig } from '@/lib/config/data-source';

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
  meta?: Record<string, unknown>;
};

const BACKEND_COOLDOWN_MS = 15_000;
let backendUnreachableUntil = 0;

function normalizeServerApiUrl(url: string): string {
  return url.replace(/\/\/localhost\b/i, '//127.0.0.1');
}

function isConnectionError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = (err as { code?: string }).code;
  if (code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'ECONNRESET') return true;
  if (err instanceof AggregateError) {
    return err.errors.some((nested) => isConnectionError(nested));
  }
  const cause = (err as { cause?: unknown }).cause;
  if (cause && cause !== err) return isConnectionError(cause);
  return false;
}

export async function serverApiRequest<T>(
  path: string,
  _revalidateSeconds = 30,
  options?: { timeoutMs?: number },
): Promise<{ data: T; meta?: Record<string, unknown> } | null> {
  if (Date.now() < backendUnreachableUntil) {
    return null;
  }

  const url = normalizeServerApiUrl(
    `${dataSourceConfig.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`,
  );

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const headers: HeadersInit = {};
  if (token) {
    headers.Cookie = `token=${token}`;
    headers.Authorization = `Bearer ${token}`;
  }

  const timeoutMs = options?.timeoutMs;
  const controller = timeoutMs ? new AbortController() : undefined;
  const timeoutId = timeoutMs && controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : undefined;

  try {
    const res = await fetch(url, {
      headers,
      cache: 'no-store',
      ...(controller ? { signal: controller.signal } : {}),
    });
    let body: ApiEnvelope<T> | null = null;
    try {
      body = (await res.json()) as ApiEnvelope<T>;
    } catch {
      body = null;
    }

    if (!res.ok || body?.success === false) {
      return null;
    }

    return { data: body?.data as T, meta: body?.meta };
  } catch (err) {
    if (isConnectionError(err)) {
      backendUnreachableUntil = Date.now() + BACKEND_COOLDOWN_MS;
    }
    return null;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
