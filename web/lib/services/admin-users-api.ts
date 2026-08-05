import { getIdToken } from '@/lib/services/auth-service';
import type { AuthUserRecord, SectionId } from '@/lib/state/types';

async function authHeaders(): Promise<HeadersInit> {
  const token = await getIdToken();
  if (!token) throw new Error('Not authenticated');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function parseResponse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export async function fetchAdminUsers(): Promise<AuthUserRecord[]> {
  const headers = await authHeaders();
  const res = await fetch('/api/admin/users', { headers, cache: 'no-store' });
  const data = await parseResponse<{ users: AuthUserRecord[] }>(res);
  return data.users;
}

export async function createAdminUser(payload: {
  name: string;
  email: string;
  password: string;
  allowedSections: SectionId[];
  roleId?: string;
  isMainAdmin?: boolean;
}): Promise<AuthUserRecord> {
  const headers = await authHeaders();
  const res = await fetch('/api/admin/users', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await parseResponse<{ user: AuthUserRecord }>(res);
  return data.user;
}

export async function updateAdminUser(payload: {
  uid: string;
  name?: string;
  allowedSections?: SectionId[];
  roleId?: string | null;
  status?: 'active' | 'disabled';
  password?: string;
  isMainAdmin?: boolean;
}): Promise<AuthUserRecord> {
  const headers = await authHeaders();
  const res = await fetch('/api/admin/users', {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await parseResponse<{ user: AuthUserRecord }>(res);
  return data.user;
}

export async function disableAdminUser(uid: string): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`/api/admin/users?uid=${encodeURIComponent(uid)}`, {
    method: 'DELETE',
    headers,
  });
  await parseResponse<{ ok: boolean }>(res);
}
