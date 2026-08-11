import { NextResponse } from 'next/server';
import { jsonError, stripUndefinedDeep } from '@/lib/api/admin-route-utils';
import { getAdminAuth, getAdminDatabase, requireMainAdmin } from '@/lib/firebase-admin';
import { ALL_SECTION_IDS } from '@/lib/navigation/section-access';
import type { AuthUserRecord, SectionId } from '@/lib/state/types';

function normalizeSections(input: unknown): Array<SectionId | '*'> {
  if (!Array.isArray(input) || input.length === 0) {
    return ['dashboard'];
  }
  if (input.includes('*')) return ['*'];
  const filtered = input
    .map((s) => String(s))
    .filter((s): s is SectionId => ALL_SECTION_IDS.includes(s as SectionId));
  return filtered.length ? filtered : ['dashboard'];
}

function authErrorStatus(error: unknown): number {
  const message = error instanceof Error ? error.message : '';
  if (message === 'Unauthorized') return 401;
  if (message === 'Forbidden') return 403;
  return 500;
}

async function resolveRoleSections(roleId: string): Promise<{
  allowedSections: Array<SectionId | '*'>;
  roleName?: string;
} | null> {
  const snap = await getAdminDatabase().ref(`toysfactory/auth/roles/${roleId}`).get();
  if (!snap.exists()) return null;
  const raw = snap.val() as { name?: string; allowedSections?: unknown };
  return {
    allowedSections: normalizeSections(raw.allowedSections),
    roleName: raw.name ? String(raw.name) : undefined,
  };
}

