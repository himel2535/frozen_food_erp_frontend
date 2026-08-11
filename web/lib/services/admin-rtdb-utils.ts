import { ALL_SECTION_IDS } from '@/lib/navigation/section-access';
import type { AuthUserRecord, RoleRecord, SectionId } from '@/lib/state/types';

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

export function normalizeRoleSections(input: unknown): SectionId[] {
  if (!Array.isArray(input) || input.length === 0) return ['dashboard'];
  const filtered = input
    .map((s) => String(s))
    .filter((s): s is SectionId => ALL_SECTION_IDS.includes(s as SectionId));
  return filtered.length ? filtered : ['dashboard'];
}

export function normalizeUserSections(input: unknown): Array<SectionId | '*'> {
  if (!Array.isArray(input) || input.length === 0) return ['dashboard'];
  if (input.includes('*')) return ['*'];
  const filtered = input
    .map((s) => String(s))
    .filter((s): s is SectionId => ALL_SECTION_IDS.includes(s as SectionId));
  return filtered.length ? filtered : ['dashboard'];
}

export function normalizeRole(id: string, raw: Record<string, unknown>): RoleRecord {
  return {
    id,
    name: String(raw.name ?? ''),
    description: raw.description ? String(raw.description) : undefined,
    contactEmail: raw.contactEmail ? String(raw.contactEmail) : undefined,
    notes: raw.notes ? String(raw.notes) : undefined,
    allowedSections: normalizeRoleSections(raw.allowedSections),
    status: String(raw.status ?? 'active').toLowerCase() === 'inactive' ? 'inactive' : 'active',
    isPreset: Boolean(raw.isPreset),
    createdAt: String(raw.createdAt ?? ''),
    createdBy: raw.createdBy ? String(raw.createdBy) : undefined,
  };
}

export function normalizeAuthUser(uid: string, raw: Record<string, unknown>): AuthUserRecord {
  return {
    uid,
    email: String(raw.email ?? ''),
    name: String(raw.name ?? ''),
    imageUrl: raw.imageUrl ? String(raw.imageUrl) : undefined,
    isMainAdmin: Boolean(raw.isMainAdmin),
    allowedSections: normalizeUserSections(raw.allowedSections),
    roleId: raw.roleId ? String(raw.roleId) : undefined,
    roleName: raw.roleName ? String(raw.roleName) : undefined,
    status: String(raw.status ?? 'active').toLowerCase() === 'disabled' ? 'disabled' : 'active',
    createdAt: String(raw.createdAt ?? ''),
    createdBy: raw.createdBy ? String(raw.createdBy) : undefined,
  };
}

export function generateRoleId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const suffix = Date.now().toString(36).slice(-4);
  return slug ? `${slug}-${suffix}` : `role-${suffix}`;
}
