import { NextResponse } from 'next/server';

export function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) return value.map(stripUndefinedDeep) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, stripUndefinedDeep(v)]),
    ) as T;
  }
  return value;
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function authErrorStatus(error: unknown): number {
  const message = error instanceof Error ? error.message : '';
  if (message === 'Unauthorized') return 401;
  if (message === 'Forbidden') return 403;
  return 500;
}

export function handleAdminRouteError(
  error: unknown,
  fallback: string,
  logTag?: string,
): ReturnType<typeof jsonError> {
  const status = authErrorStatus(error);
  const message = error instanceof Error ? error.message : fallback;
  if (process.env.NODE_ENV === 'development' && logTag) {
    console.error(logTag, message);
  }
  return jsonError(message, status);
}