export async function GET(request: Request) {
  try {
    await requireMainAdmin(request.headers.get('authorization'));
    const snap = await getAdminDatabase().ref('toysfactory/auth/users').get();
    const raw = (snap.exists() ? snap.val() : {}) as Record<string, Record<string, unknown>>;
    const users: AuthUserRecord[] = Object.entries(raw).map(([uid, value]) => ({
      uid,
      email: String(value.email ?? ''),
      name: String(value.name ?? ''),
      imageUrl: value.imageUrl ? String(value.imageUrl) : undefined,
      isMainAdmin: Boolean(value.isMainAdmin),
      allowedSections: normalizeSections(value.allowedSections),
      roleId: value.roleId ? String(value.roleId) : undefined,
      roleName: value.roleName ? String(value.roleName) : undefined,
      status: String(value.status ?? 'active').toLowerCase() === 'disabled' ? 'disabled' : 'active',
      createdAt: String(value.createdAt ?? ''),
      createdBy: value.createdBy ? String(value.createdBy) : undefined,
    }));
    users.sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ users });
  } catch (error) {
    const status = authErrorStatus(error);
    const message = error instanceof Error ? error.message : 'Failed to list users';
    if (process.env.NODE_ENV === 'development') {
      console.error('[api/admin/users GET]', message);
    }
    return jsonError(message, status);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireMainAdmin(request.headers.get('authorization'));
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      imageUrl?: string;
      allowedSections?: string[];
      roleId?: string;
      isMainAdmin?: boolean;
    };

    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const imageUrl = String(body.imageUrl ?? '').trim();
    const roleId = body.roleId ? String(body.roleId).trim() : undefined;

    let allowedSections = normalizeSections(body.allowedSections);
    let roleName: string | undefined;

    if (roleId && !body.isMainAdmin) {
      const role = await resolveRoleSections(roleId);
      if (!role) return jsonError('Role not found', 404);
      if (!body.allowedSections?.length) {
        allowedSections = role.allowedSections;
      }
      roleName = role.roleName;
    }

    if (!name) return jsonError('Name is required', 400);
    if (!email) return jsonError('Email is required', 400);
    if (password.length < 6) return jsonError('Password must be at least 6 characters', 400);

    const created = await getAdminAuth().createUser({
      email,
      password,
      displayName: name,
      emailVerified: false,
      disabled: false,
    });

    const record: AuthUserRecord = {
      uid: created.uid,
      email,
      name,
      imageUrl: imageUrl || undefined,
      isMainAdmin: Boolean(body.isMainAdmin),
      allowedSections: body.isMainAdmin ? ['*'] : allowedSections,
      roleId: body.isMainAdmin ? undefined : roleId,
      roleName: body.isMainAdmin ? undefined : roleName,
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: admin.uid,
    };

    await getAdminDatabase().ref(`toysfactory/auth/users/${created.uid}`).set(stripUndefinedDeep(record));
    return NextResponse.json({ user: record }, { status: 201 });
  } catch (error) {
    const status = authErrorStatus(error);
    const message = error instanceof Error ? error.message : 'Failed to create user';
    if (message.includes('email already exists') || message.includes('EMAIL_EXISTS')) {
      return jsonError('A user with this email already exists', 409);
    }
    return jsonError(message, status === 500 ? 400 : status);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireMainAdmin(request.headers.get('authorization'));
    const body = (await request.json()) as {
      uid?: string;
      name?: string;
      imageUrl?: string;
      allowedSections?: string[];
      roleId?: string | null;
      status?: 'active' | 'disabled';
      password?: string;
      isMainAdmin?: boolean;
    };

    const uid = String(body.uid ?? '').trim();
    if (!uid) return jsonError('uid is required', 400);
    if (uid === admin.uid && body.status === 'disabled') {
      return jsonError('You cannot disable your own account', 400);
    }

    const dbRef = getAdminDatabase().ref(`toysfactory/auth/users/${uid}`);
    const snap = await dbRef.get();
    if (!snap.exists()) return jsonError('User not found', 404);

    const existing = snap.val() as AuthUserRecord;
    const updates: Partial<AuthUserRecord> = {};

    if (typeof body.name === 'string' && body.name.trim()) {
      updates.name = body.name.trim();
    }
    if (typeof body.imageUrl === 'string') {
      updates.imageUrl = body.imageUrl.trim();
    }
    if (body.allowedSections) {
      updates.allowedSections = body.isMainAdmin || existing.isMainAdmin
        ? ['*']
        : normalizeSections(body.allowedSections);
    }
    if (body.roleId !== undefined) {
      if (body.roleId === null || body.roleId === '') {
        await dbRef.child('roleId').remove();
        await dbRef.child('roleName').remove();
      } else {
        const roleId = String(body.roleId).trim();
        const role = await resolveRoleSections(roleId);
        if (!role) return jsonError('Role not found', 404);
        updates.roleId = roleId;
        updates.roleName = role.roleName;
        if (!body.allowedSections) {
          updates.allowedSections = role.allowedSections;
        }
      }
    }
    if (body.status === 'active' || body.status === 'disabled') {
      updates.status = body.status;
    }
    if (typeof body.isMainAdmin === 'boolean') {
      updates.isMainAdmin = body.isMainAdmin;
      if (body.isMainAdmin) {
        updates.allowedSections = ['*'];
        await dbRef.child('roleId').remove();
        await dbRef.child('roleName').remove();
      }
    }

    if (Object.keys(updates).length) {
      await dbRef.update(stripUndefinedDeep(updates));
    }

    const authUpdates: { displayName?: string; disabled?: boolean; password?: string } = {};
    if (updates.name) authUpdates.displayName = updates.name;
    if (updates.status) authUpdates.disabled = updates.status === 'disabled';
    if (typeof body.password === 'string' && body.password.length >= 6) {
      authUpdates.password = body.password;
    }
    if (Object.keys(authUpdates).length) {
      await getAdminAuth().updateUser(uid, authUpdates);
    }

    const nextSnap = await dbRef.get();
    return NextResponse.json({ user: { uid, ...(nextSnap.val() as object) } });
  } catch (error) {
    const status = authErrorStatus(error);
    return jsonError(error instanceof Error ? error.message : 'Failed to update user', status);
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await requireMainAdmin(request.headers.get('authorization'));
    const { searchParams } = new URL(request.url);
    const uid = String(searchParams.get('uid') ?? '').trim();
    if (!uid) return jsonError('uid is required', 400);
    if (uid === admin.uid) return jsonError('You cannot delete your own account', 400);

    const dbRef = getAdminDatabase().ref(`toysfactory/auth/users/${uid}`);
    const snap = await dbRef.get();
    if (!snap.exists()) return jsonError('User not found', 404);

    await getAdminAuth().updateUser(uid, { disabled: true });
    await dbRef.update({ status: 'disabled' });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = authErrorStatus(error);
    return jsonError(error instanceof Error ? error.message : 'Failed to disable user', status);
  }
}
