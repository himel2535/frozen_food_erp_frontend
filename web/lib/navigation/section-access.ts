import type { SectionId } from '@/lib/state/types';
import { TENANT_SIDEBAR_SECTIONS } from '@/lib/navigation/tenant-sidebar';

export const ALL_SECTION_IDS: SectionId[] = [
  'dashboard',
  'sales-crm',
  'inventory',
  'purchases',
  'factory',
  'accounts',
  'hrm',
  'payroll',
  'projects',
  'assets',
  'approvals',
  'reports',
  'administration',
  'settings',
];

export function getSectionOptions(): Array<{ id: SectionId; label: string }> {
  return TENANT_SIDEBAR_SECTIONS.map((s) => ({
    id: s.id as SectionId,
    label: s.label,
  }));
}

/** Map a pathname to its sidebar section id. */
export function pathToSectionId(pathname: string): SectionId | null {
  const path = pathname.split('?')[0].split('#')[0];
  const parts = path.split('/').filter(Boolean);
  const first = parts[0] ?? 'dashboard';

  if (first === 'settings') {
    const view = parts[1];
    if (view === 'profile' || view === 'company' || view === 'signatures') return 'settings';
    return 'administration';
  }

  const map: Record<string, SectionId> = {
    dashboard: 'dashboard',
    crm: 'sales-crm',
    sales: 'sales-crm',
    inventory: 'inventory',
    purchases: 'purchases',
    recipes: 'purchases',
    manufacturing: 'factory',
    accounting: 'accounts',
    hrm: 'hrm',
    payroll: 'payroll',
    projects: 'projects',
    'asset-management': 'assets',
    'workflow-approvals': 'approvals',
    reports: 'reports',
    messages: 'sales-crm',
    alerts: 'dashboard',
    notifications: 'dashboard',
    'super-admin': 'administration',
    'design-system': 'administration',
  };

  return map[first] ?? null;
}
