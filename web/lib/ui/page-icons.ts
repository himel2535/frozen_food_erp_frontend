import {
  TENANT_SIDEBAR_SECTIONS,
  type SidebarItem,
} from '@/lib/navigation/tenant-sidebar';

export interface PageIconEntry {
  icon: string;
  sectionId: string;
}

const DEFAULT_ICON = 'fluent-color:apps-24';

/** Routes not covered by sidebar nav (forms, aliases, utility pages) */
const EXTRA_PAGE_ICONS: Record<string, PageIconEntry> = {
  '/messages': { icon: 'fluent-color:comment-multiple-24', sectionId: 'sales-crm' },
  '/alerts': { icon: 'fluent-color:alert-badge-24', sectionId: 'dashboard' },
  '/super-admin': { icon: 'fluent-color:shield-lock-24', sectionId: 'administration' },
  '/design-system': { icon: 'fluent-color:design-ideas-24', sectionId: 'administration' },
  '/crm/activities': { icon: 'fluent-color:calendar-24', sectionId: 'sales-crm' },
  '/sales/wholesale': { icon: 'flat-color-icons:shop', sectionId: 'sales-crm' },
  '/purchases/recipes': { icon: 'flat-color-icons:todo-list', sectionId: 'purchases' },
  '/recipes/finished-goods': { icon: 'flat-color-icons:approval', sectionId: 'purchases' },
  '/recipes/semi-finished': { icon: 'fluent-color:puzzle-piece-24', sectionId: 'purchases' },
  '/sales/orders/new': { icon: 'fluent-color:clipboard-task-24', sectionId: 'sales-crm' },
  '/purchases/orders/new': { icon: 'fluent-color:document-add-24', sectionId: 'purchases' },
  '/payroll/structures/new': { icon: 'fluent-color:table-24', sectionId: 'payroll' },
  '/projects/new': { icon: 'fluent-color:document-add-24', sectionId: 'projects' },
  '/payroll/salary-sheet': { icon: 'flat-color-icons:calculator', sectionId: 'payroll' },
  '/accounting/receivables': { icon: 'flat-color-icons:positive-dynamic', sectionId: 'accounts' },
};

function collectSidebarIcons(): Record<string, PageIconEntry> {
  const map: Record<string, PageIconEntry> = {};

  function walkItem(item: SidebarItem, sectionId: string) {
    if (item.href && item.iconifyIcon) {
      map[item.href] = { icon: item.iconifyIcon, sectionId };
    }
    item.children?.forEach((child) => walkItem(child, sectionId));
  }

  for (const section of TENANT_SIDEBAR_SECTIONS) {
    if (section.href && section.iconifyIcon) {
      map[section.href] = { icon: section.iconifyIcon, sectionId: section.id };
    }
    section.items.forEach((item) => walkItem(item, section.id));
  }

  return map;
}

const PAGE_ICON_MAP: Record<string, PageIconEntry> = {
  ...collectSidebarIcons(),
  ...EXTRA_PAGE_ICONS,
};

const SORTED_ROUTES = Object.keys(PAGE_ICON_MAP).sort((a, b) => b.length - a.length);

const SEGMENT_FALLBACK: Record<string, PageIconEntry> = {
  dashboard: { icon: 'fluent-color:apps-24', sectionId: 'dashboard' },
  crm: { icon: 'fluent-color:people-interwoven-24', sectionId: 'sales-crm' },
  sales: { icon: 'fluent-color:people-interwoven-24', sectionId: 'sales-crm' },
  inventory: { icon: 'flat-color-icons:package', sectionId: 'inventory' },
  purchases: { icon: 'flat-color-icons:shop', sectionId: 'purchases' },
  recipes: { icon: 'flat-color-icons:todo-list', sectionId: 'purchases' },
  manufacturing: { icon: 'flat-color-icons:factory', sectionId: 'factory' },
  accounting: { icon: 'flat-color-icons:money-transfer', sectionId: 'accounts' },
  hrm: { icon: 'fluent-color:contact-card-24', sectionId: 'hrm' },
  payroll: { icon: 'fluent-color:coin-multiple-24', sectionId: 'payroll' },
  projects: { icon: 'fluent-color:document-folder-24', sectionId: 'projects' },
  'asset-management': { icon: 'fluent-color:toolbox-24', sectionId: 'assets' },
  'workflow-approvals': { icon: 'fluent-color:approvals-app-24', sectionId: 'approvals' },
  reports: { icon: 'fluent-color:chart-multiple-24', sectionId: 'reports' },
  settings: { icon: 'fluent-color:settings-24', sectionId: 'settings' },
};

function normalizePath(pathname: string): string {
  const path = pathname.split('?')[0].split('#')[0].replace(/\/$/, '');
  return path || '/dashboard';
}

export function getPageIconEntry(pathname: string): PageIconEntry {
  const path = normalizePath(pathname);

  if (PAGE_ICON_MAP[path]) return PAGE_ICON_MAP[path];

  for (const route of SORTED_ROUTES) {
    if (path === route || path.startsWith(`${route}/`)) {
      return PAGE_ICON_MAP[route];
    }
  }

  const first = path.split('/').filter(Boolean)[0];
  if (first && SEGMENT_FALLBACK[first]) return SEGMENT_FALLBACK[first];

  return { icon: DEFAULT_ICON, sectionId: 'dashboard' };
}

export function getPageIcon(pathname: string): string {
  return getPageIconEntry(pathname).icon;
}
