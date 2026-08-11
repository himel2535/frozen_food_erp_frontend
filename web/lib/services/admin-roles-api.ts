import {
  auth,
  authRoleRef,
  authUserRef,
  database,
  listAuthRoleRecords,
  listAuthUserRecords,
} from '@/lib/firebase';
import { get, ref, remove, set, update } from 'firebase/database';
import type { RoleRecord, SectionId } from '@/lib/state/types';
import {
  generateRoleId,
  normalizeRole,
  normalizeRoleSections,
  stripUndefinedDeep,
} from '@/lib/services/admin-rtdb-utils';

async function countUsersByRole(): Promise<Record<string, number>> {
  const raw = await listAuthUserRecords();
  const counts: Record<string, number> = {};
  for (const value of Object.values(raw)) {
    const roleId = value.roleId ? String(value.roleId) : '';
    if (roleId) counts[roleId] = (counts[roleId] ?? 0) + 1;
  }
  return counts;
}

export async function fetchAdminRoles(): Promise<RoleRecord[]> {
  const raw = await listAuthRoleRecords();
  const roles = Object.entries(raw).map(([id, value]) => normalizeRole(id, value));
  roles.sort((a, b) => {
    const diff = String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''));
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });
  return roles;
}

export async function fetchRoleUserCounts(): Promise<Record<string, number>> {
  return countUsersByRole();
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
  const name = String(payload.name ?? '').trim();
  if (!name) throw new Error('Role name is required');

  const id = generateRoleId(name);
  const record: RoleRecord = {
    id,
    name,
    description: payload.description?.trim() || undefined,
    contactEmail: payload.contactEmail?.trim().toLowerCase() || undefined,
    notes: payload.notes?.trim() || undefined,
    allowedSections: normalizeRoleSections(payload.allowedSections),
    status: payload.status === 'inactive' ? 'inactive' : 'active',
    isPreset: Boolean(payload.isPreset),
    createdAt: new Date().toISOString(),
    createdBy: auth.currentUser?.uid,
  };

  await set(authRoleRef(id), stripUndefinedDeep(record));
  return record;
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
  const id = String(payload.id ?? '').trim();
  if (!id) throw new Error('Role id is required');

  const snap = await get(authRoleRef(id));
  if (!snap.exists()) throw new Error('Role not found');

  const existing = normalizeRole(id, snap.val() as Record<string, unknown>);
  const updates: Partial<RoleRecord> = {};

  if (typeof payload.name === 'string' && payload.name.trim()) {
    updates.name = payload.name.trim();
  }
  if (typeof payload.description === 'string') {
    updates.description = payload.description.trim() || undefined;
  }
  if (typeof payload.contactEmail === 'string') {
    updates.contactEmail = payload.contactEmail.trim().toLowerCase() || undefined;
  }
  if (typeof payload.notes === 'string') {
    updates.notes = payload.notes.trim() || undefined;
  }
  if (payload.allowedSections) {
    updates.allowedSections = normalizeRoleSections(payload.allowedSections);
  }
  if (payload.status === 'active' || payload.status === 'inactive') {
    updates.status = payload.status;
  }

  if (Object.keys(updates).length) {
    await update(authRoleRef(id), stripUndefinedDeep(updates));
  }

  if (updates.name && updates.name !== existing.name) {
    const users = await listAuthUserRecords();
    const userUpdates: Record<string, unknown> = {};
    for (const [uid, user] of Object.entries(users)) {
      if (String(user.roleId ?? '') === id) {
        userUpdates[`toysfactory/auth/users/${uid}/roleName`] = updates.name;
      }
    }
    if (Object.keys(userUpdates).length) {
      await update(ref(database, '/'), userUpdates);
    }
  }

  const nextSnap = await get(authRoleRef(id));
  return normalizeRole(id, nextSnap.val() as Record<string, unknown>);
}

export async function deactivateAdminRole(id: string): Promise<void> {
  const roleId = String(id ?? '').trim();
  if (!roleId) throw new Error('Role id is required');

  const snap = await get(authRoleRef(roleId));
  if (!snap.exists()) throw new Error('Role not found');

  const counts = await countUsersByRole();
  if ((counts[roleId] ?? 0) > 0) {
    await update(authRoleRef(roleId), { status: 'inactive' });
    return;
  }

  await remove(authRoleRef(roleId));
}
