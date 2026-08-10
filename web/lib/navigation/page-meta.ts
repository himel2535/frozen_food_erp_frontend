import { MODULE_REGISTRY } from '@/lib/modules/module-metadata';
import { DEDICATED_MODULE_I18N, type TranslateFn } from '@/lib/i18n/resolve-label';
import { TENANT_SIDEBAR_SECTIONS, type SidebarItem } from '@/lib/navigation/tenant-sidebar';
import { getPageIcon } from '@/lib/ui/page-icons';

export interface PageMeta {
  title: string;
  subtitle: string;
  icon: string;
  configId?: string;
}

type MetaSource = {
  titleKey?: string;
  subtitleKey?: string;
  title?: string;
  subtitle?: string;
  configId?: string;
};

const CONFIG_ID_HREF_OVERRIDES: Record<string, string> = {
  projects: '/projects',
  'asset-management': '/asset-management',
  'workflow-approvals': '/workflow-approvals',
  notifications: '/alerts',
};

function configIdToHref(configId: string): string {
  if (CONFIG_ID_HREF_OVERRIDES[configId]) return CONFIG_ID_HREF_OVERRIDES[configId];
  const idx = configId.indexOf('-');
  if (idx === -1) return `/${configId}`;
  return `/${configId.slice(0, idx)}/${configId.slice(idx + 1)}`;
}

function normalizePath(pathname: string): string {
  const path = pathname.split('?')[0].split('#')[0].replace(/\/$/, '');
  return path || '/dashboard';
}

/** Settings overview pages with in-page headers — hide the shared module title bar. */
export const HEADERLESS_MODULE_PATHS = new Set([
  '/settings/profile',
  '/settings/company',
  '/settings/signatures',
  '/sales/pos',
]);

export function isHeaderlessModulePath(pathname: string): boolean {
  return HEADERLESS_MODULE_PATHS.has(normalizePath(pathname));
}

function resolveMetaSource(source: MetaSource, t: TranslateFn): { title: string; subtitle: string } {
  const title = source.titleKey ? t(source.titleKey) : (source.title ?? '');
  const subtitle = source.subtitleKey ? t(source.subtitleKey) : (source.subtitle ?? '');
  return { title, subtitle };
}

function walkSidebar(item: SidebarItem, sources: Record<string, MetaSource>) {
  if (item.href && !sources[item.href]) {
    sources[item.href] = { title: item.label };
  }
  item.children?.forEach((child) => walkSidebar(child, sources));
}

const HREF_META_SOURCES: Record<string, MetaSource> = {};

for (const [configId, reg] of Object.entries(MODULE_REGISTRY)) {
  const href = configIdToHref(configId);
  const i18n = DEDICATED_MODULE_I18N[configId];
  HREF_META_SOURCES[href] = {
    configId,
    titleKey: i18n?.title,
    subtitleKey: i18n?.subtitle,
    title: reg.title,
    subtitle: reg.subtitle,
  };
}

for (const section of TENANT_SIDEBAR_SECTIONS) {
  if (section.href && !HREF_META_SOURCES[section.href]) {
    HREF_META_SOURCES[section.href] = { title: section.label };
  }
  section.items.forEach((item) => walkSidebar(item, HREF_META_SOURCES));
}

