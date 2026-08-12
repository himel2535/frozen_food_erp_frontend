import { dataSourceConfig } from '@/lib/config/data-source';

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
  meta?: Record<string, unknown>;
};

export async function serverApiRequest<T>(
  path: string,
  revalidateSeconds = 30,
): Promise<{ data: T; meta?: Record<string, unknown> } | null> {
  const url = `${dataSourceConfig.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  try {
    const res = await fetch(url, { next: { revalidate: revalidateSeconds } });
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
  }
}
