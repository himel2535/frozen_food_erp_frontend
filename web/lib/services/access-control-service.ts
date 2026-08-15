import type { AuthUserRecord, SectionId } from '@/lib/state/types';
import { ALL_SECTION_IDS, pathToSectionId } from '@/lib/navigation/section-access';
import { TENANT_SIDEBAR_SECTIONS, type SidebarSection } from '@/lib/navigation/tenant-sidebar';
import {
  filterSidebarSectionsByFeatureFlags,
  isRouteEnabledByFeatureFlags,
} from '@/lib/config/module-feature-flags';

export function normalizeAuthUser(
  uid: string,
  raw: Record<string, unknown> | null | undefined,
): AuthUserRecord | null {
  if (!raw) return null;
  const email = String(raw.email ?? '').trim();
  const name = String(raw.name ?? '').trim() || email || 'User';
  const status = String(raw.status ?? 'active').toLowerCase() === 'disabled' ? 'disabled' : 'active';
  const sections = Array.isArray(raw.allowedSections)
    ? (raw.allowedSections as string[])
    : [];
  const hasWildcard = sections.includes('*');
  const allowedSections: Array<SectionId | '*'> = hasWildcard
    ? ['*']
    : (sections.filter((s) => ALL_SECTION_IDS.includes(s as SectionId)) as SectionId[]);

  return {
    uid,
    email,
    name,
    isMainAdmin: Boolean(raw.isMainAdmin),
    allowedSections: allowedSections.length ? allowedSections : (['dashboard'] as SectionId[]),
    roleId: raw.roleId ? String(raw.roleId) : undefined,
    roleName: raw.roleName ? String(raw.roleName) : undefined,
    status,
    createdAt: String(raw.createdAt ?? ''),
    createdBy: raw.createdBy ? String(raw.createdBy) : undefined,
  };
}

export function isMainAdmin(user: AuthUserRecord | null | undefined): boolean {
  return Boolean(user?.isMainAdmin);
}

export function canAccessSection(
  user: AuthUserRecord | null | undefined,
  sectionId: SectionId | string,
): boolean {
  if (!user || user.status === 'disabled') return false;
  if (user.isMainAdmin) return true;
  const sections = user.allowedSections;
  if (sections.includes('*')) return true;
  return (sections as string[]).includes(sectionId);
}

export function canAccessPath(
  user: AuthUserRecord | null | undefined,
  pathname: string,
): boolean {
  if (!user || user.status === 'disabled') return false;
  if (user.isMainAdmin) return true;

  // User management is main-admin only
  const path = pathname.split('?')[0].split('#')[0];
  if (!isRouteEnabledByFeatureFlags(path)) {
    return false;
  }
  if (path === '/settings/users' || path.startsWith('/settings/users/')) {
    return false;
  }
  if (path === '/settings/roles' || path.startsWith('/settings/roles/')) {
    return false;
  }

  const sectionId = pathToSectionId(pathname);
  if (!sectionId) return true;
  return canAccessSection(user, sectionId);
}

export function getVisibleSections(
  user: AuthUserRecord | null | undefined,
): SidebarSection[] {
  if (!user || user.status === 'disabled') return [];
  const base =
    user.isMainAdmin || user.allowedSections.includes('*')
      ? TENANT_SIDEBAR_SECTIONS
      : TENANT_SIDEBAR_SECTIONS.filter((section) =>
          canAccessSection(user, section.id as SectionId),
        );
  return filterSidebarSectionsByFeatureFlags(base);
}

export function getFirstAllowedHref(user: AuthUserRecord | null | undefined): string {
  const sections = getVisibleSections(user);
  if (!sections.length) return '/login';
  return sections[0].href || '/dashboard';
}

export function summarizeSections(user: AuthUserRecord): string {
  if (user.isMainAdmin || user.allowedSections.includes('*')) return 'All sections';
  const labels = getSectionLabels(
    user.allowedSections.filter((s): s is SectionId => s !== '*'),
  );
  if (!labels.length) return 'None';
  if (labels.length <= 3) return labels.join(', ');
  return `${labels.slice(0, 3).join(', ')} +${labels.length - 3}`;
}

export function summarizeRoleSections(sections: SectionId[]): string {
  const labels = getSectionLabels(sections);
  if (!labels.length) return 'None';
  if (labels.length <= 3) return labels.join(', ');
  return `${labels.slice(0, 3).join(', ')} +${labels.length - 3}`;
}

function getSectionLabels(ids: SectionId[]): string[] {
  const map = Object.fromEntries(TENANT_SIDEBAR_SECTIONS.map((s) => [s.id, s.label]));
  return ids.map((id) => map[id] ?? id);
}
