import { cookies } from 'next/headers';
import { dataSourceConfig } from '@/lib/config/data-source';

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
  meta?: Record<string, unknown>;
};

export async function serverApiRequest<T>(
  path: string,
  _revalidateSeconds = 30,
  options?: { timeoutMs?: number },
): Promise<{ data: T; meta?: Record<string, unknown> } | null> {
  const url = `${dataSourceConfig.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;

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
  } catch {
    return null;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
