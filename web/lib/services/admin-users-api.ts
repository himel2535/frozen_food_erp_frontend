import { apiRequest } from '@/lib/services/api-client';
import type { AuthUserRecord, SectionId } from '@/lib/state/types';

export async function fetchAdminUsers(): Promise<AuthUserRecord[]> {
  const { data } = await apiRequest<AuthUserRecord[]>('/admin/users');
  const users = data || [];
  users.sort((a, b) => {
    const diff = String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''));
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });
  return users;
}

export async function createAdminUser(payload: {
  name: string;
  email: string;
  password?: string;
  imageUrl?: string;
  allowedSections: SectionId[];
  roleId?: string;
  isMainAdmin?: boolean;
}): Promise<AuthUserRecord> {
  const name = String(payload.name ?? '').trim();
  const email = String(payload.email ?? '').trim().toLowerCase();
  const password = String(payload.password ?? '');
  
  if (!name) throw new Error('Name is required');
  if (!email) throw new Error('Email is required');
  if (password && password.length < 6) throw new Error('Password must be at least 6 characters');

  // We are currently using the 'role' field in MongoDB to store 'admin' vs 'user'
  // But the frontend payload has `roleId` (which maps to AppRole) and `isMainAdmin`.
  // We send them as is, the backend admin.routes.ts handles `isMainAdmin`, `name`, `email`, `password`, `imageUrl`, `allowedSections`.
  // Wait, I should also send `roleId` if the backend expects it. Currently backend doesn't store roleId.
  // We will just pass the payload.

  const { data } = await apiRequest<AuthUserRecord>('/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      name,
      email,
      password,
      imageUrl: payload.imageUrl,
      allowedSections: payload.allowedSections,
      isMainAdmin: payload.isMainAdmin,
      roleId: payload.roleId
    })
  });
  
  return data;
}

export async function updateAdminUser(payload: {
  uid: string;
  name?: string;
  imageUrl?: string;
  allowedSections?: SectionId[];
  roleId?: string | null;
  status?: 'active' | 'disabled';
  password?: string;
  isMainAdmin?: boolean;
}): Promise<AuthUserRecord> {
  const uid = String(payload.uid ?? '').trim();
  if (!uid) throw new Error('uid is required');

  const { data } = await apiRequest<AuthUserRecord>(`/admin/users/${uid}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: payload.name,
      imageUrl: payload.imageUrl,
      allowedSections: payload.allowedSections,
      roleId: payload.roleId,
      status: payload.status,
      password: payload.password,
      isMainAdmin: payload.isMainAdmin
    })
  });

  return data;
}

export async function disableAdminUser(uid: string): Promise<void> {
  const id = String(uid ?? '').trim();
  if (!id) throw new Error('uid is required');

  await apiRequest(`/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'disabled' })
  });
}
