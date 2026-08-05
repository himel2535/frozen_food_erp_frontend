import { NextResponse } from 'next/server';
import { handleAdminRouteError, jsonError, stripUndefinedDeep } from '@/lib/api/admin-route-utils';
import { getAdminDatabase, requireMainAdmin } from '@/lib/firebase-admin';
import { ALL_SECTION_IDS } from '@/lib/navigation/section-access';
import type { RoleRecord, SectionId } from '@/lib/state/types';

function normalizeSections(input: unknown): SectionId[] {
  if (!Array.isArray(input) || input.length === 0) {
    return ['dashboard'];
  }
  const filtered = input
    .map((s) => String(s))
    .filter((s): s is SectionId => ALL_SECTION_IDS.includes(s as SectionId));
  return filtered.length ? filtered : ['dashboard'];
}

function normalizeRole(id: string, raw: Record<string, unknown>): RoleRecord {
  return {
    id,
    name: String(raw.name ?? ''),
    description: raw.description ? String(raw.description) : undefined,
    contactEmail: raw.contactEmail ? String(raw.contactEmail) : undefined,
    notes: raw.notes ? String(raw.notes) : undefined,
    allowedSections: normalizeSections(raw.allowedSections),
    status: String(raw.status ?? 'active').toLowerCase() === 'inactive' ? 'inactive' : 'active',
    isPreset: Boolean(raw.isPreset),
    createdAt: String(raw.createdAt ?? ''),
    createdBy: raw.createdBy ? String(raw.createdBy) : undefined,
  };
}

function generateRoleId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const suffix = Date.now().toString(36).slice(-4);
  return slug ? `${slug}-${suffix}` : `role-${suffix}`;
}

async function countUsersByRole(): Promise<Record<string, number>> {
  const snap = await getAdminDatabase().ref('toysfactory/auth/users').get();
  const raw = (snap.exists() ? snap.val() : {}) as Record<string, Record<string, unknown>>;
  const counts: Record<string, number> = {};
  for (const value of Object.values(raw)) {
    const roleId = value.roleId ? String(value.roleId) : '';
    if (roleId) {
      counts[roleId] = (counts[roleId] ?? 0) + 1;
    }
  }
  return counts;
}

export async function GET(request: Request) {
  try {
    await requireMainAdmin(request.headers.get('authorization'));
    const { searchParams } = new URL(request.url);
    if (searchParams.get('counts') === '1') {
      const counts = await countUsersByRole();
      return NextResponse.json({ counts });
    }

    const snap = await getAdminDatabase().ref('toysfactory/auth/roles').get();
    const raw = (snap.exists() ? snap.val() : {}) as Record<string, Record<string, unknown>>;
    const roles: RoleRecord[] = Object.entries(raw).map(([id, value]) => normalizeRole(id, value));
    roles.sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ roles });
  } catch (error) {
    return handleAdminRouteError(error, 'Failed to list roles', '[api/admin/roles GET]');
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireMainAdmin(request.headers.get('authorization'));
    const body = (await request.json()) as {
      name?: string;
      description?: string;
      contactEmail?: string;
      notes?: string;
      allowedSections?: string[];
      status?: 'active' | 'inactive';
      isPreset?: boolean;
    };

    const name = String(body.name ?? '').trim();
    if (!name) return jsonError('Role name is required', 400);

    const allowedSections = normalizeSections(body.allowedSections);
    const id = generateRoleId(name);

    const record: RoleRecord = {
      id,
      name,
      description: body.description ? String(body.description).trim() : undefined,
      contactEmail: body.contactEmail ? String(body.contactEmail).trim().toLowerCase() : undefined,
      notes: body.notes ? String(body.notes).trim() : undefined,
      allowedSections,
      status: body.status === 'inactive' ? 'inactive' : 'active',
      isPreset: Boolean(body.isPreset),
      createdAt: new Date().toISOString(),
      createdBy: admin.uid,
    };

    await getAdminDatabase().ref(`toysfactory/auth/roles/${id}`).set(stripUndefinedDeep(record));
    return NextResponse.json({ role: record }, { status: 201 });
  } catch (error) {
    return handleAdminRouteError(error, 'Failed to create role', '[api/admin/roles POST]');
  }
}

export async function PATCH(request: Request) {
  try {
    await requireMainAdmin(request.headers.get('authorization'));
    const body = (await request.json()) as {
      id?: string;
      name?: string;
      description?: string;
      contactEmail?: string;
      notes?: string;
      allowedSections?: string[];
      status?: 'active' | 'inactive';
    };

    const id = String(body.id ?? '').trim();
    if (!id) return jsonError('Role id is required', 400);

    const dbRef = getAdminDatabase().ref(`toysfactory/auth/roles/${id}`);
    const snap = await dbRef.get();
    if (!snap.exists()) return jsonError('Role not found', 404);

    const existing = normalizeRole(id, snap.val() as Record<string, unknown>);
    const updates: Partial<RoleRecord> = {};

    if (typeof body.name === 'string' && body.name.trim()) {
      updates.name = body.name.trim();
    }
    if (typeof body.description === 'string') {
      updates.description = body.description.trim() || undefined;
    }
    if (typeof body.contactEmail === 'string') {
      updates.contactEmail = body.contactEmail.trim().toLowerCase() || undefined;
    }
    if (typeof body.notes === 'string') {
      updates.notes = body.notes.trim() || undefined;
    }
    if (body.allowedSections) {
      updates.allowedSections = normalizeSections(body.allowedSections);
    }
    if (body.status === 'active' || body.status === 'inactive') {
      updates.status = body.status;
    }

    if (Object.keys(updates).length) {
      await dbRef.update(stripUndefinedDeep(updates));
    }

    if (updates.name && updates.name !== existing.name) {
      const usersSnap = await getAdminDatabase().ref('toysfactory/auth/users').get();
      if (usersSnap.exists()) {
        const users = usersSnap.val() as Record<string, Record<string, unknown>>;
        const userUpdates: Record<string, unknown> = {};
        for (const [uid, user] of Object.entries(users)) {
          if (String(user.roleId ?? '') === id) {
            userUpdates[`toysfactory/auth/users/${uid}/roleName`] = updates.name;
          }
        }
        if (Object.keys(userUpdates).length) {
          await getAdminDatabase().ref().update(userUpdates);
        }
      }
    }

    const nextSnap = await dbRef.get();
    return NextResponse.json({ role: normalizeRole(id, nextSnap.val() as Record<string, unknown>) });
  } catch (error) {
    return handleAdminRouteError(error, 'Failed to update role', '[api/admin/roles PATCH]');
  }
}

export async function DELETE(request: Request) {
  try {
    await requireMainAdmin(request.headers.get('authorization'));
    const { searchParams } = new URL(request.url);
    const id = String(searchParams.get('id') ?? '').trim();
    if (!id) return jsonError('Role id is required', 400);

    const dbRef = getAdminDatabase().ref(`toysfactory/auth/roles/${id}`);
    const snap = await dbRef.get();
    if (!snap.exists()) return jsonError('Role not found', 404);

    const counts = await countUsersByRole();
    if ((counts[id] ?? 0) > 0) {
      await dbRef.update({ status: 'inactive' });
      return NextResponse.json({ ok: true, deactivated: true });
    }

    await dbRef.remove();
    return NextResponse.json({ ok: true, deactivated: false });
  } catch (error) {
    return handleAdminRouteError(error, 'Failed to deactivate role', '[api/admin/roles DELETE]');
  }
}