/** Routes with i18n titles or subtitles not covered by MODULE_REGISTRY alone. */
const CUSTOM_PAGE_META: Record<string, MetaSource> = {
  '/dashboard': { titleKey: 'sidebar.dashboard', subtitleKey: 'dashboard.happening' },
  '/crm/leads': { titleKey: 'crm.leads_title', subtitle: 'Track and convert sales opportunities.' },
  '/crm/customers': { titleKey: 'crm.customers_title', subtitle: 'Manage customer profiles, credit terms, and sales history.' },
  '/crm/deals': { titleKey: 'crm.deals_title', subtitle: 'Track deal stages, values, and follow-ups.' },
  '/crm/complaints': { titleKey: 'crm.complaints_title', subtitle: 'Track, manage and resolve customer complaints efficiently.' },
  '/purchases/suppliers': {
    titleKey: 'common.suppliers',
    subtitle: 'Manage supplier relationships, purchases and payments.',
  },
  '/purchases/purchase-rm': { title: 'Purchase RM', subtitle: 'Record raw material purchase receipts.' },
  '/inventory/semi-finished-products': {
    title: 'Semi-Finished Products',
    subtitle: 'Manage semi-finished product catalog and BOM.',
  },
  '/inventory/finished-goods': { title: 'Finished Goods', subtitle: 'Manage finished goods catalog and stock.' },
  '/accounting/cashbox': { title: 'Cashbox', subtitle: 'Track cash inflows and outflows.' },
  '/manufacturing/orders': { title: 'Production', subtitle: 'Production order management.' },
  '/messages': { titleKey: 'messages.title', subtitleKey: 'messages.subtitle' },
  '/alerts': { titleKey: 'alerts.title', subtitleKey: 'alerts.subtitle' },
  '/reports/sales': { titleKey: 'reports.sales_title', subtitleKey: 'reports.sales_subtitle' },
  '/reports/purchases': { titleKey: 'reports.purchases_title', subtitleKey: 'reports.purchases_subtitle' },
  '/reports/inventory': { titleKey: 'reports.inventory_title', subtitleKey: 'reports.inventory_subtitle' },
  '/reports/customers': { titleKey: 'reports.customers_title', subtitleKey: 'reports.customers_subtitle' },
  '/reports/suppliers': { titleKey: 'reports.suppliers_title', subtitleKey: 'reports.suppliers_subtitle' },
  '/reports/financial': { titleKey: 'reports.financial_title', subtitleKey: 'reports.financial_subtitle' },
  '/reports/hr': { titleKey: 'reports.hr_title', subtitleKey: 'reports.hr_subtitle' },
  '/settings/profile': { titleKey: 'settings.profile_title', subtitleKey: 'settings.profile_subtitle' },
  '/settings/company': { titleKey: 'settings.company_title', subtitleKey: 'settings.company_subtitle' },
  '/settings/signatures': { titleKey: 'settings.signatures_title', subtitleKey: 'settings.signatures_subtitle' },
  '/settings/alert-settings': { titleKey: 'alerts.settings_title', subtitleKey: 'alerts.settings_subtitle' },
  '/payroll/salary-sheet': { title: 'Salary Sheet', subtitle: 'Monthly payroll processing and review.' },
  '/payroll/payments-due': { title: 'Payments & Due', subtitle: 'Track payroll payments and outstanding dues.' },
  '/sales/orders/new': { title: 'New Sales Order', subtitle: 'Create a confirmed sales order.' },
  '/purchases/orders/new': { title: 'New Purchase Order', subtitle: 'Create a purchase order for suppliers.' },
  '/payroll/structures/new': { title: 'New Salary Structure', subtitle: 'Define salary components and rules.' },
  '/projects/new': { title: 'New Project', subtitle: 'Create a project with milestones.' },
};

Object.assign(HREF_META_SOURCES, CUSTOM_PAGE_META);

const SORTED_HREFS = Object.keys(HREF_META_SOURCES).sort((a, b) => b.length - a.length);

export function getPageMeta(pathname: string, t: TranslateFn): PageMeta {
  const path = normalizePath(pathname);
  const icon = getPageIcon(path);

  for (const href of SORTED_HREFS) {
    if (path === href || path.startsWith(`${href}/`)) {
      const source = HREF_META_SOURCES[href];
      const { title, subtitle } = resolveMetaSource(source, t);
      return { title, subtitle, icon, configId: source.configId };
    }
  }

  const segment = path.split('/').filter(Boolean).pop() ?? 'dashboard';
  return {
    title: segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    subtitle: t('common.page_subtitle_manage'),
    icon,
  };
}
