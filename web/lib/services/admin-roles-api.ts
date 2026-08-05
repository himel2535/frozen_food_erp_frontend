import { getIdToken } from '@/lib/services/auth-service';
import type { RoleRecord, SectionId } from '@/lib/state/types';

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

export async function fetchAdminRoles(): Promise<RoleRecord[]> {
  const headers = await authHeaders();
  const res = await fetch('/api/admin/roles', { headers, cache: 'no-store' });
  const data = await parseResponse<{ roles: RoleRecord[] }>(res);
  return data.roles;
}

export async function createAdminRole(payload: {
  name: string;
  description?: string;
  contactEmail?: string;
  notes?: string;
  allowedSections: SectionId[];
  status?: 'active' | 'inactive';
  isPreset?: boolean;
}): Promise<RoleRecord> {
  const headers = await authHeaders();
  const res = await fetch('/api/admin/roles', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await parseResponse<{ role: RoleRecord }>(res);
  return data.role;
}

export async function updateAdminRole(payload: {
  id: string;
  name?: string;
  description?: string;
  contactEmail?: string;
  notes?: string;
  allowedSections?: SectionId[];
  status?: 'active' | 'inactive';
}): Promise<RoleRecord> {
  const headers = await authHeaders();
  const res = await fetch('/api/admin/roles', {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await parseResponse<{ role: RoleRecord }>(res);
  return data.role;
}

export async function deactivateAdminRole(id: string): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`/api/admin/roles?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
  });
  await parseResponse<{ ok: boolean }>(res);
}

export async function fetchRoleUserCounts(): Promise<Record<string, number>> {
  const headers = await authHeaders();
  const res = await fetch('/api/admin/roles?counts=1', { headers, cache: 'no-store' });
  const data = await parseResponse<{ counts: Record<string, number> }>(res);
  return data.counts;
}
