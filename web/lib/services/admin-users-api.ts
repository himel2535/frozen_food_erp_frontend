import {
  auth,
  authRoleRef,
  authUserRef,
  firebaseConfig,
  listAuthUserRecords,
  setAuthUserRecord,
  updateAuthUserRecord,
} from '@/lib/firebase';
import { child, get, remove, set, update } from 'firebase/database';
import {
  normalizeAuthUser,
  normalizeRoleSections,
  normalizeUserSections,
  stripUndefinedDeep,
} from '@/lib/services/admin-rtdb-utils';
import type { AuthUserRecord, SectionId } from '@/lib/state/types';

async function resolveRoleSections(roleId: string): Promise<{
  allowedSections: Array<SectionId | '*'>;
  roleName?: string;
} | null> {
  const snap = await get(authRoleRef(roleId));
  if (!snap.exists()) return null;
  const raw = snap.val() as { name?: string; allowedSections?: unknown };
  return {
    allowedSections: normalizeUserSections(raw.allowedSections),
    roleName: raw.name ? String(raw.name) : undefined,
  };
}

async function createFirebaseAuthUser(email: string, password: string): Promise<string> {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  const data = (await res.json().catch(() => ({}))) as {
    localId?: string;
    error?: { message?: string };
  };
  if (!res.ok || !data.localId) {
    const msg = data.error?.message ?? 'Failed to create auth user';
    if (msg.includes('EMAIL_EXISTS')) throw new Error('A user with this email already exists');
    throw new Error(msg);
  }
  return data.localId;
}

export async function fetchAdminUsers(): Promise<AuthUserRecord[]> {
  const raw = await listAuthUserRecords();
  const users = Object.entries(raw).map(([uid, value]) =>
    normalizeAuthUser(uid, value),
  );
  users.sort((a, b) => a.name.localeCompare(b.name));
  return users;
}

export async function createAdminUser(payload: {
  name: string;
  email: string;
  password: string;
  imageUrl?: string;
  allowedSections: SectionId[];
  roleId?: string;
  isMainAdmin?: boolean;
}): Promise<AuthUserRecord> {
  const name = String(payload.name ?? '').trim();
  const email = String(payload.email ?? '').trim().toLowerCase();
  const password = String(payload.password ?? '');
  const imageUrl = String(payload.imageUrl ?? '').trim();
  const roleId = payload.roleId ? String(payload.roleId).trim() : undefined;

  if (!name) throw new Error('Name is required');
  if (!email) throw new Error('Email is required');
  if (password.length < 6) throw new Error('Password must be at least 6 characters');

  let allowedSections = normalizeUserSections(payload.allowedSections);
  let roleName: string | undefined;

  if (roleId && !payload.isMainAdmin) {
    const role = await resolveRoleSections(roleId);
    if (!role) throw new Error('Role not found');
    if (!payload.allowedSections?.length) allowedSections = role.allowedSections;
    roleName = role.roleName;
  }

  const uid = await createFirebaseAuthUser(email, password);

  const record: AuthUserRecord = {
    uid,
    email,
    name,
    imageUrl: imageUrl || undefined,
    isMainAdmin: Boolean(payload.isMainAdmin),
    allowedSections: payload.isMainAdmin ? ['*'] : allowedSections,
    roleId: payload.isMainAdmin ? undefined : roleId,
    roleName: payload.isMainAdmin ? undefined : roleName,
    status: 'active',
    createdAt: new Date().toISOString(),
    createdBy: auth.currentUser?.uid,
  };

  await setAuthUserRecord(uid, { ...stripUndefinedDeep(record) });
  return record;
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

  const adminUid = auth.currentUser?.uid;
  if (uid === adminUid && payload.status === 'disabled') {
    throw new Error('You cannot disable your own account');
  }

  const snap = await get(authUserRef(uid));
  if (!snap.exists()) throw new Error('User not found');

  const existing = normalizeAuthUser(uid, snap.val() as Record<string, unknown>);
  const updates: Partial<AuthUserRecord> = {};

  if (typeof payload.name === 'string' && payload.name.trim()) {
    updates.name = payload.name.trim();
  }
  if (typeof payload.imageUrl === 'string') {
    updates.imageUrl = payload.imageUrl.trim();
  }
  if (payload.allowedSections) {
    updates.allowedSections =
      payload.isMainAdmin || existing.isMainAdmin
        ? ['*']
        : normalizeUserSections(payload.allowedSections);
  }
  if (payload.roleId !== undefined) {
    if (payload.roleId === null || payload.roleId === '') {
      await remove(child(authUserRef(uid), 'roleId'));
      await remove(child(authUserRef(uid), 'roleName'));
    } else {
      const roleId = String(payload.roleId).trim();
      const role = await resolveRoleSections(roleId);
      if (!role) throw new Error('Role not found');
      updates.roleId = roleId;
      updates.roleName = role.roleName;
      if (!payload.allowedSections) {
        updates.allowedSections = role.allowedSections;
      }
    }
  }
  if (payload.status === 'active' || payload.status === 'disabled') {
    updates.status = payload.status;
  }
  if (typeof payload.isMainAdmin === 'boolean') {
    updates.isMainAdmin = payload.isMainAdmin;
    if (payload.isMainAdmin) {
      updates.allowedSections = ['*'];
      await remove(child(authUserRef(uid), 'roleId'));
      await remove(child(authUserRef(uid), 'roleName'));
    }
  }

  if (Object.keys(updates).length) {
    await updateAuthUserRecord(uid, stripUndefinedDeep(updates));
  }

  if (payload.password?.trim()) {
    // Password changes require Firebase Admin SDK; skipped on client-only path.
    console.warn('[admin-users] Password update ignored — set FIREBASE_ADMIN_* for server API.');
  }

  const nextSnap = await get(authUserRef(uid));
  return normalizeAuthUser(uid, nextSnap.val() as Record<string, unknown>);
}

export async function disableAdminUser(uid: string): Promise<void> {
  const id = String(uid ?? '').trim();
  if (!id) throw new Error('uid is required');
  if (id === auth.currentUser?.uid) throw new Error('You cannot disable your own account');

  const snap = await get(authUserRef(id));
  if (!snap.exists()) throw new Error('User not found');

  await updateAuthUserRecord(id, { status: 'disabled' });
}
